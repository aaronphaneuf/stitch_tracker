import { useEffect, useMemo, useState } from "react";
import { listYarn, deleteYarn } from "../lib/api";
import YarnFormModal from "../components/YarnFormModal";
import MaskedYarnIcon from "../components/MaskedYarnIcon";
import StashShelf from "../components/StashShelf";

function YarnCard({ yarn, onEdit, onDelete }) {
  const colorLabel = yarn.colour_name || "—";
  const hex = yarn.colour || "#ccc";

  return (
    <div className="card card-compact sm:card-normal bg-base-200 rounded-2xl">
      <div className="card-body p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-sm sm:text-base truncate">
              {yarn.brand || "—"}
            </div>
            <div className="opacity-70 text-xs sm:text-sm truncate">
              {yarn.weight || "—"}
            </div>

            <div className="mt-1 flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-base-300"
                style={{ backgroundColor: hex }}
              />
              <span className="text-xs sm:text-sm font-medium truncate">
                {colorLabel}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <MaskedYarnIcon color={hex} size={48} className="hidden sm:block" />
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <div>
            <div className="opacity-60">Material</div>
            <div className="truncate">{yarn.material || "—"}</div>
          </div>
          <div>
            <div className="opacity-60">Per skein</div>
            <div className="truncate">{yarn.amount_per_skein || "—"}</div>
          </div>
          <div>
            <div className="opacity-60">Owned (skeins)</div>
            <div>{yarn.quantity_owned_skeins ?? "—"}</div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-end gap-3">
          {yarn.product_link && (
            <>
              <a
                className="link text-xs sm:hidden"
                href={yarn.product_link}
                target="_blank"
                rel="noreferrer"
              >
                Buy
              </a>
              <a
                className="btn btn-ghost btn-sm hidden sm:inline-flex"
                href={yarn.product_link}
                target="_blank"
                rel="noreferrer"
              >
                Buy
              </a>
            </>
          )}

          <button className="link text-xs sm:hidden" onClick={() => onEdit(yarn)}>
            Edit
          </button>
          <button className="btn btn-ghost btn-sm hidden sm:inline-flex" onClick={() => onEdit(yarn)}>
            Edit
          </button>

          <button className="link text-error text-xs sm:hidden" onClick={() => onDelete(yarn)}>
            Delete
          </button>
          <button
            className="btn btn-ghost btn-sm text-error hidden sm:inline-flex"
            onClick={() => onDelete(yarn)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function YarnStash() {
  const [yarns, setYarns] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [q, setQ] = useState("");

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const data = await listYarn();
      setYarns(data);
    } catch (e) {
      setErr(e.message || "Failed to load yarn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const onEdit = (yarn) => {
    setEditing(yarn);
    setModalOpen(true);
  };

  const onDelete = async (yarn) => {
    if (!window.confirm(`Delete ${yarn.brand ?? ""} ${yarn.weight ?? ""}?`))
      return;
    await deleteYarn(yarn.id);
    await load();
  };

  const s = (v) => (v ?? "").toString().toLowerCase();

  const filteredYarns = useMemo(() => {
    const terms = q
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (terms.length === 0) return yarns;

    return yarns.filter((y) => {
      const haystack = [
        s(y.name),
        s(y.brand),
        s(y.weight),
        s(y.colour_name),
        s(y.material),
      ].join(" ");
      return terms.every((t) => haystack.includes(t));
    });
  }, [q, yarns]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Yarn Stash</h1>

        {/* Search input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, brand, weight, colour, material…"
            className="input input-bordered input-sm w-full sm:w-80"
          />
          {q && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setQ("")}
              title="Clear"
            >
              Clear
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            Add Yarn
          </button>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-base">Shelf</h2>
          <p className="opacity-70 text-xs">
            Drag yarn from the tray into the diamond cubbies. Your layout is
            saved locally.
          </p>
          <StashShelf yarns={filteredYarns} />
        </div>
      </div>

      {err && <div className="alert alert-error">{err}</div>}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card bg-base-200 h-24 animate-pulse" />
          ))}
        </div>
      ) : filteredYarns.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body">
            {q ? (
              <p className="text-sm">
                No results for <span className="font-semibold">“{q}”</span>. Try a different search.
              </p>
            ) : (
              <p className="text-sm">
                No yarn yet. Click{" "}
                <span className="font-semibold">Add Yarn</span> to start your stash.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {filteredYarns.map((y) => (
            <YarnCard key={y.id} yarn={y} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}

      <YarnFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        yarn={editing}
      />
    </div>
  );
}
