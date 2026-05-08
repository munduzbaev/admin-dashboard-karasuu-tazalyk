import { useState, useEffect, useCallback } from "react";
import { Header } from "../components/Header";
import { Truck, Activity, User, Gauge, Plus, X, Save, Loader2, Phone, Edit2, ChevronRight } from "lucide-react";
import { api } from "../api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: "Бош / Свободен", color: "bg-green-50 text-green-600 border-green-200" },
  working: { label: "Иштейт / Работает", color: "bg-blue-50 text-[#3B82F6] border-blue-200" },
  repair: { label: "Оңдоодо / В ремонте", color: "bg-red-50 text-red-600 border-red-200" },
  off: { label: "Өчүк / Выключен", color: "bg-gray-50 text-gray-500 border-gray-200" },
};

const EMPTY_FORM = {
  name: "", plate: "", type: "мусоровоз", status: "available",
  driver_name: "", driver_phone: "", fuel_level: 50,
};

function FuelBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct > 30 ? "bg-[#3B82F6]" : pct > 15 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Transport() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [panelSaving, setPanelSaving] = useState(false);
  const [editFields, setEditFields] = useState<any>({});

  const fetchTransport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/transport");
      const body = res.data;
      if (body.success) {
        setVehicles(Array.isArray(body.data) ? body.data : []);
      } else {
        setVehicles([]);
      }
    } catch (err) {
      console.error("Fetch transport error:", err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransport(); }, [fetchTransport]);

  const openDetail = async (id: string | number) => {
    setDetailLoading(true);
    setSelectedVehicle({ id });
    try {
      const res = await api.get(`/transport/${id}`);
      const body = res.data;
      if (body.success && body.data) {
        const vData = body.data;
        setSelectedVehicle(vData);
        setEditFields({
          status: vData.status || "available",
          current_task: vData.current_task || "",
          fuel_level: vData.fuel_level ?? 50,
        });
      }
    } catch {
      toast.error("Ошибка загрузки данных транспорта");
    } finally {
      setDetailLoading(false);
    }
  };

  const saveDetail = async () => {
    if (!selectedVehicle) return;
    setPanelSaving(true);
    try {
      const res = await api.patch(`/transport/${selectedVehicle.id}`, editFields);
      if (res.data.success) {
        toast.success("Сакталды / Сохранено");
        setSelectedVehicle((v: any) => ({ ...v, ...editFields }));
        await fetchTransport();
      } else {
        toast.error("Ошибка: " + (res.data.error || "Не удалось сохранить"));
      }
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setPanelSaving(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Укажите наименование"); return; }
    if (!form.plate.trim()) { toast.error("Укажите номер"); return; }
    setSaving(true);
    try {
      const res = await api.post("/transport", {
        name: form.name,
        plate: form.plate,
        type: form.type,
        status: form.status,
        driver_name: form.driver_name,
        driver_phone: form.driver_phone,
        fuel_level: Number(form.fuel_level),
      });
      if (res.data.success) {
        toast.success("Транспорт кошулду / Добавлено");
        setShowAddModal(false);
        setForm(EMPTY_FORM);
        await fetchTransport();
      } else {
        toast.error("Ошибка: " + (res.data.error || "Не удалось добавить"));
      }
    } catch {
      toast.error("Ошибка добавления");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Транспорт" showSearch={false} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main list */}
        <div className={`flex-1 overflow-y-auto p-6 ${selectedVehicle ? "hidden xl:block xl:w-[60%] xl:flex-none" : ""}`}>
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-500">
              Жалпы / Всего: <span className="text-gray-900 font-semibold">{vehicles.length}</span>
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Plus className="w-4 h-4" />
              Кошуу / Добавить
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                  <div className="h-12 w-12 bg-gray-100 rounded-lg mb-4" />
                  <div className="h-5 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm">Маалымат жок / Нет данных</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v: any) => {
                const sc = STATUS_CONFIG[v.status] || STATUS_CONFIG.off;
                return (
                  <div
                    key={v.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                  >
                    <div className="p-5 border-b border-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                            <Truck className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="text-gray-900 text-base" style={{ fontWeight: 600 }}>{v.plate}</h3>
                            <p className="text-sm text-gray-500">{v.name}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs border ${sc.color}`} style={{ fontWeight: 500 }}>
                          {sc.label}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {v.driver_name && (
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{v.driver_name}</span>
                            {v.driver_phone && (
                              <a href={`tel:${v.driver_phone}`} className="ml-auto text-[#3B82F6] hover:underline text-xs" onClick={(e) => e.stopPropagation()}>
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        )}
                        {v.mileage && (
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Gauge className="w-4 h-4 text-gray-400" />
                            <span>{v.mileage} км</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Activity className="w-4 h-4 text-gray-400 shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Жанар-май / Топливо</span>
                              <span>{v.fuel_level ?? 0}%</span>
                            </div>
                            <FuelBar value={v.fuel_level ?? 0} />
                          </div>
                        </div>
                        {v.current_task && (
                          <p className="text-xs text-gray-400 truncate">📍 {v.current_task}</p>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50/50 mt-auto">
                      <button
                        onClick={() => openDetail(String(v.id))}
                        className="w-full py-2 text-sm text-[#3B82F6] hover:text-[#2563EB] transition-colors flex items-center justify-center gap-1"
                        style={{ fontWeight: 500 }}
                      >
                        Толугураак / Подробнее <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Side Panel */}
        <AnimatePresence>
          {selectedVehicle && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full xl:w-[400px] border-l border-gray-100 bg-white flex flex-col overflow-hidden"
            >
              {/* Panel header */}
              <div className="h-14 flex items-center gap-3 px-5 border-b border-gray-100 shrink-0">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedVehicle.plate || "Загрузка..."}
                  </p>
                  <p className="text-xs text-gray-400">{selectedVehicle.name}</p>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {detailLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Status */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
                      Статус
                    </label>
                    <Select value={editFields.status || "available"} onValueChange={(v) => setEditFields((p: any) => ({ ...p, status: v }))}>
                      <SelectTrigger className="h-9 text-sm bg-white border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Бош / Свободен</SelectItem>
                        <SelectItem value="working">Иштейт / Работает</SelectItem>
                        <SelectItem value="repair">Оңдоодо / В ремонте</SelectItem>
                        <SelectItem value="off">Өчүк / Выключен</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Driver */}
                  {(selectedVehicle.driver_name || selectedVehicle.driver_phone) && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Айдоочу / Водитель</p>
                      {selectedVehicle.driver_name && (
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                          <User className="w-4 h-4 text-gray-400" />
                          {selectedVehicle.driver_name}
                        </div>
                      )}
                      {selectedVehicle.driver_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a href={`tel:${selectedVehicle.driver_phone}`} className="text-[#3B82F6] hover:underline">
                            {selectedVehicle.driver_phone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fuel */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
                      Жанар-май / Топливо: {editFields.fuel_level ?? selectedVehicle.fuel_level ?? 0}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={editFields.fuel_level ?? selectedVehicle.fuel_level ?? 0}
                      onChange={(e) => setEditFields((p: any) => ({ ...p, fuel_level: Number(e.target.value) }))}
                      className="w-full"
                    />
                    <FuelBar value={editFields.fuel_level ?? selectedVehicle.fuel_level ?? 0} />
                  </div>

                  {/* Current task */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
                      Учурдагы тапшырма / Текущая задача
                    </label>
                    <input
                      type="text"
                      value={editFields.current_task ?? ""}
                      onChange={(e) => setEditFields((p: any) => ({ ...p, current_task: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                      placeholder="Иш тапшырмасы..."
                    />
                  </div>

                  {/* Stats */}
                  {selectedVehicle.mileage && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 font-medium mb-2">Жүгүрүүчүлүгү / Пробег</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedVehicle.mileage} <span className="text-sm font-normal text-gray-400">км</span></p>
                    </div>
                  )}

                  {/* History */}
                  {Array.isArray(selectedVehicle.history) && selectedVehicle.history.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Тарых / История</p>
                      <div className="space-y-2">
                        {selectedVehicle.history.slice(0, 10).map((h: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-gray-50 last:border-0">
                            <span className="text-gray-400 text-xs shrink-0">
                              {h.date ? new Date(h.date).toLocaleDateString("ru-RU") : "—"}
                            </span>
                            <span className="text-gray-700 flex-1">{h.action || h.description || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={saveDetail}
                    disabled={panelSaving}
                    className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {panelSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {panelSaving ? "Сакталууда..." : "Сактоо / Сохранить"}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-gray-900 text-base font-semibold">Жаңы транспорт / Добавить транспорт</h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {[
                { label: "Наименование *", key: "name", placeholder: "КАМАЗ Мусоровоз" },
                { label: "Номер *", key: "plate", placeholder: "01KG 123 AB" },
                { label: "Айдоочу / Водитель", key: "driver_name", placeholder: "Азамат К." },
                { label: "Тел. водителя", key: "driver_phone", placeholder: "+996 555 xxxxxx" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm text-gray-700 mb-1 font-medium">{f.label}</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    required={f.key === "name" || f.key === "plate"}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm text-gray-700 mb-1 font-medium">Статус</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="available">Бош / Свободен</option>
                  <option value="working">Иштейт / Работает</option>
                  <option value="repair">Оңдоодо / В ремонте</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1 font-medium">
                  Жанар-май / Топливо: {form.fuel_level}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.fuel_level}
                  onChange={(e) => setForm((p) => ({ ...p, fuel_level: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
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
