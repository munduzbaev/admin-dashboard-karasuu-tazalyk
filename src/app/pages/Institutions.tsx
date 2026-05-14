import { useState, useEffect, useMemo } from "react";
import { Header } from "../components/Header";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Save,
  MapPin,
  Phone,
  User as UserIcon,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { api } from "../api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
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
import { BackToSettings } from "../components/BackToSettings";
import { FormFeedback, type FeedbackState } from "../components/FormFeedback";
import { can } from "../permissions";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

type Inst = {
  id: string;
  name: string;
  address?: string | null;
  contact_phone?: string | null;
  contact_person?: string | null;
  is_active?: boolean;
  created_at?: string;
};

type FormState = {
  name: string;
  address: string;
  contact_person: string;
  contact_phone: string;
};

const EMPTY: FormState = { name: "", address: "", contact_person: "", contact_phone: "" };

export default function Institutions() {
  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const canView = can.viewInstitutions(currentUser);
  const canEdit = can.editInstitutions(currentUser);

  const [items, setItems] = useState<Inst[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    try {
      const url = showInactive ? "/institutions?include_inactive=true" : "/institutions";
      const res = await api.get(url);
      setItems(res.data?.success && Array.isArray(res.data.data) ? res.data.data : []);
    } catch (e) {
      console.error("Institutions fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [showInactive]);

  useAutoRefresh(fetchData);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFieldErrors({});
    setFeedback({ kind: "idle" });
    setShowModal(true);
  };

  const openEdit = (i: Inst) => {
    setEditingId(i.id);
    setForm({
      name: i.name || "",
      address: i.address || "",
      contact_person: i.contact_person || "",
      contact_phone: i.contact_phone || "",
    });
    setFieldErrors({});
    setFeedback({ kind: "idle" });
    setShowModal(true);
  };

  const validate = (): boolean => {
    const errs: Record<string, boolean> = {};
    if (!form.name.trim()) errs.name = true;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setFeedback({ kind: "error", message: "Заполните название учреждения" });
      return;
    }
    setSaving(true);
    setFeedback({ kind: "idle" });
    try {
      const payload: any = { name: form.name.trim() };
      if (form.address.trim()) payload.address = form.address.trim();
      if (form.contact_person.trim()) payload.contact_person = form.contact_person.trim();
      if (form.contact_phone.trim()) payload.contact_phone = form.contact_phone.trim();

      const res = editingId
        ? await api.patch(`/institutions/${editingId}`, payload)
        : await api.post("/institutions", payload);

      if (res.data?.success) {
        setFeedback({ kind: "success", message: editingId ? "Сохранено" : "Учреждение добавлено" });
        await fetchData();
        // Close after a short pause to let the user see the feedback
        setTimeout(() => {
          setShowModal(false);
          setFeedback({ kind: "idle" });
        }, 1100);
      } else {
        setFeedback({ kind: "error", message: humanizeError(res.data?.error) });
      }
    } catch (err: any) {
      setFeedback({ kind: "error", message: humanizeError(err?.response?.data?.detail || err?.message) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/institutions/${id}`);
      if (res.data?.success) {
        toast.success("Учреждение скрыто");
        await fetchData();
      } else {
        toast.error("Ошибка удаления");
      }
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await api.post(`/institutions/${id}/restore`, {});
      if (res.data?.success) {
        toast.success("Восстановлено");
        await fetchData();
      } else {
        toast.error("Ошибка");
      }
    } catch {
      toast.error("Ошибка соединения");
    }
  };

  if (!canView) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header title="Учреждения" showSearch={false} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
          <ShieldAlert className="w-16 h-16 text-gray-200" />
          <h2 className="text-xl font-semibold text-gray-700">Доступ запрещён</h2>
          <p className="text-gray-400 text-sm">Этот раздел доступен только администраторам</p>
        </div>
      </div>
    );
  }

  const inputClass = (key: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 transition-colors ${
      fieldErrors[key]
        ? "border-red-400 focus:border-red-400"
        : "border-gray-200 focus:border-[#3B82F6]"
    }`;

  const filtered = items.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (i.name || "").toLowerCase().includes(q) ||
      (i.address || "").toLowerCase().includes(q) ||
      (i.contact_person || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Учреждения"
        searchPlaceholder="Поиск по названию, адресу..."
        searchValue={search}
        onSearch={setSearch}
      />

      <div className="flex-1 overflow-auto p-6">
        <BackToSettings />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">
              Всего: <span className="text-gray-900 font-semibold">{items.length}</span>
            </p>
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Показать удалённые
            </label>
          </div>

          {canEdit && (
            <button
              onClick={openAdd}
              className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            {search ? "Ничего не найдено" : "Нет учреждений"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((i) => {
              const inactive = i.is_active === false;
              return (
                <div
                  key={i.id}
                  className={`bg-white rounded-xl border p-4 space-y-2 transition-all ${
                    inactive ? "border-gray-200 opacity-60" : "border-gray-100 hover:border-[#3B82F6]/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="p-1.5 bg-blue-50 rounded-lg shrink-0">
                        <Building2 className="w-4 h-4 text-[#3B82F6]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 truncate">{i.name}</div>
                        {inactive && (
                          <span className="inline-block text-[10px] uppercase tracking-wide text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded mt-0.5">
                            удалено
                          </span>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 shrink-0">
                        {!inactive && (
                          <>
                            <button
                              onClick={() => openEdit(i)}
                              className="p-1.5 text-gray-400 hover:text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors"
                              title="Редактировать"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Удалить «{i.name}»?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Учреждение будет скрыто из списка. Графики и заявки, связанные
                                    с ним, останутся на месте. Можно восстановить позже.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(i.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        {inactive && (
                          <button
                            onClick={() => handleRestore(i.id)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Восстановить"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {i.address && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                      <span>{i.address}</span>
                    </div>
                  )}
                  {i.contact_person && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-600">
                      <UserIcon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                      <span>{i.contact_person}</span>
                    </div>
                  )}
                  {i.contact_phone && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-600">
                      <Phone className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                      <a
                        href={`tel:${i.contact_phone}`}
                        className="text-[#3B82F6] hover:underline"
                      >
                        {i.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
            onClick={() => !saving && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="text-gray-900" style={{ fontWeight: 600 }}>
                  {editingId ? "Редактировать учреждение" : "Новое учреждение"}
                </h2>
                <button
                  onClick={() => !saving && setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={saving}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4">
                <FormFeedback state={feedback} />

                <div>
                  <label className="block text-sm text-gray-700 mb-1 font-medium">
                    Название <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={inputClass("name")}
                    value={form.name}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, name: e.target.value }));
                      if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: false }));
                    }}
                    placeholder="Школа №1"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1 font-medium">Адрес</label>
                  <input
                    type="text"
                    className={inputClass("address")}
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="ул. Ленина, 45"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1 font-medium">
                    Контактное лицо
                  </label>
                  <input
                    type="text"
                    className={inputClass("contact_person")}
                    value={form.contact_person}
                    onChange={(e) => setForm((p) => ({ ...p, contact_person: e.target.value }))}
                    placeholder="Иванов И.И."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1 font-medium">Телефон</label>
                  <input
                    type="tel"
                    className={inputClass("contact_phone")}
                    value={form.contact_phone}
                    onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))}
                    placeholder="+996 555 ..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={saving || feedback.kind === "success"}
                    className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all disabled:opacity-70 ${
                      feedback.kind === "success"
                        ? "bg-green-600 text-white"
                        : "bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : feedback.kind === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {feedback.kind === "success" ? "Готово" : "Сохранить"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Convert raw backend errors into friendly Russian text. */
function humanizeError(raw: any): string {
  const text = typeof raw === "string" ? raw : JSON.stringify(raw || "");
  if (text.includes("duplicate") || text.includes("unique")) return "Учреждение с таким названием уже есть";
  if (text.includes("PGRST")) return "Ошибка базы данных. Обновите страницу.";
  if (text.includes("Network") || text.includes("fetch")) return "Нет соединения с сервером";
  return text.slice(0, 200) || "Что-то пошло не так";
}
