// src/lib/backup.js
import { getCurrentUser, listAllProgress } from "./api";
import { listProjects, getProject, listTags, listYarn } from "./api";

// Keep in sync with your shelf localStorage key
const SHELF_LS_KEY = "stashShelf.v2";

function downloadBlob(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Export everything we can access through the API + local-only state.
 * Produces: { meta, data, local }
 */
export async function exportBackup() {
  // 1) Server-side collections
  const [user, projectsLite, tags, yarn, progress] = await Promise.all([
    getCurrentUser().catch(() => null),
    listProjects().catch(() => []),
    (typeof listTags === "function" ? listTags() : Promise.resolve([])).catch(() => []),
    listYarn().catch(() => []),
    listAllProgress().catch(() => []),
  ]);

  // 2) Get full project payloads (includes yarn links, pattern, etc.)
  const projects = [];
  for (const p of projectsLite || []) {
    try {
      projects.push(await getProject(p.id));
    } catch {
      projects.push(p); // fall back to lite
    }
  }

  // 3) Local-only state
  let shelfLayout = {};
  try {
    shelfLayout = JSON.parse(localStorage.getItem(SHELF_LS_KEY) || "{}");
  } catch {} // ignore

  const theme = document.documentElement.getAttribute("data-theme") || "light";

  const payload = {
    meta: {
      app: "stitch-tracker",
      version: 1,
      createdAt: new Date().toISOString(),
      userId: user?.id ?? null,
    },
    data: {
      user,
      projects,
      tags,
      yarn,
      progress,
    },
    local: {
      shelfLayout,
      theme,
    },
  };

  const username = user?.username || "user";
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  downloadBlob(`stitch-tracker-backup-${username}-${ts}.json`, payload);
}

/**
 * Import backup (safe/local-first).
 * - Restores local shelf layout + theme immediately.
 * - Returns parsed backup so caller could choose to re-create server data if desired.
 */
export async function importBackupLocal(file) {
  const text = await file.text();
  const json = JSON.parse(text);

  // Validate shape a bit
  if (!json || typeof json !== "object" || !json.meta || !json.local) {
    throw new Error("Not a Stitch Tracker backup file.");
  }

  // Restore local-only bits
  if (json.local?.shelfLayout) {
    localStorage.setItem(SHELF_LS_KEY, JSON.stringify(json.local.shelfLayout));
  }
  if (json.local?.theme) {
    document.documentElement.setAttribute("data-theme", json.local.theme);
    localStorage.setItem("theme", json.local.theme);
  }

  return json; // caller can decide what to do with json.data (recreate on server, etc.)
}

