import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Calendar, MapPin, Truck, Phone, Plus, Edit2, Trash2, Loader2, X, Save } from "lucide-react";
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

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const EMPTY_FORM = { object: "", address: "", phone: "", transport: "", nextDate: "" };

export default function Schedule() {
  const [activeTab, setActiveTab] = useState<"table" | "tomorrow">("tomorrow");
  const [schedules, setSchedules] = useState<any[]>([]);
  const [tomorrow, setTomorrow] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allRes, tomRes] = await Promise.all([
        api.get("/schedules"),
        api.get("/schedules/tomorrow"),
      ]);
      const allBody = allRes.data;
      const tomBody = tomRes.data;

      if (allBody.success) {
        setSchedules(Array.isArray(allBody.data) ? allBody.data : []);
      } else {
        setSchedules([]);
      }

      if (tomBody.success) {
        setTomorrow(Array.isArray(tomBody.data) ? tomBody.data : []);
      } else {
        setTomorrow([]);
      }
    } catch (e) {
      console.error("Fetch schedule error:", e);
      setSchedules([]);
      setTomorrow([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditingId(String(s.id));
    setForm({
      object: s.object || "",
      address: s.address || "",
      phone: s.phone || "",
      transport: s.transport || "",
      nextDate: s.nextDate || s.next_date || "",
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.object.trim()) { toast.error("Укажите объект"); return; }
    setSaving(true);
    try {
      const payload = {
        object: form.object,
        address: form.address,
        phone: form.phone,
        transport: form.transport,
        next_date: form.nextDate,
      };
      const res = editingId
        ? await api.patch(`/schedules/${editingId}`, payload)
        : await api.post("/schedules", payload);
      const resBody = res.data;
      if (resBody.success) {
        toast.success(editingId ? "График жаңыртылды / Обновлено" : "График кошулду / Добавлено");
        setShowModal(false);
        await fetchData();
      } else {
        toast.error("Ошибка: " + (resBody.error || "Не удалось сохранить"));
      }
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/schedules/${id}`);
      if (res.data.success) {
        toast.success("Жок кылынды / Удалено");
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

  const displayList = activeTab === "tomorrow" ? tomorrow : schedules;

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="График вывоза" showSearch={false} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setActiveTab("table")}
              className={`px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === "table" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"}`}
            >
              Таблица
            </button>
            <button
              onClick={() => setActiveTab("tomorrow")}
              className={`px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === "tomorrow" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"}`}
            >
              Эртең / Завтра
            </button>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            style={{ fontWeight: 500 }}
          >
            <Plus className="w-4 h-4" />
            Кошуу / Добавить
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Жүктөлүүдө / Загрузка...
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">Маалымат жок / Нет данных</p>
          </div>
        ) : activeTab === "tomorrow" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayList.map((s: any) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-gray-900" style={{ fontWeight: 600 }}>{s.object}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#3B82F6] hover:bg-blue-50 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Чындап эле жок кылуу керекпи?</AlertDialogTitle>
                          <AlertDialogDescription>Вы уверены, что хотите удалить эту запись?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Жок / Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(String(s.id))} className="bg-red-600 hover:bg-red-700">
                            Ооба / Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {s.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span>{s.address}</span>
                    </div>
                  )}
                  {s.transport && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Truck className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{s.transport}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-2 text-sm text-[#3B82F6]">
                      <Phone className="w-4 h-4 shrink-0" />
                      <a href={`tel:${s.phone}`} className="hover:underline">{s.phone}</a>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleComplete(String(s.id))}
                  className="w-full py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm transition-colors border border-green-100"
                  style={{ fontWeight: 500 }}
                >
                  ✅ Аткарылды / Готово
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Объект</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Дарек / Адрес</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Транспорт</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Кийинки / Следующий</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {displayList.map((s: any) => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.object}</td>
                    <td className="px-4 py-3 text-gray-600">{s.address || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.transport || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(s.nextDate || s.next_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#3B82F6] hover:bg-blue-50 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Чындап эле жок кылуу керекпи?</AlertDialogTitle>
                              <AlertDialogDescription>Вы уверены, что хотите удалить эту запись?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Жок / Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(String(s.id))} className="bg-red-600 hover:bg-red-700">
                                Ооба / Удалить
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
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-gray-900 text-base" style={{ fontWeight: 600 }}>
                {editingId ? "Жаңыртуу / Редактировать" : "Жаңы жазуу / Новая запись"}
              </h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {[
                { label: "Объект *", key: "object", placeholder: "Мектеп №1 / Школа №1" },
                { label: "Дарек / Адрес", key: "address", placeholder: "Ленин көч. 45" },
                { label: "Телефон", key: "phone", placeholder: "+996 555 xxxxxx" },
                { label: "Транспорт", key: "transport", placeholder: "Мусоровоз 01KG123AB" },
                { label: "Кийинки вывоз / Следующий вывоз", key: "nextDate", type: "date", placeholder: "" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm text-gray-700 mb-1 font-medium">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    className={inputClass}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    required={f.key === "object"}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  Жокко чыгаруу
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Сакталууда..." : "Сактоо / Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
