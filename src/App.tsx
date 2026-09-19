import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type UIEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { GameEnvironment } from './GameEnvironment';
import { Sprite } from './sprites/Sprite';

const ICON_COUNT = 25;
const SLOT_HEIGHT = 58;
const REPEAT_COUNT = 7;
const MIDDLE_CYCLE = Math.floor(REPEAT_COUNT / 2);
const INITIAL_ICON = 13;
const INITIAL_ABSOLUTE_INDEX = MIDDLE_CYCLE * ICON_COUNT + INITIAL_ICON - 1;
const MAX_FLICK_SLOTS = 6;

type RailCategory = 'Food' | 'Animals';

const LOOPED_ICONS = Array.from(
  { length: ICON_COUNT * REPEAT_COUNT },
  (_, absoluteIndex) => ({
    absoluteIndex,
    spriteNumber: (absoluteIndex % ICON_COUNT) + 1,
  }),
);

type Drag = {
  pointerId: number;
  startY: number;
  startScrollTop: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  moved: boolean;
};

function wrappedIndex(absoluteIndex: number) {
  return ((absoluteIndex % ICON_COUNT) + ICON_COUNT) % ICON_COUNT;
}

function scrollTopFor(rail: HTMLDivElement, absoluteIndex: number) {
  return absoluteIndex * SLOT_HEIGHT + SLOT_HEIGHT / 2 - rail.clientHeight / 2;
}

