import { useDroppable, useDraggable } from '@dnd-kit/core';
import YarnBall from './YarnBall';

const CAPACITY = 6;

function SlotBall({ yarn, slotId, index }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `yarn-${yarn.id}-in-${slotId}-${index}`,
    data: { yarn, fromSlot: slotId },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
    position: 'absolute',
    left: `${(index % 3) * 30}px`,
    top: `${Math.floor(index / 3) * 30}px`,
  };

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      <YarnBall colour={yarn.colour} label={yarn.brand} size={40} />
    </div>
  );
}

export default function ShelfSlot({ id, items = [], onClearBall, onClearAll }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  const box = {
    width: '8.5rem',
    height: '8.5rem',
    transform: 'rotate(45deg)',
    borderRadius: '0.4rem',
  };

  return (
    <div className="relative flex items-center justify-center z-30 md:z-auto">
      <div
        ref={setNodeRef}
        className="relative border border-base-300 bg-base-200 transition-shadow"
        style={{ ...box, boxShadow: isOver ? '0 0 0 3px var(--fallback-bc, currentColor)' : undefined }}
      />

      <div className="absolute" style={{ transform: 'rotate(-45deg)' }}>
        <div className="relative" style={{ width: 90, height: 60 }}>
          {items.length === 0 && (
            <span className="opacity-30 text-xs select-none absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
              empty
            </span>
          )}

          {items.slice(0, 6).map((y, i) => (
            <SlotBall key={`${y.id}-${i}`} yarn={y} slotId={id} index={i} />
          ))}
        </div>

        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="text-xs opacity-60">{items.length}/6</span>

          {items.length > 0 && (
            <button
              className="btn btn-xs btn-outline md:btn-ghost relative z-50"
              onClick={() => onClearAll?.(id)}
            >
              clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

