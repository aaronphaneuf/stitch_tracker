const RAW_BASE = import.meta.env.VITE_API_BASE || "/api";
const BASE = RAW_BASE.replace(/\/+$/, "");
const api = (p) => `${BASE}${p.startsWith("/") ? "" : "/"}${p}`;

let accessToken = localStorage.getItem("access") || null;
let refreshToken = localStorage.getItem("refresh") || null;
let refreshTimer = null;

export function setTokens({ access, refresh }) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem("access", accessToken);
  localStorage.setItem("refresh", refreshToken);

  if (refreshTimer) clearTimeout(refreshTimer);
  scheduleRefresh();
}

function decodeJwt(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function withTimeout(_promise, ms = 10000, label = "request") {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(`${label} timed out after ${ms}ms`), ms);
  return {
    signal: ctrl.signal,
    run: (doFetch) => doFetch(ctrl.signal).finally(() => clearTimeout(t)),
  };
}

function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  if (!accessToken) return;

  const payload = decodeJwt(accessToken);
  if (!payload?.exp) return;

  const expMs = payload.exp * 1000;
  const now = Date.now();
  const skew = 30 * 1000;
  const delay = Math.max(0, expMs - now - skew);

  refreshTimer = setTimeout(async () => {
    try {
      await tryRefresh();
      scheduleRefresh();
    } catch (e) {
      console.warn("Auto-refresh failed:", e);
      logout();
    }
  }, delay);
}

