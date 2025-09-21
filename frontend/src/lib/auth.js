// frontend/src/lib/auth.js

// Consider "authed" only if a plausible JWT is present
export function isAuthed() {
  const t = localStorage.getItem("access");
  return !!(t && typeof t === "string" && t.split(".").length === 3);
}

// ---- API base helper ----
// Default to the reverse-proxy path. Do NOT hardcode localhost.
const RAW_BASE = import.meta.env.VITE_API_BASE || "/api";
const clean = RAW_BASE.replace(/\/+$/, "");
const BASE = clean.endsWith("/api") ? clean : `${clean}/api`;
const api = (p) => `${BASE}${p.startsWith("/") ? "" : "/"}${p}`;

// Helpful error extraction
const extractErrors = (data, fallback) => {
  if (!data || typeof data !== "object") return fallback;
  if (typeof data.detail === "string") return data.detail;
  const parts = [];
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) parts.push(`${k}: ${v.join(", ")}`);
    else if (typeof v === "string") parts.push(`${k}: ${v}`);
  }
  return parts.join(" · ") || fallback;
};

// keep your existing BASE/api() helpers here…

let accessToken = localStorage.getItem("access") || null;
let refreshToken = localStorage.getItem("refresh") || null;

function setTokens({ access, refresh }) {
  accessToken = access || null;
  refreshToken = refresh || null;
  if (access) localStorage.setItem("access", access); else localStorage.removeItem("access");
  if (refresh) localStorage.setItem("refresh", refresh); else localStorage.removeItem("refresh");
}

export async function login({ username, password }) {
  const r = await fetch(api("/token/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!r.ok) throw new Error("Invalid credentials");
  const data = await r.json();
  setTokens({ access: data.access, refresh: data.refresh });
  // scheduleRefresh(); // if you use it
  return data;
}

export async function registerAccount({ username, email, password }) {
  // IMPORTANT: no Authorization header
  const r = await fetch(api("/auth/register/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || `Signup failed: ${r.status}`);
  return data; // your backend may or may not return tokens here
}

export async function registerThenLogin({ username, email, password }) {
  await registerAccount({ username, email, password });
  await login({ username, password });
}

export function logout() {
  setTokens({ access: null, refresh: null });
}