function absoluteIndexAtCenter(rail: HTMLDivElement) {
  return (rail.scrollTop + rail.clientHeight / 2 - SLOT_HEIGHT / 2) / SLOT_HEIGHT;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

type IconRailProps = {
  category: RailCategory;
  onBack: () => void;
};

function IconRail({ category, onBack }: IconRailProps) {
  const [selectedSpriteNumber, setSelectedSpriteNumber] = useState(INITIAL_ICON);
  const railRef = useRef<HTMLDivElement>(null);
  const focusFrameRef = useRef<number | null>(null);
  const settleFrameRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const suppressTapRef = useRef(false);
  const selectedAbsoluteRef = useRef(INITIAL_ABSOLUTE_INDEX);
  const activeSlotsRef = useRef<Set<HTMLDivElement>>(new Set());

  function updateVisualFocus(rail: HTMLDivElement) {
    const centerIndex = absoluteIndexAtCenter(rail);
    const nextActiveSlots = new Set<HTMLDivElement>();
    const firstNearbyIndex = Math.max(Math.floor(centerIndex) - 7, 0);
    const lastNearbyIndex = Math.min(Math.ceil(centerIndex) + 7, LOOPED_ICONS.length - 1);

    for (let absoluteIndex = firstNearbyIndex; absoluteIndex <= lastNearbyIndex; absoluteIndex += 1) {
      const slot = rail.children.item(absoluteIndex) as HTMLDivElement | null;
      if (!slot) continue;
      const distance = Math.abs(absoluteIndex - centerIndex);
      const focus = Math.max(0, 1 - distance / 1.35);
      slot.style.setProperty('--focus', focus.toFixed(3));
      nextActiveSlots.add(slot);
    }

    activeSlotsRef.current.forEach((slot) => {
      if (!nextActiveSlots.has(slot)) slot.style.removeProperty('--focus');
    });
    activeSlotsRef.current = nextActiveSlots;
  }

  function commitSelection(rail: HTMLDivElement, absoluteIndex: number) {
    const previousSlot = rail.children.item(selectedAbsoluteRef.current) as HTMLDivElement | null;
    const nextSlot = rail.children.item(absoluteIndex) as HTMLDivElement | null;

    previousSlot?.classList.remove('is-locked');

    if (nextSlot) {
      nextSlot.classList.remove('is-locked');
      // Restart the small lock-in response even when the same sprite is selected again.
      void nextSlot.offsetWidth;
      nextSlot.classList.add('is-locked');
    }
    selectedAbsoluteRef.current = absoluteIndex;
    setSelectedSpriteNumber(wrappedIndex(absoluteIndex) + 1);
  }

  function recenterLoop(rail: HTMLDivElement, absoluteIndex: number) {
    const middleIndex = MIDDLE_CYCLE * ICON_COUNT + wrappedIndex(absoluteIndex);
    if (absoluteIndex === middleIndex) return;

    rail.scrollTop = scrollTopFor(rail, middleIndex);
    commitSelection(rail, middleIndex);
    updateVisualFocus(rail);
  }

  function stopSettleAnimation() {
    if (settleFrameRef.current !== null) {
      cancelAnimationFrame(settleFrameRef.current);
      settleFrameRef.current = null;
    }
    railRef.current?.classList.remove('is-settling');
  }

  function settleToIndex(rail: HTMLDivElement, requestedIndex: number) {
    stopSettleAnimation();
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }

    const targetIndex = clamp(requestedIndex, 0, LOOPED_ICONS.length - 1);
    const startTop = rail.scrollTop;
    const targetTop = scrollTopFor(rail, targetIndex);
    const distance = targetTop - startTop;
    const duration = clamp(150 + Math.abs(distance) * 0.48, 170, 270);
    const startTime = performance.now();

    rail.classList.add('is-settling');

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      rail.scrollTop = startTop + distance * eased;

      if (progress < 1) {
        settleFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      settleFrameRef.current = null;
      rail.classList.remove('is-settling');
      commitSelection(rail, targetIndex);
      recenterLoop(rail, targetIndex);
    };

    settleFrameRef.current = requestAnimationFrame(animate);
  }

  function settleNearest(rail: HTMLDivElement) {
    settleToIndex(rail, Math.round(absoluteIndexAtCenter(rail)));
  }

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const alignRail = () => {
      rail.scrollTop = scrollTopFor(rail, selectedAbsoluteRef.current);
      updateVisualFocus(rail);
    };

    alignRail();
    const resizeObserver = new ResizeObserver(alignRail);
    resizeObserver.observe(rail);

    return () => {
      resizeObserver.disconnect();
      stopSettleAnimation();
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
      if (focusFrameRef.current !== null) cancelAnimationFrame(focusFrameRef.current);
    };
  }, []);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const rail = event.currentTarget;
    if (focusFrameRef.current !== null) return;

    focusFrameRef.current = requestAnimationFrame(() => {
      updateVisualFocus(rail);
      focusFrameRef.current = null;
    });
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;

    stopSettleAnimation();
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);

    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: event.currentTarget.scrollTop,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
      moved: false,
    };
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const distance = event.clientY - drag.startY;
    const elapsed = Math.max(event.timeStamp - drag.lastTime, 1);
    const instantaneousVelocity = -(event.clientY - drag.lastY) / elapsed;

    if (!drag.moved && Math.abs(distance) > 5) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add('is-dragging');
    }
    if (drag.moved) {
      drag.velocity = drag.velocity * 0.68 + instantaneousVelocity * 0.32;
      event.currentTarget.scrollTop = drag.startScrollTop - distance * 0.82;
    }

    drag.lastY = event.clientY;
    drag.lastTime = event.timeStamp;
  }

  function finishDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.currentTarget.classList.remove('is-dragging');
    dragRef.current = null;

    if (!drag.moved) return;

    suppressTapRef.current = true;
    window.setTimeout(() => {
      suppressTapRef.current = false;
    }, 0);

    const currentIndex = absoluteIndexAtCenter(event.currentTarget);
    const nearestIndex = Math.round(currentIndex);
    const projectedSlots = clamp((drag.velocity * 135) / SLOT_HEIGHT, -MAX_FLICK_SLOTS, MAX_FLICK_SLOTS);
    const targetIndex = Math.round(nearestIndex + projectedSlots);
    settleToIndex(event.currentTarget, targetIndex);
  }

  function handleRailTap(event: ReactMouseEvent<HTMLDivElement>) {
    if (suppressTapRef.current) return;

    const slot = (event.target as HTMLElement).closest<HTMLElement>('.icon-slot');
    const absoluteIndex = Number(slot?.dataset.absoluteIndex);
    if (!Number.isInteger(absoluteIndex)) return;

    settleToIndex(event.currentTarget, absoluteIndex);
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    stopSettleAnimation();

    const rail = event.currentTarget;
    const movement = clamp(event.deltaY, -80, 80) * 0.42;
    rail.scrollTop += movement;

    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => settleNearest(rail), 90);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const direction = event.key === 'ArrowUp' ? -1 : 1;
    settleToIndex(event.currentTarget, selectedAbsoluteRef.current + direction);
  }

  return (
    <div className={`rail-mode ${category.toLowerCase()}`}>
      <section
        className="detail-panel"
        aria-label={`${category} ${selectedSpriteNumber} selected`}
        aria-live="polite"
      >
        <Sprite
          key={`${category}-${selectedSpriteNumber}`}
          category={category}
          spriteNumber={selectedSpriteNumber}
          size={64}
          className="detail-sprite"
        />
        <div className="detail-copy">
          <strong>
            {category === 'Food' ? 'Food' : 'Animal'} {selectedSpriteNumber}
          </strong>
          <p>Selected and ready to use in the game.</p>
        </div>
      </section>
      <aside className="icon-rail-shell" aria-label={`${category} sprite carousel`}>
        <div
          ref={railRef}
          className="icon-rail"
          onScroll={handleScroll}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onClick={handleRailTap}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {LOOPED_ICONS.map(({ absoluteIndex, spriteNumber }) => (
            <div
              className="icon-slot"
              data-absolute-index={absoluteIndex}
              key={absoluteIndex}
            >
              <Sprite
                category={category}
                spriteNumber={spriteNumber}
                size={32}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </aside>
      <button type="button" className="back-button" onClick={onBack} aria-label="Back to categories">
        <span aria-hidden="true">←</span>
      </button>
    </div>
  );
}

export function App() {
  const [activeCategory, setActiveCategory] = useState<RailCategory | null>(null);

  return (
    <main className="phone-canvas">
      <GameEnvironment />
      {activeCategory ? (
        <IconRail
          key={activeCategory}
          category={activeCategory}
          onBack={() => setActiveCategory(null)}
        />
      ) : (
        <nav className="category-picker" aria-label="Sprite categories">
          <button
            type="button"
            className="category-button food-button"
            onClick={() => setActiveCategory('Food')}
          >
            Food
          </button>
          <button
            type="button"
            className="category-button animals-button"
            onClick={() => setActiveCategory('Animals')}
          >
            Animals
          </button>
        </nav>
      )}
    </main>
  );
}
