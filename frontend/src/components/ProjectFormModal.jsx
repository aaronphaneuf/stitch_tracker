import { useEffect, useMemo, useState } from "react";
import TagSelector from "./TagSelector";
import PatternEditor from "./PatternEditor";
import { createProject, listTags } from "../lib/api";

function sizeToSuggestions(needle_or_hook_size) {
  const out = new Set();
  const s = (needle_or_hook_size || "").toLowerCase();
  const mm = s.match(/(\d+(\.\d+)?)\s*mm/);
  const us = s.match(/\bus\s*([0-9]+)\b/);
  if (mm) out.add(`${mm[1]}mm`);
  if (us) out.add(`US ${us[1]}`);
  return Array.from(out);
}

function namesToIds(names, allTags) {
  const index = new Map(allTags.map((t) => [String(t.name).toLowerCase(), t.id]));
  const ids = [];
  for (const n of names) {
    const id = index.get(String(n).trim().toLowerCase());
    if (id) ids.push(id);
  }
  return ids;
}

export default function ProjectFormModal({ open, onClose, onCreated, onSaved }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("knit");
  const [needleOrHook, setNeedleOrHook] = useState("");
  const [notes, setNotes] = useState("");
  const [patternHTML, setPatternHTML] = useState("");
  const [startDate, setStartDate] = useState("");
  const [goalDate, setGoalDate] = useState(""); 

  const [tags, setTags] = useState([]); 

  const [allTags, setAllTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const sizeSuggestions = useMemo(() => {
    const suggestions = sizeToSuggestions(needleOrHook);
    const picked = new Set(tags.map((t) => t.toLowerCase()));
    return suggestions.filter((s) => !picked.has(s.toLowerCase()));
  }, [needleOrHook, tags]);

useEffect(() => {
  if (!open) return;
  let cancelled = false;
  (async () => {
    try {
      setTagsLoading(true);
      const json = await listTags(""); 
      const arr = Array.isArray(json?.results) ? json.results : json;
      const normalized = (arr || [])
        .map((t) => ({ id: t?.id, name: t?.name }))
        .filter((t) => t.id && t.name);
      if (!cancelled) setAllTags(normalized);
    } catch (e) {
      console.error("[ProjectFormModal] listTags error:", e);
      if (!cancelled) setAllTags([]); 
    } finally {
      if (!cancelled) setTagsLoading(false);
    }
  })();
  return () => { cancelled = true; };
}, [open]);

  const reset = () => {
    setName("");
    setType("knit");
    setNeedleOrHook("");
    setNotes("");
    setPatternHTML("");
    setStartDate("");
    setGoalDate("");
    setTags([]);
    setFormErr("");
    setSaving(false);
  };

  const save = async () => {
    if (!startDate) {
      setFormErr("Please select a start date.");
      return;
    }
    setFormErr("");
    setSaving(true);
    try {
      const tagIds = namesToIds(tags, allTags);
      await createProject({
        name,
        type,
        needle_or_hook_size: needleOrHook,
        notes,
        pattern_text: patternHTML,
        start_date: startDate,
        expected_end_date: goalDate || null,
        tags: tagIds,
      });
      onCreated?.();
      onSaved?.();
      reset();
      onClose?.();
    } catch (e) {
      setFormErr(e?.message || "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog className={`modal modal-bottom sm:modal-middle ${open ? "modal-open" : ""}`}>
      <div
        className="
          modal-box w-full sm:max-w-lg p-4 sm:p-6
          h-[92dvh] sm:h-auto max-h-[92dvh] sm:max-h-[85vh]
          flex flex-col overflow-hidden
        "
      >
        <div className="flex items-center justify-between mb-2 sticky top-0 bg-base-100 z-10 pb-2">
          <h3 className="font-bold text-lg">Add Project</h3>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => { reset(); onClose?.(); }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {formErr && <div className="alert alert-error mb-2">{formErr}</div>}

        <div className="flex-1 overflow-y-auto pr-1 sm:pr-0 space-y-3">
          <input
            className="input input-bordered w-full"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            className="select select-bordered w-full"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="knit">Knitting</option>
            <option value="crochet">Crochet</option>
          </select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="form-control">
              <div className="label"><span className="label-text">Start date *</span></div>
              <input
                type="date"
                className="input input-bordered"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="form-control">
              <div className="label"><span className="label-text">Goal date</span></div>
              <input
                type="date"
                className="input input-bordered"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
              />
            </label>
          </div>

          <input
            className="input input-bordered w-full"
            placeholder="Needle or hook size (e.g. 4.5 mm / US 7)"
            value={needleOrHook}
            onChange={(e) => setNeedleOrHook(e.target.value)}
          />

          {sizeSuggestions.length > 0 && (
            <div className="text-xs">
              <span className="opacity-60 mr-2">Suggested:</span>
              {sizeSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="badge badge-outline mr-2 mb-2"
                  onClick={() =>
                    setTags((prev) =>
                      prev.some((t) => t.toLowerCase() === s.toLowerCase())
                        ? prev
                        : [...prev, s]
                    )
                  }
                >
                  + {s}
                </button>
              ))}
            </div>
          )}

          <label className="form-control">
            <div className="label"><span className="label-text">Notes</span></div>
            <textarea
              className="textarea textarea-bordered"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details to remember…"
            />
          </label>

          <div className="form-control">
            <div className="label"><span className="label-text">Pattern</span></div>
            <div className="rounded-box border border-base-300 overflow-hidden">
              <div className="max-h-64 sm:max-h-none overflow-y-auto">
                <PatternEditor value={patternHTML} onChange={setPatternHTML} />
              </div>
            </div>
                      </div>

          <div className="form-control">
            <div className="label"><span className="label-text">Tags</span></div>
            <TagSelector
              value={tags}
              onChange={setTags}
              options={allTags}
              placeholder={tagsLoading ? "Loading…" : "Type to search or add…"}
            />
            <div className="mt-1 text-xs opacity-60">
              Tags aren’t auto-filled. Type to search or tap a suggestion above.
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-base-300 sticky bottom-0 bg-base-100">
          <div className="modal-action mt-0">
            <button
              className="btn btn-ghost"
              onClick={() => { reset(); onClose?.(); }}
            >
              Cancel
            </button>
            <button
              className={`btn btn-primary ${saving ? "loading" : ""}`}
              onClick={save}
              disabled={saving}
            >
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop" onClick={() => { reset(); onClose?.(); }}>
        <button>close</button>
      </form>
    </dialog>
  );
}
