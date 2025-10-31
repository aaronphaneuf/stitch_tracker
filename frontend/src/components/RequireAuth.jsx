import { Navigate, useLocation } from "react-router-dom";
import { isAuthed } from "../lib/auth";

export default function RequireAuth({ children }) {
  const loc = useLocation();
  if (!isAuthed()) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
}
