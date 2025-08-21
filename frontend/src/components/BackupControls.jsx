import { useState } from "react";
import { downloadBackup, restoreBackup, apiFetch } from "../lib/api";

const SHELF_KEY = "stashShelf.v2";
const THEME_KEY = "theme";

export default function BackupControls() {
  const downloadBackup = async () => {
    try {
      const res = await apiFetch("/api/backup/", { method: "GET" });
      if (!res.ok) throw new Error(`Backup failed: ${res.status}`);
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stitchtracker-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message || "Failed to download backup");
    }
  };

  const importBackup = async (file) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (json.local?.theme) {
        document.documentElement.setAttribute("data-theme", json.local.theme);
        localStorage.setItem("theme", json.local.theme);
      }
      if (json.local?.shelfLayout) {
        localStorage.setItem("stashShelf.v2", JSON.stringify(json.local.shelfLayout));
      }

      await apiFetch("/api/restore-local/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restored: ["theme", "shelfLayout"] }),
      });

      alert("Import complete.");
    } catch (e) {
      alert(e.message || "Import failed");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className="btn btn-primary btn-sm" onClick={downloadBackup}>Download backup</button>
      <label className="btn btn-ghost btn-sm">
        Restore…
        <input type="file" accept="application/json" className="hidden"
               onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value=""; }} />
      </label>
    </div>
  );
}
