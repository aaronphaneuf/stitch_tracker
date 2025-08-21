import { useState, useEffect } from "react";
import PatternEditor from "../components/PatternEditor";
import { getProject, updateProject } from "../lib/api";
import { useParams } from "react-router-dom";

export default function ProjectEdit() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [patternHTML, setPatternHTML] = useState("");

  useEffect(() => {
    (async () => {
      const data = await getProject(id);
      setProject(data);
      setPatternHTML(data.pattern_text || "");
    })();
  }, [id]);

  const save = async () => {
    await updateProject(id, { ...project, pattern_text: patternHTML });
  };

  if (!project) return <div>Loading…</div>;

  return (
    <div className="space-y-4">
      <input
        className="input input-bordered w-full"
        value={project.name}
        onChange={(e) => setProject({ ...project, name: e.target.value })}
      />

      <label className="label"><span className="label-text">Pattern</span></label>
      <PatternEditor value={patternHTML} onChange={setPatternHTML} />

      <button className="btn btn-primary" onClick={save}>
        Save
      </button>
    </div>
  );
}

