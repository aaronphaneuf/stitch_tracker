import { useEffect, useMemo, useRef, useState } from "react";
import { createProgress, createProgressWithImages, updateProgress } from "../lib/api";

export default function ProgressModal({ projectId, progress = null, open, onClose, onSaved }) {
  const isEdit = !!progress;

  const [rows, setRows] = useState(0);
  const [stitches, setStitches] = useState(0);
  const [notes, setNotes] = useState("");

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [running, setRunning] = useState(true);
  const [startMs, setStartMs] = useState(null);
  const [accMs, setAccMs] = useState(0);
  const [now, setNow] = useState(Date.now());
  const tickRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      setRows(progress?.rows_completed ?? 0);
      setStitches(progress?.stitches_completed ?? 0);
      setNotes(progress?.notes ?? "");
      setRunning(false);
      setStartMs(null);
      setAccMs(0);
      setNow(Date.now());
      setFiles([]);
      setPreviews([]);
    } else {
      setRows(0);
      setStitches(0);
      setNotes("");
      setRunning(true);
      setStartMs(Date.now());
      setAccMs(0);
      setNow(Date.now());
      setFiles([]);
      setPreviews([]);
    }
  }, [open, isEdit, progress]);

  useEffect(() => {
    if (!open || isEdit || !running) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => setNow(Date.now()), 500);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [open, isEdit, running]);

  const elapsedLabel = useMemo(() => {
    const live = running && startMs ? now - startMs : 0;
    const total = accMs + Math.max(0, live);
    const s = Math.floor(total / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [accMs, running, startMs, now]);

  const pause = () => {
    if (!running) return;
    const t = Date.now();
    if (startMs) setAccMs(prev => prev + (t - startMs));
    setStartMs(null);
    setRunning(false);
  };

  const resume = () => {
    if (running) return;
    setStartMs(Date.now());
    setRunning(true);
  };

  const resetTimer = () => {
    setAccMs(0);
    setStartMs(running ? Date.now() : null);
    setNow(Date.now());
  };

  useEffect(() => {
    previews.forEach(u => URL.revokeObjectURL(u));
    const next = files.map(f => URL.createObjectURL(f));
    setPreviews(next);
    return () => next.forEach(u => URL.revokeObjectURL(u));
  }, [files.length]);

  const onFileChange = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
  };

  const clearFiles = () => {
    setFiles([]);
    setPreviews([]);
  };

  const save = async () => {
    if (isEdit) {
      if (!progress?.id) {
        alert("Cannot edit: progress id is missing.");
        return;
      }
      await updateProgress(progress.id, {
        rows_completed: Number(rows || 0),
        stitches_completed: Number(stitches || 0),
        notes: notes || "",
      });
    } else {
      const payload = {
        project: Number(projectId),
        rows_completed: Number(rows || 0),
        stitches_completed: Number(stitches || 0),
        notes: notes || "",
      };
      if (files.length > 0) {
        await createProgressWithImages({ ...payload, images: files });
      } else {
        await createProgress(payload);
      }
    }
    onSaved?.();
    onClose?.();
  };

  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className="modal-box max-w-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">{isEdit ? "Edit Progress" : "Add Progress"}</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>

        {!isEdit && (
          <div className="flex items-center gap-2 mb-4">
            <span className="badge">Timer</span>
            <span className="font-mono">{elapsedLabel}</span>
            {running ? (
              <button className="btn btn-xs" onClick={pause}>Pause</button>
            ) : (
              <button className="btn btn-xs" onClick={resume}>Resume</button>
            )}
            <button className="btn btn-xs btn-ghost" onClick={resetTimer}>Reset</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="card bg-base-200">
            <div className="card-body p-3 gap-2">
              <div className="text-xs opacity-70">Rows</div>
              <div className="text-2xl font-bold">{rows}</div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-sm" onClick={() => setRows(v => v + 1)}>+1</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setRows(v => Math.max(0, v - 1))}>-1</button>
              </div>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body p-3 gap-2">
              <div className="text-xs opacity-70">Stitches</div>
              <div className="text-2xl font-bold">{stitches}</div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-sm" onClick={() => setStitches(v => v + 1)}>+1</button>
                <button className="btn btn-sm" onClick={() => setStitches(v => v + 10)}>+10</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setStitches(v => Math.max(0, v - 1))}>-1</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setStitches(v => Math.max(0, v - 10))}>-10</button>
              </div>
            </div>
          </div>
        </div>

        {!isEdit && (
          <div className="mb-4">
            <label className="form-control w-full">
              <div className="label"><span className="label-text">Photos (optional)</span></div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFileChange}
                className="file-input file-input-bordered w-full"
              />
            </label>
            {previews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <img key={i} src={src} alt="" className="w-16 h-16 object-cover rounded border" />
                ))}
                <button className="btn btn-xs btn-ghost" onClick={clearFiles}>Clear</button>
              </div>
            )}
          </div>
        )}

        <label className="form-control w-full mb-4">
          <div className="label"><span className="label-text">Notes (optional)</span></div>
          <textarea
            className="textarea textarea-bordered"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you do? Any issues to remember next time?"
          />
        </label>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={!isEdit && rows === 0 && stitches === 0}
          >
            {isEdit ? "Save Changes" : "Save"}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}

