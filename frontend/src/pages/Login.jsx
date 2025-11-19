import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, getCurrentUser } from "../lib/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_BASE || "/api";
  const OIDC_LOGIN_URL = "/oidc/authenticate/"; 
  

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await login({ username, password });
      await getCurrentUser();
      navigate("/");
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] grid place-items-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm bg-base-200 shadow-md">
        <div className="card-body gap-3">
          <h2 className="card-title">Sign in</h2>
          {err && <div className="alert alert-error py-2">{err}</div>}
          <input
            className="input input-bordered w-full"
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            className="input input-bordered w-full"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button className={`btn btn-primary ${loading ? "loading" : ""}`} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>

	  <button
  type="button"
  className="btn btn-outline w-full mt-2"
  onClick={() => {
    window.location.href = OIDC_LOGIN_URL;
  }}
>
  Sign in with Single Sign-On
</button>


          <p className="text-sm text-center mt-2">
            Don’t have an account?{" "}
            <Link to="/signup" className="link link-primary">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
