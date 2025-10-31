import { useEffect, useMemo, useState, useCallback } from "react";
import { listYarn, createProjectYarn, updateProjectYarn, getProject } from "../lib/api";

export default function AddProjectYarnModal({ projectId, open, onClose, onAdded }) {
  const [allYarn, setAllYarn] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const reset = useCallback(() => {
    setQuery("");
    setSelected(new Map());
    setErr("");
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      try {
        setErr("");
        setLoading(true);

        const [stash, project] = await Promise.all([
          listYarn(),
          getProject(projectId),
        ]);
        if (cancelled) return;

        setAllYarn(Array.isArray(stash) ? stash : []);

        const pre = new Map();
        for (const py of project?.yarns ?? []) {
          const key = String(py?.yarn?.id); 
          const raw = py?.quantity_used_skeins;
          const asInt = Number.parseInt(String(raw), 10);
          pre.set(key, {
            skeins: Number.isFinite(asInt) ? String(asInt) : "",
            linkId: py?.id ?? null,
          });
        }

        setSelected(pre);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load yarn");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, projectId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allYarn;
    return allYarn.filter((y) =>
      [y.brand, y.weight, y.material, y.colour, y.colour_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [allYarn, query]);

  const togglePick = (y) => {
    const key = String(y.id); 
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, { skeins: "0", linkId: null });
      }
      return next;
    });
  };

  const changeQty = (yarnId, value) => {
    const key = String(yarnId); 
    const cleaned = value.replace(/[^\d]/g, ""); 
    setSelected((prev) => {
      const next = new Map(prev);
      const cur = next.get(key) || { skeins: "", linkId: null };
      next.set(key, { ...cur, skeins: cleaned });
      return next;
    });
  };

  const save = async () => {
    if (selected.size === 0) {
      onClose?.();
      return;
    }
    try {
      setLoading(true);
      for (const [key, { skeins, linkId }] of selected.entries()) {
        const yarnId = Number(key);             
        const n = skeins === "" ? null : Number(skeins); 
        if (linkId) {
          await updateProjectYarn(linkId, { quantity_used_skeins: n });
        } else {
          await createProjectYarn({
            project: Number(projectId),
            yarn: yarnId,
            quantity_used_skeins: n,
          });
        }
      }
      onAdded?.();
      reset();
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Failed to save yarn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`} aria-modal="true">
      <div className="modal-box max-w-3xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">Add yarn from stash</h3>
          <button className="btn btn-sm btn-ghost" onClick={() => { reset(); onClose?.(); }}>✕</button>
        </div>

        {err && <div className="alert alert-error mb-3">{err}</div>}

        <div className="mb-3">
          <input
            className="input input-bordered w-full"
            placeholder="Search brand, weight, material, colour…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="max-h-96 overflow-auto rounded-lg border border-base-300">
          {loading ? (
            <div className="p-6 opacity-60">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 opacity-60">No yarn found.</div>
          ) : (
            <table className="table table-sm">
              <thead className="sticky top-0 bg-base-200 z-10">
                <tr>
                  <th />
                  <th>Brand</th>
                  <th>Weight</th>
                  <th>Colour</th>
                  <th>Material</th>
                  <th className="text-right">Used (skeins)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((y) => {
                  const key = String(y.id); 
                  const picked = selected.has(key);
                  const row = selected.get(key) || { skeins: "", linkId: null };
                  return (
                    <tr key={y.id} className={picked ? "bg-base-200/60" : ""}>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={picked}
                          onChange={() => togglePick(y)}
                          aria-label={`Select ${y.brand || "yarn"}`}
                        />
                      </td>
                      <td className="font-medium">{y.brand || "—"}</td>
                      <td>{y.weight || "—"}</td>
                      <td>
                        <span
                          className="inline-block w-4 h-4 rounded-full border border-base-300 align-middle mr-2"
                          style={{ backgroundColor: y.colour || "#ccc" }}
                          title={y.colour || ""}
                        />
                        <span className="align-middle text-xs">{y.colour_name || "—"}</span>
                      </td>
                      <td>{y.material || "—"}</td>
                      <td className="text-right">
                        <input
                          inputMode="numeric"
                          pattern="[0-9]*"
                          type="text"
                          className="input input-bordered input-xs w-24 text-right"
                          value={row.skeins ?? ""}     
                          onChange={(e) => changeQty(y.id, e.target.value)}
                          disabled={!picked}
                          placeholder="0"
                          aria-label="Used skeins"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={() => { reset(); onClose?.(); }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>
            Save
          </button>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop" onClick={() => { reset(); onClose?.(); }}>
        <button>close</button>
      </form>
    </dialog>
  );
}
