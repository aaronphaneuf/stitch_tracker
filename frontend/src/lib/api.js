// src/lib/api.js
const API_BASE = import.meta.env.VITE_API_BASE;

let accessToken = localStorage.getItem("access") || null;
let refreshToken = localStorage.getItem("refresh") || null;
let refreshTimer = null;

// --- JWT decode helper ---
function decodeJwt(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function withBase(path) {
  const base = (API_BASE || "").replace(/\/+$/, ""); // strip trailing /
  const p = String(path || "").startsWith("/") ? path : `/${path || ""}`;
  return `${base}${p}`.replace(/([^:]\/)\/+/g, "$1"); // collapse // except after http:
}

// put near the top of api.js
export function withTimeout(promise, ms = 10000, label = "request") {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(`${label} timed out after ${ms}ms`), ms);
  return {
    signal: ctrl.signal,
    run: (doFetch) => doFetch(ctrl.signal).finally(() => clearTimeout(t)),
  };
}


// --- Schedule automatic refresh before expiry ---
function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  if (!accessToken) return;

  const payload = decodeJwt(accessToken);
  if (!payload?.exp) return;

  const expMs = payload.exp * 1000;
  const now = Date.now();
  const skew = 30 * 1000; // refresh 30 seconds before expiry
  const delay = Math.max(0, expMs - now - skew);

  refreshTimer = setTimeout(async () => {
    try {
      await tryRefresh();
      scheduleRefresh(); // reschedule after refreshing
    } catch (e) {
      console.warn("Auto-refresh failed:", e);
      logout();
    }
  }, delay);
}

// --- Auth functions ---
export async function login({ username, password }) {
  const r = await fetch(`${API_BASE}/api/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!r.ok) throw new Error("Invalid credentials");

  const data = await r.json();
  accessToken = data.access;
  refreshToken = data.refresh;
  localStorage.setItem("access", accessToken);
  localStorage.setItem("refresh", refreshToken);

  scheduleRefresh(); // start timer

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
  const r = await fetch(`${API_BASE}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!r.ok) throw new Error("Refresh failed");

  const data = await r.json();
  accessToken = data.access;
  localStorage.setItem("access", accessToken);

  return accessToken;
}

