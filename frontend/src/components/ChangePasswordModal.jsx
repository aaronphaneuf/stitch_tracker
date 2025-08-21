import { useEffect, useState } from "react";
import { changePassword } from "../lib/api";

export default function ChangePasswordModal({ open, onClose, onChanged }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOldPassword(""); setNewPassword(""); setConfirm("");
    setErr(""); setSaving(false);
  }, [open]);

  const save = async () => {
    if (!oldPassword || !newPassword) { setErr("Please fill both fields."); return; }
    if (newPassword !== confirm) { setErr("New passwords do not match."); return; }
    setErr(""); setSaving(true);
    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword });
      onChanged?.();
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className="modal-box max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">Change password</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>

        {err && <div className="alert alert-error mb-2">{err}</div>}

        <label className="form-control">
          <div className="label"><span className="label-text">Current password</span></div>
          <input type="password" className="input input-bordered" value={oldPassword}
                 onChange={(e) => setOldPassword(e.target.value)} />
        </label>
        <label className="form-control mt-2">
          <div className="label"><span className="label-text">New password</span></div>
          <input type="password" className="input input-bordered" value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)} />
        </label>
        <label className="form-control mt-2">
          <div className="label"><span className="label-text">Confirm new password</span></div>
          <input type="password" className="input input-bordered" value={confirm}
                 onChange={(e) => setConfirm(e.target.value)} />
        </label>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`btn btn-primary ${saving ? "loading" : ""}`} onClick={save} disabled={saving}>
            Save
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}

