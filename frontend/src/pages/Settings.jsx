import { useEffect, useMemo, useState } from "react";
import ThemePicker from "../components/ThemePicker";
import {
  getCurrentUser,
  adminListUsers,
  adminUpdateUser,
  adminCreateUser,
  adminDeleteUser,
} from "../lib/api";

function includes(haystack, needle) {
  if (!needle) return true;
  return String(haystack || "").toLowerCase().includes(String(needle).toLowerCase());
}

function AdminUsersPanel() {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    is_staff: false,
    is_active: true,
  });

  const load = async (search = "") => {
    setLoading(true);
    try {
      const list = await adminListUsers(search);
      setUsers(Array.isArray(list) ? list : list?.results ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const who = await getCurrentUser();
        setMe(who);
      } catch {}
      await load("");
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return users;
    return users.filter(
      (u) =>
        includes(u.username, q) ||
        includes(u.email, q) ||
        includes(u.first_name, q) ||
        includes(u.last_name, q)
    );
  }, [users, q]);

  const onToggle = async (u, field) => {
    if (busy) return;

    if (me && me.id === u.id) {
      if (field === "is_active") return;
      if (field === "is_staff" && u.is_staff) return;
    }

    setBusy(true);
    try {
      const payload = { [field]: !u[field] };
      const updated = await adminUpdateUser(u.id, payload);
      setUsers((arr) => arr.map((x) => (x.id === u.id ? updated : x)));
    } finally {
      setBusy(false);
    }
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const created = await adminCreateUser(createForm);
      setUsers((arr) => [created, ...arr]);
      setCreateForm({
        username: "",
        email: "",
        password: "",
        is_staff: false,
        is_active: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (u) => {
    if (busy) return;
    if (me && me.id === u.id) return;
    if (!confirm(`Delete user "${u.username}"?`)) return;
    setBusy(true);
    try {
      await adminDeleteUser(u.id);
      setUsers((arr) => arr.filter((x) => x.id !== u.id));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Search users</span>
        </label>
        <input
          className="input input-bordered"
          placeholder="Search by name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="card bg-base-200 w-full">
        <div className="card-body">
          <h3 className="card-title text-base">Create user</h3>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreate}>
            <input
              className="input input-bordered"
              placeholder="Username"
              required
              value={createForm.username}
              onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
            />
            <input
              type="email"
              className="input input-bordered"
              placeholder="Email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            />
            <input
              type="password"
              className="input input-bordered md:col-span-2"
              placeholder="Temporary password"
              required
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
            />
            <label className="label cursor-pointer gap-3">
              <span className="label-text">Staff</span>
              <input
                type="checkbox"
                className="toggle"
                checked={createForm.is_staff}
                onChange={(e) => setCreateForm((f) => ({ ...f, is_staff: e.target.checked }))}
              />
            </label>
            <label className="label cursor-pointer gap-3">
              <span className="label-text">Active</span>
              <input
                type="checkbox"
                className="toggle"
                checked={createForm.is_active}
                onChange={(e) => setCreateForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
            </label>

            <div className="md:col-span-2">
              <button className={`btn btn-primary ${busy ? "btn-disabled" : ""}`} disabled={busy}>
                {busy ? "Saving…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Staff</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>No users found.</td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={!!u.is_staff}
                      disabled={busy || (me && me.id === u.id)}
                      onChange={() => onToggle(u, "is_staff")}
                      title="Toggle staff"
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={!!u.is_active}
                      disabled={busy || (me && me.id === u.id)}
                      onChange={() => onToggle(u, "is_active")}
                      title="Toggle active"
                    />
                  </td>
                  <td className="text-right">
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={busy || (me && me.id === u.id)}
                      onClick={() => onDelete(u)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Settings() {
  const THEME_KEY = "st_theme";

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage?.getItem(THEME_KEY);
      if (saved) return saved;
      const current = document.documentElement.getAttribute("data-theme");
      if (current) return current;
    }
    return "light";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      try {
        window.localStorage?.setItem(THEME_KEY, theme);
      } catch {}
    }
  }, [theme]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const current = document.documentElement.getAttribute("data-theme");
      if (!current) {
        document.documentElement.setAttribute("data-theme", theme);
      }
    }
  }, []);

  const handleThemeChange = (next) => {
    if (typeof next === "string" && next !== theme) setTheme(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="card bg-base-200 w-full">
        <div className="card-body">
          <h3 className="card-title text-base">Appearance</h3>
          <ThemePicker
            value={theme}
            onChange={handleThemeChange}
            onSelect={handleThemeChange}
          />
        </div>
      </div>

      <div className="card bg-base-200 w-full">
        <div className="card-body">
          <h3 className="card-title text-base">User Management</h3>
          <AdminUsersPanel />
        </div>
      </div>
    </div>
  );
}
