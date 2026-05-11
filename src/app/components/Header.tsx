import { useState, useEffect } from "react";
import { Search, Bell, ChevronDown, LogOut, Settings, Moon, HelpCircle } from "lucide-react";
import { Input } from "./ui/input";
import { useNavigate } from "react-router";
import { api } from "../api";

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
  const [showMenu, setShowMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));

  const [newApps, setNewApps] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "А";

  const displayName = user?.name || "Администратор";

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await api.get("/applications?status=new&unread_only=true");
        if (res.data?.success) {
          const d = Array.isArray(res.data.data) ? res.data.data : [];
          setNewApps(d.slice(0, 5));
          setUnreadCount(d.length);
        }
      } catch (e) { }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const markAllRead = async () => {
    try {
      const res = await api.patch("/applications/mark-read", { all: true });
      if (res.data?.success) {
        setUnreadCount(0);
        setNewApps([]);
      }
    } catch (e) { }
  };

  const handleNotificationClick = async (id: string | number) => {
    try {
      await api.patch("/applications/mark-read", { ids: [id] });
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNewApps((prev) => prev.filter((app) => app.id !== id));
      navigate(`/applications?id=${id}`);
      setShowNotifications(false);
    } catch (e) { }
  };

  const formatNotificationDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}, ${hours}:${minutes}`;
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
      <div className="relative">
        <button
          onClick={() => setShowNotifications(v => !v)}
          className="relative w-9 h-9 rounded-lg hover:bg-gray-50 flex items-center justify-center transition-colors"
        >
          <Bell className="w-4 h-4 text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-[#3B82F6] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white" style={{ fontWeight: 700 }}>
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 flex flex-col animate-in fade-in overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Уведомления</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[#3B82F6] hover:text-[#2563EB]" style={{ fontWeight: 500 }}>
                    Отметить все как прочитанные
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {newApps.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">Нет новых уведомлений</div>
                ) : (
                  newApps.map(app => (
                    <button
                      key={app.id}
                      onClick={() => handleNotificationClick(app.id)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-50 last:border-0 relative"
                    >
                      <div className="flex gap-3 items-start">
                        {app.is_read === false && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        <div className={`w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5 ${app.is_read === false ? 'ml-3' : ''}`}>
                          <span className="text-lg">📋</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm text-gray-900 mb-0.5" style={{ fontWeight: 600 }}>Новая заявка #{String(app.id)?.slice(0, 6)}</p>
                          <p className="text-xs text-gray-600 mb-1 flex items-start gap-1">
                            <span className="shrink-0 text-gray-400">📍</span>
                            <span className="truncate">{app.address || 'Адрес не указан'}</span>
                          </p>
                          <p className="text-[10px] text-gray-400" style={{ fontWeight: 500 }}>
                            🕐 {app.created_at ? formatNotificationDate(app.created_at) : ''}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

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
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-lg" style={{ fontWeight: 700 }}>
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-gray-900 truncate" style={{ fontWeight: 700 }}>{displayName}</p>
                  <p className="text-sm text-gray-500 truncate">{user?.email || "admin@tazalyk.kg"}</p>
                </div>
              </div>

              <div className="p-2 space-y-1 border-b border-gray-100">
                <button onClick={() => { navigate("/settings"); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Settings className="w-4 h-4 text-gray-400" />
                  Настройки профиля
                </button>

                <button onClick={toggleDarkMode} className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-gray-400" />
                    Тёмный режим
                  </div>
                  <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${darkMode ? 'bg-[#3B82F6]' : 'bg-gray-300'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  Помощь
                </button>
              </div>

              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  <LogOut className="w-4 h-4" />
                  Выйти из системы
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
