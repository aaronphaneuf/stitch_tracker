import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getProject,
  updateProject,
  deleteProgress,
  updateProjectCover,
  deleteProjectYarn,
  listTags,
} from "../lib/api";
import ProgressTimeline from "../components/ProgressTimeline";
import ProgressModal from "../components/ProgressModal";
import PatternEditor from "../components/PatternEditor";
import AddProjectYarnModal from "../components/AddProjectYarnModal";
import ImageGalleryModal from "../components/ImageGalleryModal";
import TagSelector from "../components/TagSelector";

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4">
      <div className="opacity-60">{label}</div>
      <div className="md:col-span-2 break-words">{children || "—"}</div>
    </div>
  );
}

function CompactCover({ src, title, onChange, sizeClass = "w-24 h-24 md:w-28 md:h-28" }) {
  const inputRef = useRef(null);
  return (
    <div className="relative">
      <div className="avatar">
        <div className={`${sizeClass} rounded-full ring ring-base-300 ring-offset-2 ring-offset-base-100 shadow overflow-hidden`}>
          {src ? (
            <img src={src} alt="" className="object-cover w-full h-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-base-200 to-base-300">
              <span className="text-xl md:text-2xl font-black opacity-60">
                {(title || "")
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase())
                  .join("") || "—"}
              </span>
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="btn btn-xs btn-circle absolute -bottom-2 -right-2 md:-bottom-1 md:-right-1 shadow-md"
        title="Change cover"
        onClick={() => inputRef.current?.click()}
      >
        ✎
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) await onChange?.(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const dateValue = (d) => (typeof d === "string" ? d.slice(0, 10) : "");

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [err, setErr] = useState("");

  const [editingPattern, setEditingPattern] = useState(false);
  const [patternHTML, setPatternHTML] = useState("");

  const [editDetails, setEditDetails] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "knit",
    start_date: "",
    expected_end_date: "",
    needle_or_hook_size: "",
    pattern_link: "",
    notes: "",
  });

  const [tagNames, setTagNames] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [addYarnOpen, setAddYarnOpen] = useState(false);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);

  const openGallery = (images = []) => {
    if (!images || images.length === 0) return;
    setGalleryImages(images);
    setGalleryOpen(true);
  };

  const load = useCallback(async () => {
    setErr("");
    const data = await getProject(id);
    setProject(data);
    setPatternHTML(data.pattern_text || "");
    setForm({
      name: data.name || "",
      type: data.type || "knit",
      start_date: dateValue(data.start_date) || "",
      expected_end_date: dateValue(data.expected_end_date) || "",
      needle_or_hook_size: data.needle_or_hook_size || "",
      pattern_link: data.pattern_link || "",
      notes: data.notes || "",
    });
    setTagNames((data.tags || []).map((t) => t.name));
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getProject(id);
        if (!alive) return;
        setProject(data);
        setPatternHTML(data.pattern_text || "");
        setForm({
          name: data.name || "",
          type: data.type || "knit",
          start_date: dateValue(data.start_date) || "",
          expected_end_date: dateValue(data.expected_end_date) || "",
          needle_or_hook_size: data.needle_or_hook_size || "",
          pattern_link: data.pattern_link || "",
          notes: data.notes || "",
        });
        setTagNames((data.tags || []).map((t) => t.name));
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load project");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!editDetails) return;
      try {
        setTagsLoading(true);
        const json = await listTags("");
        const arr = Array.isArray(json?.results) ? json.results : json;
        const normalized = (arr || [])
          .map((t) => ({ id: t?.id, name: t?.name }))
          .filter((t) => t.id && t.name);
        if (alive) setAllTags(normalized);
      } catch {
        if (alive) setAllTags([]);
      } finally {
        if (alive) setTagsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [editDetails]);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const handleEdit = (item) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Delete this progress entry?")) return;
    try {
      await deleteProgress(item.id);
      await load();
    } catch (e) {
      alert(e.message || "Failed to delete");
    }
  };

  const saveDetails = async () => {
    setSavingDetails(true);
    try {
      await updateProject(project.id, {
        name: form.name,
        type: form.type,
        start_date: form.start_date || null,
        expected_end_date: form.expected_end_date || null,
        needle_or_hook_size: form.needle_or_hook_size || "",
        pattern_link: form.pattern_link || "",
        notes: form.notes || "",
        tag_names: tagNames,
      });
      await load();
      setEditDetails(false);
    } catch (e) {
      alert(e.message || "Failed to save");
    } finally {
      setSavingDetails(false);
    }
  };

  const handleRemoveProjectYarn = async (projectYarnId) => {
    if (!window.confirm("Remove this yarn from the project?")) return;
    try {
      await deleteProjectYarn(projectYarnId);
      await load();
    } catch (e) {
      alert(e.message || "Failed to remove yarn");
    }
  };

  if (err) {
    return (
      <div className="space-y-3">
        <div className="alert alert-error">
          <span>{err}</span>
        </div>
        <Link to="/" className="btn btn-ghost">
          ← Back
        </Link>
      </div>
    );
  }

  if (!project) return <div className="card bg-base-200 h-40 animate-pulse" />;

  const { name, type } = project;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-3xl font-bold">{name}</h1>
        <div className="badge badge-lg capitalize">{type}</div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Details</h3>
            {!editDetails ? (
              <button className="btn btn-sm" onClick={() => setEditDetails(true)}>
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setForm({
                      name: project.name || "",
                      type: project.type || "knit",
                      start_date: dateValue(project.start_date) || "",
                      expected_end_date: dateValue(project.expected_end_date) || "",
                      needle_or_hook_size: project.needle_or_hook_size || "",
                      pattern_link: project.pattern_link || "",
                      notes: project.notes || "",
                    });
                    setTagNames((project.tags || []).map((t) => t.name));
                    setEditDetails(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`btn btn-sm btn-primary ${savingDetails ? "loading" : ""}`}
                  onClick={saveDetails}
                  disabled={savingDetails}
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-start">
            <div className="justify-self-center md:justify-self-start">
              <CompactCover
                src={project.main_image}
                title={project.name}
                onChange={async (file) => {
                  await updateProjectCover(project.id, file);
                  await load();
                }}
              />
            </div>
            {!editDetails ? (
              <div className="space-y-3 md:space-y-4">
                <Row label="Name">{form.name || "—"}</Row>
                <Row label="Type" >{form.type}</Row>
                <Row label="Start">{fmtDate(form.start_date)}</Row>
                <Row label="Goal">{fmtDate(form.expected_end_date)}</Row>
                <Row label="Needle/Hook">{form.needle_or_hook_size}</Row>
                <Row label="Pattern link">
                  {form.pattern_link ? (
                    <a
                      className="link break-words"
                      href={form.pattern_link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {form.pattern_link}
                    </a>
                  ) : (
                    "—"
                  )}
                </Row>
                <Row label="Tags">
                  {project.tags?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((t) => (
                        <span key={t.id} className="badge badge-outline">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </Row>
                <Row label="Notes">
                  {form.notes ? <p className="whitespace-pre-wrap">{form.notes}</p> : "—"}
                </Row>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <label className="form-control">
                  <div className="label"><span className="label-text">Name</span></div>
                  <input
                    className="input input-bordered"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </label>

                <label className="form-control">
                  <div className="label"><span className="label-text">Type</span></div>
                  <select
                    className="select select-bordered"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    <option value="knit">Knitting</option>
                    <option value="crochet">Crochet</option>
                  </select>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="form-control">
                    <div className="label"><span className="label-text">Start date</span></div>
                    <input
                      type="date"
                      className="input input-bordered"
                      value={form.start_date}
                      onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    />
                  </label>

                  <label className="form-control">
                    <div className="label"><span className="label-text">Goal date</span></div>
                    <input
                      type="date"
                      className="input input-bordered"
                      value={form.expected_end_date}
                      onChange={(e) => setForm((f) => ({ ...f, expected_end_date: e.target.value }))}
                    />
                  </label>
                </div>

                <label className="form-control">
                  <div className="label"><span className="label-text">Needle/Hook size</span></div>
                  <input
                    className="input input-bordered"
                    value={form.needle_or_hook_size}
                    onChange={(e) => setForm((f) => ({ ...f, needle_or_hook_size: e.target.value }))}
                    placeholder="e.g. 4.5 mm / US 7"
                  />
                </label>

                <label className="form-control">
                  <div className="label"><span className="label-text">Pattern link</span></div>
                  <input
                    className="input input-bordered"
                    value={form.pattern_link}
                    onChange={(e) => setForm((f) => ({ ...f, pattern_link: e.target.value }))}
                    placeholder="https://…"
                  />
                </label>

                <div className="form-control">
                  <div className="label">
                    <span className="label-text">Tags</span>
                    {tagsLoading && <span className="loading loading-spinner loading-xs ml-2" />}
                  </div>
                  <TagSelector
                    value={tagNames}
                    onChange={setTagNames}
                    options={allTags}
                    placeholder={tagsLoading ? "Loading…" : "Type to search…"}
                  />
                  <div className="mt-1 text-xs opacity-60">
                    Choose from existing tags. (Creation here is disabled.)
                  </div>
                </div>

                <label className="form-control">
                  <div className="label"><span className="label-text">Notes</span></div>
                  <textarea
                    className="textarea textarea-bordered"
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Yarn used</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setAddYarnOpen(true)}>
              Add from stash
            </button>
          </div>

          {project.yarns?.length ? (
            <ul className="space-y-2">
              {project.yarns.map((py) => (
                <li key={py.id} className="flex items-center justify-between rounded bg-base-100 p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full border shrink-0"
                      style={{ backgroundColor: py.yarn?.colour || "#ccc" }}
                    />
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {(py.yarn?.brand || "—")} — {(py.yarn?.weight || "—")}
                      </div>
                      <div className="text-xs opacity-70 truncate">
                        {(py.yarn?.material || "—")} · {(py.yarn?.colour_name || "—")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const raw =
                        py?.quantity_used_skeins ??
                        py?.skeins_used ??
                        py?.quantity_skeins ??
                        py?.used_skeins ??
                        py?.quantity;
                      const skeins =
                        raw === null || raw === undefined || raw === ""
                          ? 0
                          : Number.isFinite(Number(raw))
                          ? parseInt(String(raw), 10)
                          : 0;
                      return <span className="badge badge-outline">{skeins} skeins</span>;
                    })()}

                    <button
                      className="btn btn-xs btn-error"
                      onClick={() => handleRemoveProjectYarn(py.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm opacity-70">No yarn added to this project yet.</div>
          )}
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Pattern</h3>
            {!editingPattern ? (
              <button className="btn btn-sm" onClick={() => setEditingPattern(true)}>
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setPatternHTML(project.pattern_text || "");
                    setEditingPattern(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={async () => {
                    await updateProject(project.id, { pattern_text: patternHTML });
                    await load();
                    setEditingPattern(false);
                  }}
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {!editingPattern ? (
            <div className="prose max-w-none">
              {project.pattern_text ? (
                <div dangerouslySetInnerHTML={{ __html: project.pattern_text }} />
              ) : (
                <p className="opacity-60">No pattern yet.</p>
              )}
            </div>
          ) : (
            <PatternEditor value={patternHTML} onChange={setPatternHTML} />
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Link to="/" className="btn btn-ghost">← Back</Link>
        <button className="btn btn-primary" onClick={handleAdd}>Add Progress</button>
      </div>

      <section className="mt-2">
        <h2 className="text-xl font-bold mb-3">Progress Timeline</h2>
        <ProgressTimeline
          updates={project?.progress_updates || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenImages={openGallery}
        />
      </section>

      <ProgressModal
        projectId={project.id}
        progress={editing}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => load()}
      />

      <AddProjectYarnModal
        projectId={id}
        open={addYarnOpen}
        onClose={() => setAddYarnOpen(false)}
        onAdded={load}
        existingProjectYarns={project.yarns || []}
      />

      <ImageGalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={galleryImages}
      />
    </div>
  );
}
