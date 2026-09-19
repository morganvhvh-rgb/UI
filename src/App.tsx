import {
  useLayoutEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type UIEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { Sprite } from './sprites/Sprite';

const ICON_COUNT = 25;
const SLOT_HEIGHT = 58;
const REPEAT_COUNT = 7;
const MIDDLE_CYCLE = Math.floor(REPEAT_COUNT / 2);
const INITIAL_ICON = 13;
const INITIAL_ABSOLUTE_INDEX = MIDDLE_CYCLE * ICON_COUNT + INITIAL_ICON - 1;
const MAX_FLICK_SLOTS = 2;

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

export function App() {
  const railRef = useRef<HTMLDivElement>(null);
  const focusFrameRef = useRef<number | null>(null);
  const settleFrameRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const suppressClickRef = useRef(false);
  const selectedAbsoluteRef = useRef(INITIAL_ABSOLUTE_INDEX);
  const activeSlotsRef = useRef<Set<HTMLButtonElement>>(new Set());

  function updateVisualFocus(rail: HTMLDivElement) {
    const centerIndex = absoluteIndexAtCenter(rail);
    const nextActiveSlots = new Set<HTMLButtonElement>();
    const firstNearbyIndex = Math.max(Math.floor(centerIndex) - 7, 0);
    const lastNearbyIndex = Math.min(Math.ceil(centerIndex) + 7, LOOPED_ICONS.length - 1);

    for (let absoluteIndex = firstNearbyIndex; absoluteIndex <= lastNearbyIndex; absoluteIndex += 1) {
      const slot = rail.children.item(absoluteIndex) as HTMLButtonElement | null;
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
    const previousSlot = rail.children.item(selectedAbsoluteRef.current) as HTMLButtonElement | null;
    const nextSlot = rail.children.item(absoluteIndex) as HTMLButtonElement | null;

    previousSlot?.setAttribute('aria-pressed', 'false');
    previousSlot?.classList.remove('is-locked');
    if (previousSlot) previousSlot.tabIndex = -1;

    nextSlot?.setAttribute('aria-pressed', 'true');
    if (nextSlot) {
      nextSlot.tabIndex = 0;
      nextSlot.classList.remove('is-locked');
      // Restart the small lock-in response even when the same food is selected again.
      void nextSlot.offsetWidth;
      nextSlot.classList.add('is-locked');
    }
    selectedAbsoluteRef.current = absoluteIndex;
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

  function centerIcon(absoluteIndex: number) {
    if (suppressClickRef.current || !railRef.current) return;
    settleToIndex(railRef.current, absoluteIndex);
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
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add('is-dragging');
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const distance = event.clientY - drag.startY;
    const elapsed = Math.max(event.timeStamp - drag.lastTime, 1);
    const instantaneousVelocity = -(event.clientY - drag.lastY) / elapsed;

    if (!drag.moved && Math.abs(distance) > 5) drag.moved = true;
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

    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);

    const currentIndex = absoluteIndexAtCenter(event.currentTarget);
    const nearestIndex = Math.round(currentIndex);
    const projectedSlots = clamp((drag.velocity * 105) / SLOT_HEIGHT, -MAX_FLICK_SLOTS, MAX_FLICK_SLOTS);
    const targetIndex = Math.round(nearestIndex + projectedSlots);
    settleToIndex(event.currentTarget, targetIndex);
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
    <main className="phone-canvas">
      <aside className="icon-rail-shell" aria-label="Food sprite carousel">
        <div
          ref={railRef}
          className="icon-rail"
          onScroll={handleScroll}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {LOOPED_ICONS.map(({ absoluteIndex, spriteNumber }) => (
            <button
              type="button"
              className="icon-slot"
              data-absolute-index={absoluteIndex}
              key={absoluteIndex}
              onClick={() => centerIcon(absoluteIndex)}
              aria-label={`Food ${spriteNumber}`}
              aria-pressed={INITIAL_ABSOLUTE_INDEX === absoluteIndex}
              tabIndex={INITIAL_ABSOLUTE_INDEX === absoluteIndex ? 0 : -1}
            >
              <Sprite category="Food" spriteNumber={spriteNumber} size={32} />
            </button>
          ))}
        </div>
      </aside>
    </main>
  );
}