// --- Generic request helpers ---
export async function apiGet(path) {
  const doFetch = async () =>
    fetch(`${API_BASE}${path}`, {
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
    fetch(`${API_BASE}${path}`, {
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
    fetch(`${API_BASE}${path}`, {
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
    fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
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

// --- API endpoints ---
export async function getCurrentUser() {
  return apiGet("/api/auth/me/");
}

export function listProjects() {
  return apiGet("/api/projects/");
}

export function getProject(id) {
  return apiGet(`/api/projects/${id}/`);
}

export function listProgressByProject(projectId) {
  return apiGet(`/api/progress/?project=${encodeURIComponent(projectId)}`);
}

export function createProgress({ project, rows_completed, stitches_completed, notes }) {
  return apiPost("/api/progress/", { project, rows_completed, stitches_completed, notes });
}

export function updateProgress(id, patch) {
  return apiPatch(`/api/progress/${id}/`, patch);
}

export function updateProject(id, patch) {
  return apiPatch(`/api/projects/${id}/`, patch);
}

export function deleteProgress(id) {
  return apiDelete(`/api/progress/${id}/`);
}

// --- Kick off timer if already logged in ---
if (accessToken) {
  scheduleRefresh();
}

// --- Yarn API ---
export function listYarn() {
  return apiGet("/api/yarns/"); // adjust if your endpoint differs
}

export function createYarn(payload) {
  // payload: { weight, brand, colour, amount_per_skein, product_link, material, quantity_owned_skeins }
  return apiPost("/api/yarns/", payload);
}

export function updateYarn(id, patch) {
  return apiPatch(`/api/yarns/${id}/`, patch);
}

export function deleteYarn(id) {
  return apiDelete(`/api/yarns/${id}/`);
}

// NEW: generic FormData POST
async function apiPostForm(path, formData) {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData, // let browser set boundary
    });
  let res = await doFetch();
  if (res.status === 401 && refreshToken) {
    await tryRefresh();
    res = await doFetch();
  }
  if (!res.ok) throw new Error(`Request failed ${res.status}: ${await res.text()}`);
  return res.json();
}

// NEW: generic FormData PATCH (for project cover image)
async function apiPatchForm(path, formData) {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
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

// Create progress WITH optional images (Array<File>)
export function createProgressWithImages({ project, rows_completed, stitches_completed, notes, images = [] }) {
  const fd = new FormData();
  fd.append("project", project);
  fd.append("rows_completed", rows_completed ?? 0);
  fd.append("stitches_completed", stitches_completed ?? 0);
  fd.append("notes", notes ?? "");
  images.forEach((file) => fd.append("images", file));
  return apiPostForm("/api/progress/", fd);
}

// Update project cover image
export function updateProjectCover(projectId, file) {
  const fd = new FormData();
  fd.append("main_image", file);
  return apiPatchForm(`/api/projects/${projectId}/`, fd);
}

// create JSON project (no image)
export function createProject(payload) {
  return apiPost("/api/projects/", payload);
}

// create project with cover image (multipart)
export function createProjectWithImage(payload, file) {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });
  if (file) fd.append("main_image", file);
  return apiPostForm("/api/projects/", fd);
}

// --- Project ↔ Yarn links (ProjectYarn) ---
export function createProjectYarn({ project, yarn, quantity_used_skeins = null}) {
  return apiPost("/api/project-yarns/", { project, yarn, quantity_used_skeins});
}

export function deleteProjectYarn(id) {
  return apiDelete(`/api/project-yarns/${id}/`);
}

// --- Tags API ---
// Optional search; returns [{ id, name, project_count? }, ...]
export async function listTags(search = "") {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  // use apiFetch to see raw response if needed, attach auth if available
  const res = await apiFetch(`/api/tags/${qs}`);
  if (res.status === 401) throw new Error("Not authorized to list tags.");
  if (!res.ok) throw new Error(`Tags failed ${res.status}: ${await res.text().catch(()=> "")}`);
  return res.json();
}

export async function createTag(name) {
  const res = await apiFetch(`/api/tags/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`Create tag failed ${res.status}: ${await res.text().catch(()=> "")}`);
  return res.json();
}

export async function updateTag(id, name) {
  const res = await apiFetch(`/api/tags/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`Update tag failed ${res.status}: ${await res.text().catch(()=> "")}`);
  return res.json();
}

export async function deleteTag(id) {
  const res = await apiFetch(`/api/tags/${id}/`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Delete tag failed ${res.status}: ${await res.text().catch(()=> "")}`);
  }
  return true;
}
// --- User & progress helpers (add near the bottom) ---

// All progress for the current user (optionally windowed)
export function listAllProgress({ start, end } = {}) {
  const qs = new URLSearchParams();
  if (start) qs.set("start", start);        // backend: support if you like
  if (end) qs.set("end", end);
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiGet(`/api/progress/${suffix}`); // most APIs return only the caller's progress
}

// Change password (adjust path if your backend uses a different endpoint)
export function changePassword({ old_password, new_password }) {
  return apiPost(`/api/auth/change-password/`, { old_password, new_password });
}

export function updateProjectYarn(id, patch) {
  return apiPatch(`/api/project-yarns/${id}/`, patch);
}

// src/lib/api.js  (add these)
export async function downloadBackup() {
  const res = await fetch("http://localhost:8000/api/backup/", {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Backup failed: ${res.status}`);
  return await res.json(); // DB portion only
}

export async function restoreBackup(data, { mode = "replace" } = {}) {
  const res = await fetch(`http://localhost:8000/api/restore/?mode=${mode}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function apiFetch(path, opts = {}) {
  const access = localStorage.getItem('access');
  return fetch(withBase(path), {
    ...opts,
    credentials: 'omit',
    headers: {
      Accept: 'application/json',
      ...(opts.headers || {}),
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
  });
}



export async function adminListUsers(query = "") {
  const t = withTimeout(null, 10000, "adminListUsers");
  const url = `/api/admin/users/${query ? `?search=${encodeURIComponent(query)}` : ""}`;

  const res = await t.run((signal) =>
    apiFetch(url, { signal }) // apiFetch should pass `signal` through to fetch
  );

  if (!res.ok) throw new Error(`Failed to list users: ${res.status}`);
  return res.json();
}


export async function adminSetPassword(userId, newPassword) {
  const res = await apiFetch(`/api/admin/users/${userId}/set-password/`, {
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

export async function adminDeleteUser(userId) {
  const res = await apiFetch(`/api/admin/users/${userId}/`, { method: "DELETE" });
  if (!res.ok) {
    let msg = `Failed to delete user: ${res.status}`;
    try { const data = await res.json(); msg = data?.detail || msg; } catch {}
    throw new Error(msg);
  }
  return true;
}

// (Optional) also add a flags updater so Settings.jsx can toggle is_active/is_staff:
export async function adminUpdateUser(userId, patch) {
  const res = await apiFetch(`/api/admin/users/${userId}/`, {
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


