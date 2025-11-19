import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setTokens, getCurrentUser } from "../lib/api";

export default function OidcCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get("access");
    const refresh = params.get("refresh");

    if (!access || !refresh) {
      navigate("/login");
      return;
    }

    setTokens({ access, refresh });

    getCurrentUser()
      .catch(() => {})
      .finally(() => navigate("/"));
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <span className="loading loading-spinner loading-lg mr-2" />
      <span>Signing you in…</span>
    </div>
  );
}

