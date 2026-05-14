import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import {
  Calendar,
  MapPin,
  Truck,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Save,
  Repeat,
  Tag,
  CheckCircle2,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FormFeedback, type FeedbackState } from "../components/FormFeedback";
import { api } from "../api";
import { toast } from "sonner";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { formatPhone } from "../utils/phone";
import { getCompatibilityWarning } from "../utils/transportCompat";
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

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type FormState = {
  institution_id: string;
  vehicle_id: string;
  waste_type_id: string;
  interval_days: string;
  next_run_at: string;
};

const EMPTY_FORM: FormState = {
  institution_id: "",
  vehicle_id: "",
  waste_type_id: "",
  interval_days: "7",
  next_run_at: "",
};

export default function Schedule() {
  const [activeTab, setActiveTab] = useState<"table" | "tomorrow">("table");
  const [schedules, setSchedules] = useState<any[]>([]);
  const [tomorrow, setTomorrow] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);
  const [wasteTypes, setWasteTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const fetchData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const [allRes, tomRes, instRes, transRes, wasteRes] = await Promise.all([
        api.get("/schedules"),
        api.get("/schedules/tomorrow"),
        api.get("/institutions").catch(() => ({ data: { success: false } })),
        api.get("/transport").catch(() => ({ data: { success: false } })),
        api.get("/waste_types").catch(() => ({ data: { success: false } })),
      ]);

      setSchedules(allRes.data?.success && Array.isArray(allRes.data.data) ? allRes.data.data : []);
      setTomorrow(tomRes.data?.success && Array.isArray(tomRes.data.data) ? tomRes.data.data : []);
      setInstitutions(instRes.data?.success && Array.isArray(instRes.data.data) ? instRes.data.data : []);
      setTransports(transRes.data?.success && Array.isArray(transRes.data.data) ? transRes.data.data : []);
      setWasteTypes(wasteRes.data?.success && Array.isArray(wasteRes.data.data) ? wasteRes.data.data : []);
    } catch (e) {
      console.error("Schedule fetch error:", e);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  useAutoRefresh(() => fetchData(false));

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFeedback({ kind: "idle" });
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditingId(String(s.id));
    setForm({
      institution_id: s.institution_id || "",
      vehicle_id: s.vehicle_id || "",
      waste_type_id: s.waste_type_id || "",
      interval_days: s.interval_days != null ? String(s.interval_days) : "7",
      next_run_at: s.next_run_at ? String(s.next_run_at).slice(0, 10) : "",
    });
    setFieldErrors({});
    setFeedback({ kind: "idle" });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, boolean> = {};
    if (!form.institution_id) errs.institution_id = true;
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setFeedback({ kind: "error", message: "Выберите учреждение" });
      return;
    }
    setSaving(true);
    setFeedback({ kind: "idle" });
    try {
      const payload: any = {
        institution_id: form.institution_id,
      };
      if (form.vehicle_id) payload.vehicle_id = form.vehicle_id;
      if (form.waste_type_id) payload.waste_type_id = form.waste_type_id;
      const ival = parseInt(form.interval_days, 10);
      if (!isNaN(ival) && ival > 0) payload.interval_days = ival;
      if (form.next_run_at) payload.next_run_at = form.next_run_at;

      const res = editingId
        ? await api.patch(`/schedules/${editingId}`, payload)
        : await api.post("/schedules", payload);

      if (res.data?.success) {
        setFeedback({ kind: "success", message: editingId ? "Сохранено" : "График добавлен" });
        await fetchData();
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
      const res = await api.delete(`/schedules/${id}`);
      if (res.data?.success) {
        toast.success("Удалено");
        await fetchData();
      } else {
        toast.error("Ошибка удаления");
      }
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await api.patch(`/schedules/${id}/complete`, {});
      if (res.data?.success) {
        toast.success("Аткарылды / Выполнено");
        await fetchData();
      } else {
        toast.error("Ошибка: " + (res.data?.error || "Не удалось отметить"));
      }
    } catch {
      toast.error("Ошибка соединения");
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]";

  const inst = (s: any) => s.institution?.name || "—";
  const addr = (s: any) => s.institution?.address || "";
  const trans = (s: any) =>
    s.transport ? `${s.transport.name}${s.transport.plate ? ` · ${s.transport.plate}` : ""}` : "—";
  const waste = (s: any) => s.waste_type?.name || "—";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="График вывоза" showSearch={false} />

      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("table")}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === "table" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
              style={{ fontWeight: 500 }}
            >
              Таблица
            </button>
            <button
              onClick={() => setActiveTab("tomorrow")}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === "tomorrow" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
              style={{ fontWeight: 500 }}
            >
              Эртең / Завтра
            </button>
          </div>

          <button
            onClick={openAdd}
            className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
            style={{ fontWeight: 500 }}
          >
            <Plus className="w-4 h-4" />
            Кошуу / Добавить
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : activeTab === "table" ? (
          schedules.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-sm">Маалымат жок / Нет данных</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Учреждение</th>
                    <th className="px-4 py-3 font-medium">Телефон</th>
                    <th className="px-4 py-3 font-medium">Транспорт</th>
                    <th className="px-4 py-3 font-medium">Тип отходов</th>
                    <th className="px-4 py-3 font-medium">Интервал</th>
                    <th className="px-4 py-3 font-medium">Следующий</th>
                    <th className="px-4 py-3 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{inst(s)}</div>
                        {addr(s) && <div className="text-xs text-gray-400 mt-0.5">{addr(s)}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {s.institution?.contact_phone ? (
                          <a href={`tel:${s.institution.contact_phone}`} className="text-[#3B82F6] hover:underline text-xs whitespace-nowrap">
                            {formatPhone(s.institution.contact_phone)}
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{trans(s)}</td>
                      <td className="px-4 py-3 text-gray-700">{waste(s)}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {s.interval_days ? `Раз в ${s.interval_days} дн.` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(s.next_run_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            className="p-1.5 text-gray-400 hover:text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить график?</AlertDialogTitle>
                                <AlertDialogDescription>Это действие необратимо.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(String(s.id))}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : tomorrow.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">Маалымат жок / Нет данных</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tomorrow.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-gray-900">{inst(s)}</div>
                  <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {formatDate(s.next_run_at)}
                  </span>
                </div>
                {addr(s) && (
                  <div className="flex items-start gap-1.5 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{addr(s)}</span>
                  </div>
                )}
                {s.institution?.contact_phone && (
                  <div className="flex items-start gap-1.5 text-xs text-gray-500">
                    <Phone className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <a href={`tel:${s.institution.contact_phone}`} className="text-[#3B82F6] hover:underline">
                      {formatPhone(s.institution.contact_phone)}
                    </a>
                  </div>
                )}
                <div className="flex items-start gap-1.5 text-xs text-gray-500">
                  <Truck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{trans(s)}</span>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-gray-500">
                  <Tag className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{waste(s)}</span>
                </div>
                <button
                  onClick={() => handleComplete(String(s.id))}
                  className="w-full mt-2 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm transition-colors border border-green-100"
                  style={{ fontWeight: 500 }}
                >
                  ✅ Аткарылды / Готово
                </button>
              </div>
            ))}
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
                  {editingId ? "Изменить график" : "Жаңы жазуу / Новая запись"}
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
                  Учреждение <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 ${
                    fieldErrors.institution_id
                      ? "border-red-400 focus:border-red-400"
                      : "border-gray-200 focus:border-[#3B82F6]"
                  }`}
                  value={form.institution_id}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, institution_id: e.target.value }));
                    if (fieldErrors.institution_id) setFieldErrors((p) => ({ ...p, institution_id: false }));
                  }}
                  required
                >
                  <option value="">— Выберите —</option>
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                      {i.address ? ` · ${i.address}` : ""}
                    </option>
                  ))}
                </select>
                {institutions.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Сначала добавьте учреждения в Настройках → Данные → Учреждения
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1 font-medium">Тип отходов</label>
                <select
                  className={inputClass}
                  value={form.waste_type_id}
                  onChange={(e) => setForm((p) => ({ ...p, waste_type_id: e.target.value }))}
                >
                  <option value="">— Не указан —</option>
                  {wasteTypes.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1 font-medium">Транспорт</label>
                <select
                  className={inputClass}
                  value={form.vehicle_id}
                  onChange={(e) => setForm((p) => ({ ...p, vehicle_id: e.target.value }))}
                >
                  <option value="">— Назначить позже —</option>
                  {transports.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.plate ? ` · ${t.plate}` : ""}
                    </option>
                  ))}
                </select>
                {(() => {
                  const t = transports.find((x) => x.id === form.vehicle_id);
                  const w = wasteTypes.find((x) => x.id === form.waste_type_id);
                  const warn = getCompatibilityWarning(t || null, w || null);
                  if (!warn) return null;
                  return (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{warn}</span>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1 font-medium flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" />
                  Интервал (дней)
                </label>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={form.interval_days}
                  onChange={(e) => setForm((p) => ({ ...p, interval_days: e.target.value }))}
                  placeholder="7"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Раз в столько дней повторять вывоз. После «Готово» дата сдвигается автоматически.
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Следующий вывоз
                </label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.next_run_at}
                  onChange={(e) => setForm((p) => ({ ...p, next_run_at: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                >
                  Жокко чыгаруу
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.institution_id || feedback.kind === "success"}
                  className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-70 transition-all ${
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
                  {feedback.kind === "success" ? "Готово" : "Сактоо / Сохранить"}
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

function humanizeError(raw: any): string {
  const text = typeof raw === "string" ? raw : JSON.stringify(raw || "");
  if (text.includes("PGRST")) return "Ошибка базы данных. Обновите страницу.";
  if (text.includes("Network") || text.includes("fetch")) return "Нет соединения с сервером";
  if (text.includes("foreign key") || text.includes("violates")) return "Некорректные данные в полях";
  return (text || "Что-то пошло не так").slice(0, 200);
}
