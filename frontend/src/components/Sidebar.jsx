import { useEffect, useState, useMemo } from "react";
import { NavLink,Link, useNavigate } from "react-router-dom";
import { logout } from "../lib/auth";
import AppLogo from "../assets/logo.svg?react";

const DARK_THEMES = new Set([
  "dark", "synthwave", "halloween", "forest", "black", "luxury", "dracula",
  "business", "coffee", "night", "dim", "abyss"
]);

export default function Sidebar() {
  const [theme, setTheme] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const item = (isActive) =>
    ["btn btn-ghost justify-start w-full", isActive ? "bg-base-200 font-semibold" : ""].join(" ");

  const handleLogout = () => logout(navigate);

  useEffect(() => {
    const html = document.documentElement;
    const saved = localStorage.getItem("theme");
    const initial = saved || html.getAttribute("data-theme") || "dark";
    html.setAttribute("data-theme", initial);
    setTheme(initial);

    const obs = new MutationObserver(() => {
      const t = html.getAttribute("data-theme") || "dark";
      setTheme(t);
      localStorage.setItem("theme", t);
    });
    obs.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const toggleTheme = () => {
    const next = DARK_THEMES.has(theme) ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  if (!theme) return null;

  const Logo = (
  <Link to="/" className="block">
    <AppLogo className="w-14 h-14 text-accent" />
  </Link>
);
  const navItems = (
    <>
      <li>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `rounded ${isActive ? "active font-bold" : ""}`}
          onClick={() => setOpen(false)}
        >
          Projects
        </NavLink>
      </li>
      <li><NavLink to="/yarn" onClick={() => setOpen(false)}>Yarn Stash</NavLink></li>
      <li>
        <NavLink
          to="/tags"
          className={({ isActive }) => `rounded ${isActive ? "active font-bold" : ""}`}
          onClick={() => setOpen(false)}
        >
          Tags
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/settings"
          className={({ isActive }) => `rounded ${isActive ? "active font-bold" : ""}`}
          onClick={() => setOpen(false)}
        >
          Settings
        </NavLink>
      </li>
	  <li>
        <NavLink
          to="/me"
          className={({ isActive }) => `rounded ${isActive ? "active font-bold" : ""}`}
          onClick={() => setOpen(false)}
        >
          User
        </NavLink>
      </li>

                </>
  );

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-base-200 border-b border-base-300">
        <div className="navbar px-4 justify-between">
          <div className="flex items-center gap-2">
            {Logo}
            <span className="text-base font-semibold opacity-80">Stitch Tracker</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost btn-square"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(v => !v)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div
          id="mobile-menu"
          className={`overflow-hidden transition-[max-height] duration-300 ${open ? "max-h-96" : "max-h-0"}`}
        >
          <nav className="p-4 bg-base-200">
            <ul className="menu menu-vertical text-base">{navItems}</ul>
          </nav>
        </div>
      </header>

      <aside className="hidden md:flex md:flex-col p-4 w-60 border-r border-base-300 bg-base-200 min-h-screen">
        <div className="mb-4 flex flex-col items-center">
          {Logo}
          <div className="mt-2 text-sm font-semibold opacity-70 tracking-wide">Stitch Tracker</div>
        </div>
        <ul className="menu text-lg space-y-2">{navItems}</ul>
      </aside>
    </>
  );
}
