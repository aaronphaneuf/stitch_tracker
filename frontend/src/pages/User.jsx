import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, listAllProgress } from "../lib/api";
import { logout } from "../lib/auth";
import ContributionCalendar from "../components/ContributionCalendar";
import ChangePasswordModal from "../components/ChangePasswordModal";

function Avatar({ name = "", size = 64 }) {
  const initials =
    name.split(/\s+/).filter(Boolean).slice(0, 2)
      .map(w => w[0]?.toUpperCase()).join("") || "🙂";
  return (
    <div className="avatar">
      <div
        className="rounded-full bg-gradient-to-br from-base-200 to-base-300 ring ring-base-300 ring-offset-2"
        style={{ width: size, height: size }}
      >
        <div className="w-full h-full flex items-center justify-center font-black text-xl">
          {initials}
        </div>
      </div>
    </div>
  );
}

export default function UserPage() {
  const [user, setUser] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState([]);
  const [calWeeks, setCalWeeks] = useState(53);
  const [pwOpen, setPwOpen] = useState(false);

  const navigate = useNavigate();

  const load = async () => {
    try {
      setErr(""); setLoading(true);
      const me = await getCurrentUser();
      setUser(me);
      const all = await listAllProgress();
      setProgress(Array.isArray(all) ? all : []);
    } catch (e) {
      setErr(e.message || "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const countsByDate = useMemo(() => {
    const counts = {};
    for (const p of progress) {
      const raw = p.date || p.created_at || p.created || p.timestamp || p.updated_at || null;
      if (!raw) continue;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [progress]);

  if (loading) return <div className="card bg-base-200 h-40 animate-pulse" />;

  if (err) {
    return (
      <div className="space-y-3">
        <div className="alert alert-error"><span>{err}</span></div>
        <button className="btn" onClick={load}>Retry</button>
      </div>
    );
  }

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    "User";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-base-200">
        <div className="card-body flex items-center gap-4">
          <Avatar name={displayName} size={72} />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <div className="opacity-70">{user?.email || "—"}</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => setPwOpen(true)}>
              Change Password
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => logout(navigate)}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Overall progress</h3>
            <div className="join">
              <button className={`btn btn-sm join-item ${calWeeks===17?"btn-active":""}`} onClick={()=>setCalWeeks(17)}>~4 mo</button>
              <button className={`btn btn-sm join-item ${calWeeks===35?"btn-active":""}`} onClick={()=>setCalWeeks(35)}>~8 mo</button>
              <button className={`btn btn-sm join-item ${calWeeks===53?"btn-active":""}`} onClick={()=>setCalWeeks(53)}>1 yr</button>
            </div>
          </div>
          <ContributionCalendar countsByDate={countsByDate} weeks={calWeeks} />
        </div>
      </div>

      <ChangePasswordModal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        onChanged={() =>  {/* optionally toast */}}
      />
    </div>
  );
}

