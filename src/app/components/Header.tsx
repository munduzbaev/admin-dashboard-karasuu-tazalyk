import { useState } from "react";
import { Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { Input } from "./ui/input";
import { useNavigate } from "react-router";

interface HeaderProps {
  title: string;
  onSearch?: (value: string) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

export function Header({
  title,
  onSearch,
  searchValue = "",
  searchPlaceholder = "Поиск...",
  showSearch = true,
}: HeaderProps) {
  const [notifications] = useState(3);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "АА";

  const displayName = user?.name || "Пользователь";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shrink-0 relative z-20">
      <h1 className="text-gray-900 mr-auto" style={{ fontSize: 18, fontWeight: 600 }}>
        {title}
      </h1>

      {showSearch && (
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            className="pl-9 h-9 bg-gray-50 border-gray-200 text-sm rounded-lg focus-visible:ring-[#3B82F6]/30"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      )}

      {/* Notifications */}
      <button className="relative w-9 h-9 rounded-lg hover:bg-gray-50 flex items-center justify-center transition-colors">
        <Bell className="w-4 h-4 text-gray-500" />
        {notifications > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#3B82F6] rounded-full ring-2 ring-white" />
        )}
      </button>

      {/* User Profile */}
      <div className="relative">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
        >
          <div className="w-7 h-7 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-xs" style={{ fontWeight: 600 }}>
            {initials}
          </div>
          <span className="text-sm text-gray-700 hidden sm:block" style={{ fontWeight: 500 }}>
            {displayName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px] z-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
