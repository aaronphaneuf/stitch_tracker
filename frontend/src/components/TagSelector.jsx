import { useEffect, useMemo, useRef, useState } from "react";
export default function TagSelector({
  value,
  onChange,
  placeholder = "Type to search or add…",
  options,
  fetchTags,
}) {
  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let raw = [];
        if (Array.isArray(options)) {
          raw = options;
        } else if (fetchTags) {
          raw = await fetchTags();
        }
        const normalized = (raw || []).map((t) =>
          typeof t === "string" ? { name: t } : { name: t?.name ?? "" }
        ).filter((t) => t.name);
        if (!cancelled) setAll(normalized);
      } catch (e) {
        if (!cancelled) setAll([]);
      }
    })();
    return () => { cancelled = true; };
  }, [options, fetchTags]);

  const suggestions = useMemo(() => {
    const chosen = new Set(value.map((t) => t.toLowerCase()));
    const s = q.trim().toLowerCase();
    const src = all.map((t) => t.name);
    const filtered = s ? src.filter((n) => n.toLowerCase().includes(s)) : src.slice(0, 8);
    return filtered.filter((n) => !chosen.has(n.toLowerCase())).slice(0, 8);
  }, [all, value, q]);

  const add = (t) => {
    const v = (t ?? q).trim();
    if (!v) return;
    if (!value.some((x) => x.toLowerCase() === v.toLowerCase())) {
      onChange([...value, v]);
    }
    setQ("");
    setHi(-1);
    setOpen(false);
    inputRef.current?.focus();
  };

  const remove = (t) => onChange(value.filter((x) => x !== t));

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="w-full relative" ref={wrapRef}>
      <div className="flex flex-wrap items-center gap-2 rounded-box border border-base-300 p-2">
        {value.map((t) => (
          <span key={t} className="badge badge-outline gap-1">
            {t}
            <button
              className="btn btn-ghost btn-xs px-1"
              onClick={() => remove(t)}
              title="Remove"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="input input-ghost focus:outline-none w-[12ch] sm:w-[18ch] p-0"
          placeholder={placeholder}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (hi >= 0 && hi < suggestions.length) add(suggestions[hi]);
              else add(q);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHi((h) => Math.min(h + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHi((h) => Math.max(h - 1, -1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>

      {open && (suggestions.length > 0 || q.trim()) && (
        <ul className="menu bg-base-200 rounded-box mt-2 shadow max-h-60 overflow-auto absolute left-0 right-0 top-full z-[9999]">
          {suggestions.map((name, i) => (
            <li key={name}>
              <button
                className={i === hi ? "active" : ""}
                onMouseEnter={() => setHi(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(name)}
              >
                {name}
              </button>
            </li>
          ))}
          {suggestions.length === 0 && q.trim() && (
            <li>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => add(q)}>
                Create “{q}”
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

