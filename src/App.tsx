import {
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type UIEvent,
} from 'react';
import { Sprite } from './sprites/Sprite';

const ICON_COUNT = 40;
const SLOT_HEIGHT = 54;
const REPEAT_COUNT = 7;
const MIDDLE_CYCLE = Math.floor(REPEAT_COUNT / 2);
const INITIAL_ICON = 20;
const INITIAL_ABSOLUTE_INDEX = MIDDLE_CYCLE * ICON_COUNT + INITIAL_ICON - 1;

const LOOPED_ICONS = Array.from(
  { length: ICON_COUNT * REPEAT_COUNT },
  (_, absoluteIndex) => ({
    absoluteIndex,
    spriteNumber: (absoluteIndex % ICON_COUNT) + 1,
  }),
);

type MouseDrag = {
  pointerId: number;
  startY: number;
  startScrollTop: number;
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

export function App() {
  const railRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollIdleTimerRef = useRef<number | null>(null);
  const mouseDragRef = useRef<MouseDrag | null>(null);
  const suppressClickRef = useRef(false);
  const focusedAbsoluteRef = useRef(INITIAL_ABSOLUTE_INDEX);
  const activeSlotsRef = useRef<Set<HTMLButtonElement>>(new Set());

  function updateFocus(rail: HTMLDivElement) {
    const centerIndex = absoluteIndexAtCenter(rail);
    const nextFocusedIndex = Math.round(centerIndex);

    if (nextFocusedIndex !== focusedAbsoluteRef.current) {
      const previousSlot = rail.children.item(focusedAbsoluteRef.current) as HTMLButtonElement | null;
      const nextSlot = rail.children.item(nextFocusedIndex) as HTMLButtonElement | null;
      previousSlot?.setAttribute('aria-pressed', 'false');
      if (previousSlot) previousSlot.tabIndex = -1;
      nextSlot?.setAttribute('aria-pressed', 'true');
      if (nextSlot) nextSlot.tabIndex = 0;
      focusedAbsoluteRef.current = nextFocusedIndex;
    }

    const nextActiveSlots = new Set<HTMLButtonElement>();
    const firstNearbyIndex = Math.max(Math.floor(centerIndex) - 8, 0);
    const lastNearbyIndex = Math.min(Math.ceil(centerIndex) + 8, LOOPED_ICONS.length - 1);

    for (let absoluteIndex = firstNearbyIndex; absoluteIndex <= lastNearbyIndex; absoluteIndex += 1) {
      const slot = rail.children.item(absoluteIndex) as HTMLButtonElement | null;
      if (!slot) continue;
      const distance = Math.abs(absoluteIndex - centerIndex);
      const focus = Math.max(0, 1 - distance / 1.55);
      slot.style.setProperty('--focus', focus.toFixed(3));
      nextActiveSlots.add(slot);
    }

    activeSlotsRef.current.forEach((slot) => {
      if (!nextActiveSlots.has(slot)) slot.style.removeProperty('--focus');
    });
    activeSlotsRef.current = nextActiveSlots;
  }

  function settleAndRecenter(rail: HTMLDivElement) {
    const nearestIndex = Math.round(absoluteIndexAtCenter(rail));
    const nearestScrollTop = scrollTopFor(rail, nearestIndex);

    if (Math.abs(rail.scrollTop - nearestScrollTop) > 0.5) {
      rail.scrollTo({ top: nearestScrollTop, behavior: 'smooth' });
      return;
    }

    const middleIndex = MIDDLE_CYCLE * ICON_COUNT + wrappedIndex(nearestIndex);
    if (nearestIndex !== middleIndex) {
      rail.scrollTop = scrollTopFor(rail, middleIndex);
      updateFocus(rail);
    }
  }

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const alignRail = () => {
      rail.scrollTop = scrollTopFor(rail, focusedAbsoluteRef.current);
      updateFocus(rail);
    };

    alignRail();
    const resizeObserver = new ResizeObserver(alignRail);
    resizeObserver.observe(rail);

    return () => resizeObserver.disconnect();
  }, []);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const rail = event.currentTarget;

    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(() => {
        updateFocus(rail);
        animationFrameRef.current = null;
      });
    }

    if (scrollIdleTimerRef.current !== null) {
      window.clearTimeout(scrollIdleTimerRef.current);
    }
    scrollIdleTimerRef.current = window.setTimeout(() => {
      settleAndRecenter(rail);
    }, 130);
  }

  function centerIcon(absoluteIndex: number) {
    if (suppressClickRef.current) return;

    railRef.current?.scrollTo({
      top: scrollTopFor(railRef.current, absoluteIndex),
      behavior: 'smooth',
    });
  }

  function startMouseDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    mouseDragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: event.currentTarget.scrollTop,
      moved: false,
    };
  }

  function moveMouseDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = mouseDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const distance = event.clientY - drag.startY;
    if (!drag.moved && Math.abs(distance) > 4) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add('is-dragging');
    }
    if (!drag.moved) return;

    event.currentTarget.scrollTop = drag.startScrollTop - distance;
    event.preventDefault();
  }

  function finishMouseDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = mouseDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.currentTarget.classList.remove('is-dragging');
    mouseDragRef.current = null;

    if (drag.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  }

  return (
    <main className="phone-canvas">
      <aside className="icon-rail-shell" aria-label="Food sprite carousel">
        <div
          ref={railRef}
          className="icon-rail"
          onScroll={handleScroll}
          onPointerDown={startMouseDrag}
          onPointerMove={moveMouseDrag}
          onPointerUp={finishMouseDrag}
          onPointerCancel={finishMouseDrag}
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
