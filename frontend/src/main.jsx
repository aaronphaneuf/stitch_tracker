import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import ProjectGrid from "./components/ProjectGrid";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import RequireAuth from "./components/RequireAuth";
import "./index.css";
import ProjectDetail from "./pages/ProjectDetail";
import YarnStash from "./pages/YarnStash.jsx";
import TagsPage from "./pages/Tags.jsx";
import UserPage from "./pages/User.jsx";
import Signup from "./pages/Signup.jsx";
import OidcCallback from "./pages/OidcCallback.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <RequireAuth><ProjectGrid /></RequireAuth> },
      { path: "yarn", element: <YarnStash /> },
      { path: "tags", element: <TagsPage /> },
      { path: "settings", element: <RequireAuth><Settings /></RequireAuth> },
      { path: "login", element: <Login /> },
      { path: "projects/:id", element: <RequireAuth><ProjectDetail /></RequireAuth> },
      { path: "/me", element: <UserPage />},
      { path: "/signup", element: <Signup />},
      { path: "/oidc-callback", element: <OidcCallback /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
