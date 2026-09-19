import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type UIEvent,
} from 'react';
import { Sprite } from './sprites/Sprite';

const ICON_COUNT = 40;
const SLOT_HEIGHT = 54;
const ICONS = Array.from({ length: ICON_COUNT }, (_, index) => index + 1);

type MouseDrag = {
  pointerId: number;
  startY: number;
  startScrollTop: number;
  moved: boolean;
};

export function App() {
  const railRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mouseDragRef = useRef<MouseDrag | null>(null);
  const suppressClickRef = useRef(false);
  const [focusedIcon, setFocusedIcon] = useState(7);

  function updateFocusedIcon(rail: HTMLDivElement) {
    const center = rail.scrollTop + rail.clientHeight / 2;
    const index = Math.round((center - SLOT_HEIGHT / 2) / SLOT_HEIGHT);
    setFocusedIcon(Math.min(Math.max(index + 1, 1), ICON_COUNT));
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const rail = event.currentTarget;
    if (animationFrameRef.current !== null) return;

    animationFrameRef.current = requestAnimationFrame(() => {
      updateFocusedIcon(rail);
      animationFrameRef.current = null;
    });
  }

  function centerIcon(spriteNumber: number) {
    if (suppressClickRef.current) return;

    setFocusedIcon(spriteNumber);
    railRef.current
      ?.querySelector<HTMLButtonElement>(`[data-sprite-number="${spriteNumber}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      <aside className="icon-rail-shell" aria-label="Sprite carousel">
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
          {ICONS.map((spriteNumber) => (
            <button
              type="button"
              className="icon-slot"
              data-sprite-number={spriteNumber}
              key={spriteNumber}
              onClick={() => centerIcon(spriteNumber)}
              aria-label={`Food ${spriteNumber}`}
              aria-pressed={focusedIcon === spriteNumber}
            >
              <Sprite category="Food" spriteNumber={spriteNumber} size={32} />
            </button>
          ))}
        </div>
        <span className="focus-marker" aria-hidden="true" />
      </aside>
    </main>
  );
}
