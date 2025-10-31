import { DndContext, useDraggable } from '@dnd-kit/core';
import { useEffect, useMemo, useState } from 'react';
import ShelfSlot from './ShelfSlot';
import YarnBall from './YarnBall';

const SLOT_IDS = ['A1','A2','A3','B1','B2','B3','C1','C2','C3'];
const CAPACITY = 6;
const LKEY = 'stashShelf.v2';

function DraggableFromTray({ yarn }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `yarn-${yarn.id}-tray`,
    data: { yarn, fromSlot: null },
  });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
    cursor: 'grab',
  };
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      <YarnBall colour={yarn.colour} label={yarn.brand} size={46} />
    </div>
);
}

export default function StashShelf({ yarns = []}) {
  const [layout, setLayout] = useState({});

  useEffect(() => {
    const raw = localStorage.getItem(LKEY);
    if (raw) {
      try { setLayout(JSON.parse(raw)); return; } catch {}
    }
    const init = Object.fromEntries(SLOT_IDS.map(s => [s, []]));
    setLayout(init);
  }, []);

  useEffect(() => {
    if (Object.keys(layout).length) {
      localStorage.setItem(LKEY, JSON.stringify(layout));
    }
  }, [layout]);

  const yarnById = useMemo(() => {
    const m = new Map();
    yarns.forEach(y => m.set(y.id, y));
    return m;
  }, [yarns]);

  const placedIds = useMemo(() => {
    const s = new Set();
    Object.values(layout).forEach(arr => arr.forEach(id => s.add(id)));
    return s;
  }, [layout]);

  const trayYarns = useMemo(() => yarns.filter(y => !placedIds.has(y.id)), [yarns, placedIds]);

  function removeFromAnySlot(yarnId) {
    setLayout(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        const idx = next[k].indexOf(yarnId);
        if (idx !== -1) next[k] = [...next[k].slice(0, idx), ...next[k].slice(idx + 1)];
      }
      return next;
    });
  }

  function addToSlot(slotId, yarnId) {
    setLayout(prev => {
      const arr = prev[slotId] || [];
      if (arr.length >= CAPACITY) return prev;
      if (arr.includes(yarnId)) return prev;
      return { ...prev, [slotId]: [...arr, yarnId] };
    });
  }

  function clearBall(slotId, yarnId) {
    setLayout(prev => {
      const arr = prev[slotId] || [];
      const idx = arr.indexOf(yarnId);
      if (idx === -1) return prev;
      const next = [...arr.slice(0, idx), ...arr.slice(idx + 1)];
      return { ...prev, [slotId]: next };
    });
  }

  function clearAll(slotId) {
    setLayout(prev => ({ ...prev, [slotId]: [] }));
  }

  function onDragEnd(e) {
    const { active, over } = e;
    if (!over) return;
    const dropSlot = over.id;
    const data = active.data?.current;
    const yarn = data?.yarn;
    const fromSlot = data?.fromSlot ?? null;
    if (!yarn || !SLOT_IDS.includes(dropSlot)) return;

    setLayout(prev => {
      const next = { ...prev };

      if (fromSlot && next[fromSlot]) {
        const idx = next[fromSlot].indexOf(yarn.id);
        if (idx !== -1) next[fromSlot] = [...next[fromSlot].slice(0, idx), ...next[fromSlot].slice(idx + 1)];
      }

      const dest = next[dropSlot] || [];
      if (dest.length >= CAPACITY || dest.includes(yarn.id)) return next;
      next[dropSlot] = [...dest, yarn.id];
      return next;
    });
  }

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-3 gap-6">
            {SLOT_IDS.map(slotId => {
              const ids = layout[slotId] || [];
              const items = ids.map(id => yarnById.get(id)).filter(Boolean);
              return (
                <ShelfSlot
                  key={slotId}
                  id={slotId}
                  items={items}
                  onClearBall={(yId) => clearBall(slotId, yId)}
                  onClearAll={clearAll}
                />
              );
            })}
          </div>
        </div>

        <div className="divider">Yarn tray</div>
        <div className="flex flex-wrap gap-3">
          {trayYarns.length === 0 ? (
            <div className="opacity-50">All yarn is placed.</div>
          ) : trayYarns.map(y => <DraggableFromTray key={y.id} yarn={y} />)}
        </div>

        <div className="pt-2 flex gap-2">
          <button
            className="btn btn-sm"
            onClick={() => {
              const empty = Object.fromEntries(SLOT_IDS.map(s => [s, []]));
              setLayout(empty);
            }}
          >
            Clear shelf
          </button>
                  </div>
      </div>
    </DndContext>
  );
}
