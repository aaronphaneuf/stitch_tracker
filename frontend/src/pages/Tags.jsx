import { useEffect, useMemo, useState } from "react";
import { listTags, createTag, updateTag, deleteTag } from "../lib/api";
import TagFormModal from "../components/TagFormModal";

function SectionHeader({ letter }) {
  return (
    <div className="px-2 py-3">
      <div className="text-xl font-bold">{letter}</div>
      <div className="divider my-2" />
    </div>
  );
}

function TagItem({ tag, onEdit, onDelete }) {
  const count = typeof tag.project_count === "number" ? tag.project_count : "—";
  return (
    <div className="px-2">
      <div className="flex items-center justify-between rounded-xl bg-base-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-medium">{tag.name}</span>
          <span className="badge badge-ghost">{count}</span>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(tag)}>Edit</button>
          <button className="btn btn-ghost text-error btn-sm" onClick={() => onDelete(tag)}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function TagsPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const data = await listTags();
      const normalized = (Array.isArray(data) ? data : [])
        .map(t => ({ id: t.id, name: t.name, project_count: t.project_count }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      setTags(normalized);
    } catch (e) {
      setErr(e.message || "Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const byLetter = useMemo(() => {
    const groups = new Map();
    for (const t of tags) {
      const ch = (t.name?.[0] || "").toUpperCase();
      const key = /[A-Z]/.test(ch) ? ch : "#";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(t);
    }
    const letters = [];
    for (let i = 65; i <= 90; i++) letters.push(String.fromCharCode(i));
    if (groups.has("#")) letters.push("#");
    return letters
      .filter(L => groups.has(L))
      .map(L => ({ letter: L, items: groups.get(L) }));
  }, [tags]);

  const onAdd = () => { setEditing(null); setModalOpen(true); };
  const onEdit = (tag) => { setEditing(tag); setModalOpen(true); };
  const onDelete = async (tag) => {
    if (!window.confirm(`Delete tag "${tag.name}"?`)) return;
    try {
      await deleteTag(tag.id);
      await load();
    } catch (e) {
      alert(e.message || "Failed to delete tag");
    }
  };

  const saveModal = async (name) => {
    if (editing) await updateTag(editing.id, name);
    else await createTag(name);
    await load();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tags</h1>
        <button className="btn btn-primary" onClick={onAdd}>Add Tag</button>
      </div>

      {err && <div className="alert alert-error">{err}</div>}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-base-200 animate-pulse" />
          ))}
        </div>
      ) : byLetter.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body">
            <p>No tags yet. Click <span className="font-semibold">Add Tag</span> to create one.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {byLetter.map(({ letter, items }) => (
            <div key={letter} className="space-y-3">
              <SectionHeader letter={letter} />
              <div className="space-y-3">
                {items.map(t => (
                  <TagItem key={t.id} tag={t} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <TagFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={saveModal}
        tag={editing}
      />
    </div>
  );
}

