import { createBrowserRouter, Outlet, Navigate } from "react-router";
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
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
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
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "applications", element: <Applications /> },
      { path: "applications/new", element: <NewApplication /> },
      { path: "schedule", element: <Schedule /> },
      { path: "transport", element: <Transport /> },
      { path: "operators", element: <Operators /> },
      { path: "reports", element: <Reports /> },
      { path: "profile", element: <Profile /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
