import { useEffect, useMemo, useState } from "react";
import { listProjects } from "../lib/api";
import { Link } from "react-router-dom";
import ProjectFormModal from "./ProjectFormModal";

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString();
}

function Initials({ text }) {
  const initials =
    (text || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "—";
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-base-200 to-base-300">
      <span className="text-sm font-black opacity-70">{initials}</span>
    </div>
  );
}

export default function ProjectGrid() {
  const [projects, setProjects] = useState(null);
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);

  const [q, setQ] = useState("");
  const [type, setType] = useState("all"); 
  const [tag, setTag] = useState("");

  const load = async () => {
    try {
      setErr("");
      const data = await listProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load projects");
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        const data = await listProjects();
        if (alive) setProjects(Array.isArray(data) ? data : []);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load projects");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const tagOptions = useMemo(() => {
    if (!projects) return [];
    const set = new Set();
    for (const p of projects) {
      for (const t of p.tags || []) {
        const name = typeof t === "string" ? t : t?.name;
        if (name) set.add(name);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const filtered = useMemo(() => {
    if (!projects) return null;

    const qlc = q.trim().toLowerCase();
    const typeLc = type.toLowerCase();
    const tagLc = tag.trim().toLowerCase();

    return projects.filter((p) => {
      if (typeLc !== "all" && (p.type || "").toLowerCase() !== typeLc) return false;

      if (tagLc) {
        const names = (p.tags || []).map((t) =>
          (typeof t === "string" ? t : t?.name || "").toLowerCase()
        );
        if (!names.includes(tagLc)) return false;
      }

      if (qlc) {
        const hay = `${p.name || ""}\n${p.notes || ""}`.toLowerCase();
        if (!hay.includes(qlc)) return false;
      }

      return true;
    });
  }, [projects, q, type, tag]);

  const canClear = !!(q || tag || (type && type !== "all"));

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          Add Project
        </button>
      </div>

      <div className="sticky top-0 z-10 bg-base-100/90 backdrop-blur border-b border-base-300 mb-4">
        <div className="py-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <label className="form-control">
              <div className="label">
                <span className="label-text">Search</span>
              </div>
              <input
                className="input input-bordered w-full"
                placeholder="Search by name or notes…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:w-[520px]">
            <label className="form-control">
              <div className="label">
                <span className="label-text">Type</span>
              </div>
              <select
                className="select select-bordered"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="knit">Knitting</option>
                <option value="crochet">Crochet</option>
              </select>
            </label>

            <label className="form-control">
              <div className="label">
                <span className="label-text">Tag</span>
              </div>
              <select
                className="select select-bordered"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              >
                <option value="">All tags</option>
                {tagOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                className="btn btn-ghost w-full"
                onClick={() => {
                  setQ("");
                  setType("all");
                  setTag("");
                }}
                disabled={!canClear}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {err && (
        <div className="alert alert-error mb-4">
          <span>{err}</span>
        </div>
      )}

      {!filtered ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card bg-base-200 animate-pulse h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center opacity-70">
          <p>No projects match your filters.</p>
          <p className="text-sm">Try clearing or changing the filters above.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="card bg-base-200 shadow-sm">
              <div className="card-body gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="avatar">
                      <div className="w-12 h-12 rounded-full ring ring-base-300 ring-offset-2 ring-offset-base-100 overflow-hidden">
                        {p.main_image ? (
                          <img
                            src={p.main_image}
                            alt={`${p.name} cover`}
                            className="object-cover w-full h-full"
                            loading="lazy"
                          />
                        ) : (
                          <Initials text={p.name} />
                        )}
                      </div>
                    </div>
                    <h2 className="card-title truncate">{p.name}</h2>
                  </div>
                  <span className="badge capitalize shrink-0">{p.type}</span>
                </div>

                {p.tags?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {p.tags.map((t) => {
                      const label = typeof t === "string" ? t : t?.name;
                      const key = typeof t === "string" ? t : t?.id || t?.name;
                      return (
                        <span key={key} className="badge badge-outline">
                          {label}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs opacity-60">No tags</div>
                )}

                <div className="text-sm opacity-80 grid grid-cols-2 gap-x-4">
                  <div>
                    <div className="opacity-60">Start</div>
                    <div>{formatDate(p.start_date)}</div>
                  </div>
                  <div>
                    <div className="opacity-60">Goal</div>
                    <div>{formatDate(p.expected_end_date)}</div>
                  </div>
                </div>

                {p.notes && <p className="text-sm mt-2 line-clamp-2">{p.notes}</p>}

                <div className="card-actions justify-end mt-2">
                  <Link to={`/projects/${p.id}`} className="btn btn-sm">
                    Open
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectFormModal open={adding} onClose={() => setAdding(false)} onSaved={load} />
    </>
  );
}
