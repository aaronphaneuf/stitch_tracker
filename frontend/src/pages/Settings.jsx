import { useEffect, useMemo, useState } from "react";
import ThemePicker from "../components/ThemePicker";
import BackupControls from "../components/BackupControls";
import {
  getCurrentUser,
  adminListUsers,
  adminSetPassword,
  adminDeleteUser,
  adminUpdateUser,
} from "../lib/api";

function AdminUsersPanel() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState({ userId: null, mode: null, pw: "" });
  const [busyId, setBusyId] = useState(null);

  const load = async (query = q) => {
    try {
      setErr("");
      setLoading(true);
      const data = await adminListUsers(query);
      setUsers(Array.isArray(data) ? data : data?.results ?? []);
    } catch (e) {
      setErr(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("");
  }, []);

  const onSearch = async (e) => {
    e.preventDefault();
    await load(q);
  };

  const onToggle = async (u, field) => {
    try {
      setBusyId(u.id);
      const updated = await adminUpdateUser(u.id, { [field]: !u[field] });
      setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      alert(e.message || "Failed to update user");
    } finally {
      setBusyId(null);
    }
  };

  const beginReset = (u) => setEdit({ userId: u.id, mode: "password", pw: "" });
  const savePassword = async (u) => {
    if (!edit.pw) return;
    try {
      setBusyId(u.id);
      await adminSetPassword(u.id, edit.pw);
      setEdit({ userId: null, mode: null, pw: "" });
    } catch (e) {
      alert(e.message || "Failed to set password");
    } finally {
      setBusyId(null);
    }
  };

  const beginDelete = (u) => setEdit({ userId: u.id, mode: "delete", pw: "" });
  const confirmDelete = async (u) => {
    try {
      setBusyId(u.id);
      await adminDeleteUser(u.id);
      setUsers((list) => list.filter((x) => x.id !== u.id));
      setEdit({ userId: null, mode: null, pw: "" });
    } catch (e) {
      alert(e.message || "Failed to delete user");
    } finally {
      setBusyId(null);
    }
  };

  const DesktopTable = () => (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <table className="table table-zebra md:min-w-[720px]">
        <thead>
          <tr>
            <th className="whitespace-nowrap">ID</th>
            <th>Username</th>
            <th>Email</th>
            <th className="whitespace-nowrap">Staff</th>
            <th className="whitespace-nowrap">Active</th>
            <th className="whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isEditing = edit.userId === u.id;
            const mode = isEditing ? edit.mode : null;
            const busy = busyId === u.id;
            return (
              <tr key={u.id}>
                <td className="opacity-60">{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email || <span className="opacity-60">—</span>}</td>
                <td>
                  <input
                    type="checkbox"
                    className="toggle"
                    checked={!!u.is_staff}
                    disabled={busy}
                    onChange={() => onToggle(u, "is_staff")}
                    title="Toggle staff"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    className="toggle"
                    checked={!!u.is_active}
                    disabled={busy}
                    onChange={() => onToggle(u, "is_active")}
                    title="Toggle active"
                  />
                </td>
                <td className="whitespace-nowrap align-top">
                  {!isEditing && (
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-xs"
                        disabled={busy}
                        onClick={() => beginReset(u)}
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-error"
                        disabled={busy}
                        onClick={() => beginDelete(u)}
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {isEditing && mode === "password" && (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="password"
                        className="input input-xs input-bordered w-44"
                        placeholder="New password"
                        value={edit.pw}
                        onChange={(e) => setEdit((s) => ({ ...s, pw: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="btn btn-xs btn-primary"
                        disabled={!edit.pw || busy}
                        onClick={() => savePassword(u)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        onClick={() => setEdit({ userId: null, mode: null, pw: "" })}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {isEditing && mode === "delete" && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs opacity-70">
                        Delete <strong>{u.username}</strong>?
                      </span>
                      <button
                        type="button"
                        className="btn btn-xs btn-error"
                        disabled={busy}
                        onClick={() => confirmDelete(u)}
                      >
                        Confirm delete
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        onClick={() => setEdit({ userId: null, mode: null, pw: "" })}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const MobileList = () => (
    <div className="md:hidden grid gap-3">
      {users.map((u) => {
        const isEditing = edit.userId === u.id;
        const mode = isEditing ? edit.mode : null;
        const busy = busyId === u.id;

        return (
          <div key={u.id} className="card bg-base-100">
            <div className="card-body p-4 gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{u.username}</div>
                  <div className="text-xs opacity-70">{u.email || "—"}</div>
                </div>
                <span className="text-xs opacity-60">#{u.id}</span>
              </div>

              <div className="flex items-center justify-between">
                <label className="label p-0">
                  <span className="label-text mr-2">Staff</span>
                  <input
                    type="checkbox"
                    className="toggle"
                    checked={!!u.is_staff}
                    disabled={busy}
                    onChange={() => onToggle(u, "is_staff")}
                  />
                </label>
                <label className="label p-0">
                  <span className="label-text mr-2">Active</span>
                  <input
                    type="checkbox"
                    className="toggle"
                    checked={!!u.is_active}
                    disabled={busy}
                    onChange={() => onToggle(u, "is_active")}
                  />
                </label>
              </div>

              {!isEditing && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={busy}
                    onClick={() => beginReset(u)}
                  >
                    Reset password
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-error"
                    disabled={busy}
                    onClick={() => beginDelete(u)}
                  >
                    Delete
                  </button>
                </div>
              )}

              {isEditing && mode === "password" && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="password"
                    className="input input-sm input-bordered w-full sm:w-56"
                    placeholder="New password"
                    value={edit.pw}
                    onChange={(e) => setEdit((s) => ({ ...s, pw: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      disabled={!edit.pw || busy}
                      onClick={() => savePassword(u)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setEdit({ userId: null, mode: null, pw: "" })}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {isEditing && mode === "delete" && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="text-sm">
                    Delete <strong>{u.username}</strong>?
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-error"
                      disabled={busy}
                      onClick={() => confirmDelete(u)}
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setEdit({ userId: null, mode: null, pw: "" })}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="card bg-base-200">
      <div className="card-body gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="card-title text-base">Admin · Users</h3>
          <form onSubmit={onSearch} className="join self-start md:self-auto">
            <input
              className="input input-bordered join-item"
              placeholder="Search username or email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn btn-ghost join-item" type="submit">
              Search
            </button>
          </form>
        </div>

        {err && <div className="alert alert-error">{err}</div>}

        {loading ? (
          <div className="grid gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-14 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-sm opacity-70">No users found.</div>
        ) : (
          <>
            <MobileList />

            <div className="hidden md:block">
              <DesktopTable />
            </div>

            <div className="text-xs opacity-70 mt-2">
              Tip: Don’t demote or deactivate the only superuser, or you could lock yourself out.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [me, setMe] = useState(null);
  const [meErr, setMeErr] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCurrentUser();
        setMe(data);
      } catch (e) {
        setMeErr(e.message || "Failed to load user");
      }
    })();
  }, []);

  const isAdmin = useMemo(() => !!me && (me.is_staff || me.is_superuser), [me]);

  return (
    <div className="space-y-6">
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-base">Appearance</h3>
          <ThemePicker value={theme} onChange={setTheme} />
        </div>
      </div>

      {meErr && <div className="alert alert-error">{meErr}</div>}
      {isAdmin && <AdminUsersPanel />}

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-base">Backup &amp; Restore</h3>
          <p className="opacity-70 text-sm">
            Export a JSON backup of your database (projects, progress, yarn, tags, links).
            Local settings (theme &amp; shelf layout) are bundled on export and restored on import.
          </p>
          <BackupControls onAfterImport={() => { /* optional: toast or reload */ }} />
        </div>
      </div>
    </div>
  );
}

