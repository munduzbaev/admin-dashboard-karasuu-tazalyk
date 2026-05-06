import { useState, useEffect, useCallback } from "react";
import { Header } from "../components/Header";
import { Plus, Mail, Loader2, Check, X, ShieldAlert, Trash2, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "../components/ui/utils";
import { api } from "../api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  operator: "Оператор",
  senior_operator: "Ст. оператор",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Күтүүдө / Ожидание",
  approved: "Бекитилди / Активен",
  rejected: "Четке кагылды / Отклонён",
};

const EMPTY_FORM = { name: "", email: "", password: "", role: "operator" };

export default function Operators() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Admin check
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  })();
  const isAdmin = currentUser.role === "admin";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      if (res.success) setUsers(Array.isArray(res.data) ? res.data : []);
      else setUsers([]);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header title="Операторлор / Операторы" showSearch={false} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
          <ShieldAlert className="w-16 h-16 text-gray-200" />
          <h2 className="text-xl font-semibold text-gray-700">Жетишүү тыюу салынган / Доступ запрещён</h2>
          <p className="text-gray-400 text-sm">Бул барак үчүн администратор болушуңуз керек</p>
        </div>
      </div>
    );
  }

  const filtered = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const pending = filtered.filter((u) => u.status === "pending");
  const others = filtered.filter((u) => u.status !== "pending");

  const handleAction = async (id: string, action: string, body?: any) => {
    setActionLoading(id + action);
    try {
      let res: any;
      if (action === "approve") res = await api.patch(`/users/${id}/approve`, {});
      else if (action === "reject") res = await api.patch(`/users/${id}/reject`, {});
      else if (action === "role") res = await api.patch(`/users/${id}/role`, body);
      else if (action === "delete") res = await api.delete(`/users/${id}`);

      if (res?.success) {
        toast.success("Аткарылды / Выполнено");
        await fetchUsers();
      } else {
        toast.error("Ошибка: " + (res?.error || "Не удалось выполнить"));
      }
    } catch {
      toast.error("Ошибка действия");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Бардык талааларды толтуруңуз / Заполните все поля");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      if (res.success) {
        const newId = res.user?.id || res.data?.id;
        if (newId) await api.patch(`/users/${newId}/approve`, {});
        toast.success("Оператор кошулду / Оператор добавлен");
        setShowModal(false);
        setForm(EMPTY_FORM);
        await fetchUsers();
      } else {
        toast.error("Ошибка: " + (res.error || "Не удалось зарегистрировать"));
      }
    } catch {
      toast.error("Ошибка регистрации");
    } finally {
      setSaving(false);
    }
  };

  function UserCard({ u }: { u: any }) {
    const [showRoleMenu, setShowRoleMenu] = useState(false);
    const sc = STATUS_BADGE[u.status] || STATUS_BADGE.approved;
    const isLoading = (act: string) => actionLoading === u.id + act;

    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-full bg-[#3B82F6] flex items-center justify-center text-white" style={{ fontWeight: 700, fontSize: 16 }}>
            {(u.name || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs px-2 py-0.5 rounded-full border", sc)} style={{ fontWeight: 500 }}>
              {STATUS_LABEL[u.status] || u.status}
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Чындап эле жок кылуу керекпи?</AlertDialogTitle>
                  <AlertDialogDescription>Бул аракет кайтарылгыс / Это действие необратимо.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Жок / Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleAction(u.id, "delete")} className="bg-red-600 hover:bg-red-700">
                    Ооба / Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <h3 className="text-gray-900 mb-0.5" style={{ fontWeight: 600 }}>{u.name}</h3>

        {/* Role selector */}
        <div className="relative mb-3">
          <button
            onClick={() => setShowRoleMenu((v) => !v)}
            className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            {ROLE_LABELS[u.role] || u.role}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showRoleMenu && (
            <>
              <div className="fixed inset-0" onClick={() => setShowRoleMenu(false)} />
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px] z-10">
                {["operator", "senior_operator", "admin"].map((r) => (
                  <button
                    key={r}
                    onClick={() => { handleAction(u.id, "role", { role: r }); setShowRoleMenu(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                      u.role === r ? "text-[#3B82F6] font-medium" : "text-gray-700"
                    )}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
          <Mail className="w-3.5 h-3.5" />
          <span className="truncate">{u.email}</span>
        </div>

        {u.status !== "approved" && (
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(u.id, "approve")}
              disabled={!!actionLoading}
              className="flex-1 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium border border-green-200 transition-colors flex items-center justify-center gap-1"
            >
              {isLoading("approve") ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Бекит
            </button>
            <button
              onClick={() => handleAction(u.id, "reject")}
              disabled={!!actionLoading}
              className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium border border-red-200 transition-colors flex items-center justify-center gap-1"
            >
              {isLoading("reject") ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              Четке как
            </button>
          </div>
        )}

        {u.last_login && (
          <p className="text-xs text-gray-300 mt-2">
            Соңку кирүү: {new Date(u.last_login).toLocaleDateString("ru-RU")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Операторлор / Операторы"
        searchPlaceholder="Поиск по имени или email..."
        searchValue={search}
        onSearch={setSearch}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Жалпы / Всего: <span className="text-gray-900 font-semibold">{users.length}</span>
          </p>
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Оператор кошуу / Добавить
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-100 mb-4" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Pending section */}
            {pending.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-sm font-semibold text-amber-700">
                    Бекитүүнү күтүп жатат / Ожидают подтверждения ({pending.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                  {pending.map((u) => <UserCard key={u.id} u={u} />)}
                </div>
              </div>
            )}

            {/* All users */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {others.map((u) => <UserCard key={u.id} u={u} />)}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm">Маалымат жок / Нет данных</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Operator Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-gray-900 text-base font-semibold">Оператор кошуу / Добавить оператора</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {[
                { label: "Аты-жөнү / ФИО *", key: "name", type: "text", placeholder: "Айгерим Матова" },
                { label: "Email *", key: "email", type: "email", placeholder: "operator@tazalyk.kg" },
                { label: "Сырсөз / Пароль *", key: "password", type: "password", placeholder: "••••••••" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm text-gray-700 mb-1 font-medium">{f.label}</label>
                  <input
                    type={f.type}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    required
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm text-gray-700 mb-1 font-medium">Роль</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="operator">Оператор</option>
                  <option value="senior_operator">Ст. оператор</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                  Жокко чыгаруу
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saving ? "Кошулууда..." : "Кошуу / Добавить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
