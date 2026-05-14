import { NavLink } from "react-router";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings as SettingsIcon,
  Building2,
  ChevronRight,
  FileText,
  Calendar,
  Truck,
  BarChart2,
  LogOut,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Главная", icon: LayoutDashboard, end: true },
  { to: "/applications", label: "Заявки", icon: ClipboardList, end: true },
  { to: "/applications/new", label: "Новая заявка", icon: FileText, end: false },
  { to: "/schedule", label: "График", icon: Calendar, end: false },
  { to: "/transport", label: "Транспорт", icon: Truck, end: false },
  { to: "/reports", label: "Отчёты", icon: BarChart2, end: false },
  { to: "/operators", label: "Сотрудники", icon: Users, end: false },
  { to: "/settings", label: "Настройки", icon: SettingsIcon, end: false },
];

export function Sidebar() {
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const filteredNav = NAV_ITEMS.filter(item => {
    if (item.to === "/operators") return isAdmin;
    return true;
  });

  return (
    <aside className="w-60 shrink-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col shadow-sm z-10">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-900 dark:text-gray-100" style={{ fontWeight: 600, lineHeight: 1.2 }}>
            Тазалык
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500" style={{ lineHeight: 1.2 }}>
            Кара-Суу
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-2" style={{ fontWeight: 600 }}>
          Навигация
        </p>
        <ul className="space-y-0.5">
          {filteredNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group",
                    isActive
                      ? "bg-[#EFF6FF] dark:bg-blue-900/30 text-[#3B82F6]"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-[#3B82F6]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                      )}
                    />
                    <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-3 h-3 ml-auto text-[#3B82F6]" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom user quick info */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <div
          onClick={logout}
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-xs shrink-0" style={{ fontWeight: 600 }}>
            <LogOut className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 dark:text-gray-100 truncate" style={{ fontWeight: 500 }}>
              Выход
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">Завершить сеанс</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
