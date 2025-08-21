export function isAuthed() {
  return !!localStorage.getItem("access");
}

// src/lib/auth.js
export function logout(navigate) {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  // optional: also clear any cached user info
  // localStorage.removeItem("user");

  if (navigate) {
    navigate("/login", { replace: true });
  } else {
    window.location.href = "/login";
  }
}

// src/lib/auth.js
const RAW_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";
const BASE = RAW_BASE.replace(/\/+$/, "").endsWith("/api") ? RAW_BASE.replace(/\/+$/, "") : RAW_BASE.replace(/\/+$/, "") + "/api";
const api = (p) => `${BASE}${p.startsWith("/") ? "" : "/"}${p}`;

const extractErrors = (data, fallback) => {
  if (!data || typeof data !== "object") return fallback;
  if (typeof data.detail === "string") return data.detail; // e.g., non-field error
  // join field errors like {"username":["already exists"], "email":["..."]}
  const parts = [];
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) parts.push(`${k}: ${v.join(", ")}`);
    else if (typeof v === "string") parts.push(`${k}: ${v}`);
  }
  return parts.join(" · ") || fallback;
};

export async function registerAccount({username, email, password}) {
  const res = await fetch(api("/auth/register/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  let data;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    throw new Error(extractErrors(data, `Signup failed: ${res.status}`));
  }

  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  return data.user;
}