export async function login({ username, password }) {
  const r = await fetch(api("/token/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!r.ok) throw new Error("Invalid credentials");

  const data = await r.json().catch(() => ({}));
  if (!data.access || !data.refresh)
    throw new Error("Login failed: no tokens returned");

  setTokens({ access: data.access, refresh: data.refresh });

  return data;
}


export function logout() {
  accessToken = null;
  refreshToken = null;
  if (refreshTimer) clearTimeout(refreshTimer);
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

async function tryRefresh() {
  if (!refreshToken) throw new Error("No refresh token");

  const r = await fetch(api("/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!r.ok) throw new Error("Refresh failed");

  const data = await r.json();

  setTokens({ access: data.access, refresh: refreshToken });

  return data.access;
}

async function apiGet(path) {
  const doFetch = async () =>
    fetch(api(path), {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });

  let res = await doFetch();
  if (res.status === 401 && refreshToken) {
    await tryRefresh();
    res = await doFetch();
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const doFetch = () =>
    fetch(api(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

  let res = await doFetch();
  if (res.status === 401 && refreshToken) {
    await tryRefresh();
    res = await doFetch();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function apiPatch(path, body) {
  const doFetch = () =>
    fetch(api(path), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

  let res = await doFetch();
  if (res.status === 401 && refreshToken) {
    await tryRefresh();
    res = await doFetch();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function apiDelete(path) {
  const doFetch = () =>
    fetch(api(path), {
      method: "DELETE",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });

  let res = await doFetch();
  if (res.status === 401 && refreshToken) {
    await tryRefresh();
    res = await doFetch();
  }
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed ${res.status}: ${text}`);
  }
  return true;
}

export async function apiFetch(path, opts = {}) {
  const headers = {
    Accept: "application/json",
    ...(opts.headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
  const res = await fetch(api(path), { ...opts, headers });
  return res;
}

export async function getCurrentUser() {
  return apiGet("auth/me/");
}

export function listProjects() {
  return apiGet("/projects/");
}
export function getProject(id) {
  return apiGet(`/projects/${id}/`);
}
export function listProgressByProject(projectId) {
  return apiGet(`/progress/?project=${encodeURIComponent(projectId)}`);
}
export function createProgress({ project, rows_completed, stitches_completed, notes }) {
  return apiPost("/progress/", { project, rows_completed, stitches_completed, notes });
}
export function updateProgress(id, patch) {
  return apiPatch(`/progress/${id}/`, patch);
}
export function updateProject(id, patch) {
  return apiPatch(`/projects/${id}/`, patch);
}
export function deleteProgress(id) {
  return apiDelete(`/progress/${id}/`);
}

// Yarn
export function listYarn() {
  return apiGet("/yarns/");
}
export function createYarn(payload) {
  return apiPost("/yarns/", payload);
}
export function updateYarn(id, patch) {
  return apiPatch(`/yarns/${id}/`, patch);
}
export function deleteYarn(id) {
  return apiDelete(`/yarns/${id}/`);
}

async function apiPostForm(path, formData) {
  const doFetch = () =>
    fetch(api(path), {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
    });
  let res = await doFetch();
  if (res.status === 401 && refreshToken) {
    await tryRefresh();
    res = await doFetch();
  }
  if (!res.ok) throw new Error(`Request failed ${res.status}: ${await res.text()}`);
  return res.json();
}

async function apiPatchForm(path, formData) {
  const doFetch = () =>
    fetch(api(path), {
      method: "PATCH",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
    });
  let res = await doFetch();
  if (res.status === 401 && refreshToken) {
    await tryRefresh();
    res = await doFetch();
  }
  if (!res.ok) throw new Error(`Request failed ${res.status}: ${await res.text()}`);
  return res.json();
}

export function createProgressWithImages({ project, rows_completed, stitches_completed, notes, images = [] }) {
  const fd = new FormData();
  fd.append("project", project);
  fd.append("rows_completed", rows_completed ?? 0);
  fd.append("stitches_completed", stitches_completed ?? 0);
  fd.append("notes", notes ?? "");
  images.forEach((file) => fd.append("images", file));
  return apiPostForm("/progress/", fd);
}

export function updateProjectCover(projectId, file) {
  const fd = new FormData();
  fd.append("main_image", file);
  return apiPatchForm(`/projects/${projectId}/`, fd);
}

export function createProject(payload) {
  return apiPost("/projects/", payload);
}
export function createProjectWithImage(payload, file) {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });
  if (file) fd.append("main_image", file);
  return apiPostForm("/projects/", fd);
}

export function createProjectYarn({ project, yarn, quantity_used_skeins = null }) {
  return apiPost("/project-yarns/", { project, yarn, quantity_used_skeins });
}
export function deleteProjectYarn(id) {
  return apiDelete(`/project-yarns/${id}/`);
}
export function updateProjectYarn(id, patch) {
  return apiPatch(`/project-yarns/${id}/`, patch);
}

export async function listTags(search = "") {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await apiFetch(`/tags/${qs}`);
  if (res.status === 401) throw new Error("Not authorized to list tags.");
  if (!res.ok) throw new Error(`Tags failed ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}
export async function createTag(name) {
  const res = await apiFetch(`/tags/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`Create tag failed ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}
export async function updateTag(id, name) {
  const res = await apiFetch(`/tags/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`Update tag failed ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}
export async function deleteTag(id) {
  const res = await apiFetch(`/tags/${id}/`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Delete tag failed ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return true;
}

export function listAllProgress({ start, end } = {}) {
  const qs = new URLSearchParams();
  if (start) qs.set("start", start);
  if (end) qs.set("end", end);
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiGet(`/progress/${suffix}`);
}
export function changePassword({ old_password, new_password }) {
  return apiPost(`/auth/change-password/`, { old_password, new_password });
}

export async function adminListUsers(query = "") {
  const t = withTimeout(null, 10000, "adminListUsers");
  const url = `/admin/users/${query ? `?search=${encodeURIComponent(query)}` : ""}`;
  const res = await t.run((signal) => apiFetch(url, { signal }));
  if (!res.ok) throw new Error(`Failed to list users: ${res.status}`);
  return res.json();
}
export async function adminSetPassword(userId, newPassword) {
  const res = await apiFetch(`/admin/users/${userId}/set-password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_password: newPassword }),
  });
  if (!res.ok) {
    let msg = `Failed to set password: ${res.status}`;
    try { const data = await res.json(); msg = data?.detail || msg; } catch {}
    throw new Error(msg);
  }
  return true;
}
export async function adminCreateUser(payload) {
  const res = await apiFetch(`/admin/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `Failed to create user: ${res.status}`;
    try { const data = await res.json(); msg = data?.detail || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
export async function adminDeleteUser(userId) {
  const res = await apiFetch(`/admin/users/${userId}/`, { method: "DELETE" });
  if (!res.ok) {
    let msg = `Failed to delete user: ${res.status}`;
    try { const data = await res.json(); msg = data?.detail || msg; } catch {}
    throw new Error(msg);
  }
  return true;
}
export async function adminUpdateUser(userId, patch) {
  const res = await apiFetch(`/admin/users/${userId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    let msg = `Failed to update user: ${res.status}`;
    try { const data = await res.json(); msg = data?.detail || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function downloadBackup() {
  const res = await fetch(api("/backup/"), { credentials: "omit" });
  if (!res.ok) throw new Error(`Backup failed: ${res.status}`);
  return res.json();
}
export async function restoreBackup(data, { mode = "replace" } = {}) {
  const res = await fetch(api(`/restore/?mode=${encodeURIComponent(mode)}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

if (accessToken) scheduleRefresh();
