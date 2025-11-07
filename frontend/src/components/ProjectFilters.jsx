import { useEffect, useMemo, useState } from "react";
import { listTags } from "../lib/api";

export default function ProjectFilters({ value, onChange }) {
  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoadingTags(true);
        const all = await listTags("");
        if (!cancel) setTags(all.map(t => t.name).sort((a,b)=>a.localeCompare(b)));
      } finally {
        if (!cancel) setLoadingTags(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const { q = "", type = "all", tag = "" } = value || {};
  const canClear = useMemo(() => !!(q || tag || (type && type !== "all")), [q, tag, type]);

  return (
    <div className="sticky top-0 z-10 bg-base-100/90 backdrop-blur border-b border-base-300">
      <div className="py-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        {/* Left: search */}
        <div className="flex-1">
          <label className="form-control">
            <div className="label"><span className="label-text">Search</span></div>
            <input
              className="input input-bordered w-full"
              placeholder="Search projects…"
              value={q}
              onChange={(e) => onChange({ ...value, q: e.target.value })}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:w-[520px]">
          <label className="form-control">
            <div className="label"><span className="label-text">Type</span></div>
            <select
              className="select select-bordered"
              value={type}
              onChange={(e) => onChange({ ...value, type: e.target.value })}
            >
              <option value="all">All</option>
              <option value="knit">Knitting</option>
              <option value="crochet">Crochet</option>
            </select>
          </label>

          <label className="form-control">
            <div className="label"><span className="label-text">Tag</span></div>
            <select
              className="select select-bordered"
              value={tag}
              onChange={(e) => onChange({ ...value, tag: e.target.value })}
              disabled={loadingTags}
            >
              <option value="">{loadingTags ? "Loading…" : "All tags"}</option>
              {tags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              className="btn btn-ghost w-full"
              onClick={() => onChange({ q: "", type: "all", tag: "" })}
              disabled={!canClear}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
