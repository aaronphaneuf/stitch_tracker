import { useEffect, useState } from "react";

export default function TagFormModal({ open, onClose, onSave, tag }) {
  const isEdit = !!tag?.id;
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(tag?.name || "");
    setErr("");
    setSaving(false);
  }, [open, tag]);

  const save = async () => {
    if (!name.trim()) { setErr("Please enter a tag name."); return; }
    setErr("");
    setSaving(true);
    try {
      await onSave(name.trim());
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Failed to save tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className="modal-box max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">{isEdit ? "Edit Tag" : "Add Tag"}</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>

        {err && <div className="alert alert-error mb-2">{err}</div>}

        <label className="form-control">
          <div className="label"><span className="label-text">Name</span></div>
          <input
            autoFocus
            className="input input-bordered"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sweater"
          />
        </label>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`btn btn-primary ${saving ? "loading" : ""}`} onClick={save} disabled={saving}>
            {isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}

