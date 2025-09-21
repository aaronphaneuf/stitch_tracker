// frontend/src/lib/auth.js

// Base URL construction
const RAW_BASE = import.meta.env.VITE_API_BASE || "/api";
const BASE = RAW_BASE.replace(/\/+$/, "");
const api = (p) => `${BASE}${p.startsWith("/") ? "" : "/"}${p}`;

// ---- AUTH: keep everything here ----

// Login (function declaration so it’s hoisted)
export async function login({ username, password }) {
  const r = await fetch(api("/token/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!r.ok) throw new Error("Invalid credentials");
  const data = await r.json();
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  return data;
}

export async function registerAccount({ username, email, password }) {
  const r = await fetch(api("/auth/register/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  let data; try { data = await r.json(); } catch {}
  if (!r.ok) throw new Error((data && (data.detail || data.error)) || `Signup failed: ${r.status}`);
  return data;
}

// Uses the hoisted login() above
export async function registerThenLogin({ username, email, password }) {
  await registerAccount({ username, email, password });
  await login({ username, password });     // <-- now defined in this file
  window.location.href = "/";              // hard reload to ensure new identity
}

// Small helpers
export function isAuthed() {
  return !!localStorage.getItem("access");
}

export function logout(navigate) {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  // force a fresh app state
  if (navigate) {
    navigate("/login", { replace: true });
    setTimeout(() => window.location.reload(), 0);
  } else {
    window.location.replace("/login");
  }
}

