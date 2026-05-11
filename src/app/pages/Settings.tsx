import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Switch } from "../components/ui/switch";
import { User, Mail, Shield, Bell, Lock, Save, Loader2, Eye, EyeOff, Globe, Database, ChevronRight } from "lucide-react";
import { api } from "../api";
import { toast } from "sonner";

const ROLE_MAP: Record<string, string> = {
  super_admin: "Супер Админ",
  admin: "Администратор",
  operator: "Оператор",
  senior_operator: "Ст. оператор",
};

const SECTIONS = [
  { id: "profile", icon: User, label: "Профиль" },
  { id: "notifications", icon: Bell, label: "Уведомления" },
  { id: "security", icon: Shield, label: "Безопасность" },
  { id: "system", icon: Globe, label: "Система" },
  { id: "data", icon: Database, label: "Данные" },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState("profile");

  const [user, setUser] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    new_application: true,
    status_changed: true,
    urgent_application: true,
    system_update: false,
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/auth/me");
        const body = res.data;
        if (body.success || body.user) {
          const u = body.user || body.data;
          setUser(u);
          if (body.notification_prefs) setNotifPrefs(body.notification_prefs);
          localStorage.setItem("user", JSON.stringify(u));
        } else {
          const saved = localStorage.getItem("user");
          if (saved) setUser(JSON.parse(saved));
        }
      } catch {
        const saved = localStorage.getItem("user");
        if (saved) setUser(JSON.parse(saved));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditPhone(user.phone || "");
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.patch(`/users/${user.id}`, {
        name: editName,
        email: editEmail,
        phone: editPhone,
      });
      const body = result.data;
      if (body.success) {
        const updatedUser = { ...user, name: editName, email: editEmail, phone: editPhone };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success("Профиль сохранён");
      } else {
        toast.error("Ошибка: " + (body.error || "Не удалось сохранить"));
      }
    } catch (e) {
      toast.error("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Минимум 6 символов");
      return;
    }

    setSavingPassword(true);
    try {
      const result = await api.patch(`/users/${user.id}/password`, {
        old_password: oldPassword,
        new_password: newPassword,
      });
      const body = result.data;
      if (body.success) {
        toast.success("Пароль изменён");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error("Ошибка: " + (body.error || "Неверный старый пароль"));
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleNotifToggle = async (key: string, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);

    try {
      const result = await api.patch(`/users/${user?.id}/notif-prefs`, { [key]: value });
      const body = result.data;
      if (body.success) {
        toast.success("Настройки сохранены");
      } else {
        setNotifPrefs(notifPrefs);
        toast.error("Ошибка сохранения");
      }
    } catch {
      setNotifPrefs(notifPrefs);
      toast.error("Ошибка соединения");
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "А";

  const inputClass =
    "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Настройки" showSearch={false} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left menu */}
        <div className="w-56 shrink-0 border-r border-gray-100 bg-white p-3 space-y-0.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeSection === s.id
                  ? "bg-[#EFF6FF] text-[#3B82F6]"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
              style={{ fontWeight: activeSection === s.id ? 600 : 400 }}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
              {activeSection === s.id && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30">
          <div className="p-6 max-w-4xl space-y-6">

            {activeSection === "profile" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-8 flex items-start gap-6 border-b border-gray-100">
                    {loading ? (
                      <div className="w-24 h-24 rounded-full bg-gray-100 animate-pulse shrink-0" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-3xl shrink-0" style={{ fontWeight: 700 }}>
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 pt-2">
                      {loading ? (
                        <div className="space-y-2">
                          <div className="h-7 bg-gray-100 rounded w-48 animate-pulse" />
                          <div className="h-4 bg-gray-100 rounded w-64 animate-pulse" />
                        </div>
                      ) : (
                        <>
                          <h2 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 600 }}>
                            {user?.name || "—"}
                          </h2>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-4 h-4" /> {user?.email || "—"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Shield className="w-4 h-4" />
                              <span className="px-2 py-0.5 bg-blue-50 text-[#3B82F6] rounded-full text-xs font-medium">
                                {ROLE_MAP[user?.role] || user?.role || "—"}
                              </span>
                            </span>
                          </div>
                          {user?.created_at && (
                            <p className="text-xs text-gray-400 mt-2">
                              Каттоо: {new Date(user.created_at).toLocaleDateString("ru-RU")}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Edit profile form */}
                  <form onSubmit={handleSaveProfile} className="p-8 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-5">
                      <User className="w-4 h-4 text-gray-400" />
                      <h3 className="text-base text-gray-900" style={{ fontWeight: 600 }}>
                        Профилди өзгөртүү / Редактировать профиль
                      </h3>
                    </div>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1 font-medium">Аты-жөнү / ФИО</label>
                        <input
                          type="text"
                          className={inputClass}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1 font-medium">Email</label>
                        <input
                          type="email"
                          className={inputClass}
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1 font-medium">Телефон</label>
                        <input
                          type="tel"
                          className={inputClass}
                          placeholder="+996 700 000000"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2 bg-[#3B82F6] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#2563EB] transition-colors disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {loading ? "Сакталууда..." : "Сактоо / Сохранить"}
                      </button>
                    </div>
                  </form>

                  {/* Change password form */}
                  <form onSubmit={handleChangePassword} className="p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <Lock className="w-4 h-4 text-gray-400" />
                      <h3 className="text-base text-gray-900" style={{ fontWeight: 600 }}>
                        Сырсөздү өзгөртүү / Изменить пароль
                      </h3>
                    </div>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1 font-medium">Учурдагы сырсөз / Текущий пароль</label>
                        <div className="relative">
                          <input
                            type={showOldPw ? "text" : "password"}
                            className={`${inputClass} pr-10`}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                          />
                          <button type="button" onClick={() => setShowOldPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {showOldPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1 font-medium">Жаңы сырсөз / Новый пароль</label>
                        <div className="relative">
                          <input
                            type={showNewPw ? "text" : "password"}
                            className={`${inputClass} pr-10`}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                          />
                          <button type="button" onClick={() => setShowNewPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1 font-medium">Ырастоо / Подтвердите пароль</label>
                        <input
                          type="password"
                          className={`${inputClass} ${confirmPassword && newPassword !== confirmPassword ? "border-red-300 focus:border-red-400" : ""}`}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                          <p className="text-xs text-red-500 mt-1">Сырсөздөр дал келбейт / Пароли не совпадают</p>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={savingPassword || loading}
                        className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60"
                      >
                        {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        {savingPassword ? "Өзгөртүлүүдө..." : "Сырсөздү өзгөртүү / Изменить"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="max-w-lg space-y-6">
                <div>
                  <h2 className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>
                    Настройки уведомлений
                  </h2>
                  <p className="text-sm text-gray-500">
                    Управляйте тем, какие уведомления вы получаете
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {[
                    { key: "new_application", label: "Жаңы арыз / Новая заявка", desc: "При поступлении нового обращения" },
                    { key: "status_changed", label: "Статус өзгөрдү / Изменение статуса", desc: "Когда заявка изменила статус" },
                    { key: "urgent_application", label: "Шашылыш арыз / Срочное обращение", desc: "Уведомления о срочных заявках" },
                    { key: "system_update", label: "Тутум жаңыртуу / Обновления системы", desc: "Системные уведомления" },
                  ].map((n, i, arr) => (
                    <div
                      key={n.key}
                      className={`flex items-center justify-between p-4 ${i < arr.length - 1 ? "border-b border-gray-50" : ""
                        }`}
                    >
                      <div>
                        <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>
                          {n.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
                      </div>
                      <Switch
                        checked={notifPrefs[n.key as keyof typeof notifPrefs] ?? true}
                        onCheckedChange={(v) => handleNotifToggle(n.key, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeSection === "security" || activeSection === "data" || activeSection === "system") && (
              <div className="max-w-lg">
                <div>
                  <h2 className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>
                    {activeSection === "system" ? "Настройки системы" : SECTIONS.find((s) => s.id === activeSection)?.label}
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Раздел находится в разработке
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-12 text-center">
                  <p className="text-gray-400 text-sm">Скоро появится</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
