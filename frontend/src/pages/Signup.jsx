import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerAccount } from "../lib/auth";
import { registerThenLogin} from "../lib/auth";

export default function Signup() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await registerThenLogin(form);
      window.location.href = "/";
    } catch (e) {
      setErr(e.message || "Signup failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form onSubmit={submit} className="card bg-base-200 w-full max-w-sm">
        <div className="card-body">
          <h1 className="card-title">Create Account</h1>

          {err && <div className="alert alert-error">{err}</div>}

          <label className="form-control">
            <div className="label"><span className="label-text">Username</span></div>
            <input
              className="input input-bordered"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </label>

          <label className="form-control">
            <div className="label"><span className="label-text">Email</span></div>
            <input
              type="email"
              className="input input-bordered"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>

          <label className="form-control">
            <div className="label"><span className="label-text">Password</span></div>
            <input
              type="password"
              className="input input-bordered"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
            <div className="label">
              <span className="label-text-alt opacity-70">
                8+ chars; Django validators will enforce strength.
              </span>
            </div>
          </label>

          <div className="mt-2 flex items-center gap-2">
            <button className={`btn btn-primary ${loading ? "loading" : ""}`} disabled={loading}>
              Create account
            </button>
            <Link to="/login" className="btn btn-ghost">Have an account? Log in</Link>
          </div>
        </div>
      </form>
    </div>
  );
}
