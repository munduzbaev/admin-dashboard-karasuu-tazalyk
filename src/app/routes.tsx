import { createBrowserRouter, Outlet, Navigate, useLocation } from "react-router";
import { Sidebar } from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import Operators from "./pages/Operators";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Schedule from "./pages/Schedule";
import Transport from "./pages/Transport";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import NewApplication from "./pages/NewApplication";

function RequireAuth() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: RequireAuth,
    children: [
      { index: true, Component: Dashboard },
      { path: "applications", Component: Applications },
      { path: "applications/new", Component: NewApplication },
      { path: "schedule", Component: Schedule },
      { path: "transport", Component: Transport },
      { path: "operators", Component: Operators },
      { path: "reports", Component: Reports },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
      { path: "*", Component: () => <Navigate to="/" replace /> },
    ],
  },
]);
