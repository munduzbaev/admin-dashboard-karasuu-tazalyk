import { Header } from "../components/Header";
import { Download, Calendar as CalendarIcon, TrendingUp, Loader2, Truck } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useEffect, useState } from "react";
import { api } from "../api";
import { toast } from "sonner";

const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

function getDefaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function addDays(base: string, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <p className="text-gray-500 text-sm mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <span className="text-3xl text-gray-900" style={{ fontWeight: 700 }}>{value}</span>
        <TrendingUp className="w-4 h-4 text-green-400" />
      </div>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  мусоровоз: "bg-blue-100 text-blue-700",
  ассенизатор: "bg-purple-100 text-purple-700",
  трактор: "bg-orange-100 text-orange-700",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  available: { label: "Бош", cls: "bg-green-100 text-green-700" },
  working:   { label: "Иштейт", cls: "bg-blue-100 text-blue-700" },
  repair:    { label: "Ремонт", cls: "bg-red-100 text-red-700" },
};

export default function Reports() {
  const [dateFrom, setDateFrom] = useState(getDefaultRange().from);
  const [dateTo, setDateTo] = useState(getDefaultRange().to);
  const [summary, setSummary] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingTransport, setExportingTransport] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = `date_from=${dateFrom}&date_to=${dateTo}`;
        const [sumRes, appsRes] = await Promise.all([
          api.get(`/reports/summary?${params}`),
          api.get(`/reports/applications?${params}`),
        ]);

        const sumBody = sumRes.data;
        const appsBody = appsRes.data;

        if (sumBody.success) {
          setSummary(sumBody.data);
        } else {
          setSummary(null);
        }

        if (appsBody.success) {
          setApplications(Array.isArray(appsBody.data) ? appsBody.data : []);
        } else {
          const fallback = await api.get("/applications");
          const fbBody = fallback.data;
          if (fbBody.success) {
            setApplications(Array.isArray(fbBody.data) ? fbBody.data : []);
          }
        }
      } catch {
        try {
          const fallback = await api.get("/applications");
          const fbBody = fallback.data;
          if (fbBody.success) {
            setApplications(Array.isArray(fbBody.data) ? fbBody.data : []);
          }
        } catch { }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dateFrom, dateTo]);

  const handleExport = async () => {
    try {
      setExporting(true);
      let XLSX: any;
      try {
        XLSX = await import("xlsx");
      } catch {
        toast.error("Установите xlsx: npm install xlsx");
        return;
      }
      const rows = applications.map((a: any) => ({
        ID: a.id,
        Статус: a.status,
        Адрес: a.address || "",
        Телефон: a.phone || "",
        "Тип отходов": a.waste_type || "",
        Источник: a.source || "",
        Дата: a.created_at ? new Date(a.created_at).toLocaleDateString("ru-RU") : "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Заявки");
      XLSX.writeFile(wb, `tazalyk-report-${dateFrom}-${dateTo}.xlsx`);
      toast.success("Файл жүктөлдү / Файл сохранён");
    } catch {
      toast.error("Экспорт катасы / Ошибка экспорта");
    } finally {
      setExporting(false);
    }
  };

  const handleTransportExport = async () => {
    const transportUsage: any[] = summary?.transport_usage ?? [];
    if (!transportUsage.length) return;
    try {
      setExportingTransport(true);
      let XLSX: any;
      try {
        XLSX = await import("xlsx");
      } catch {
        toast.error("Установите xlsx: npm install xlsx");
        return;
      }
      const rows = transportUsage.map((t: any) => ({
        Транспорт: t.name || "—",
        "Гос номер": t.plate || "—",
        Тип: t.type || "—",
        "Всего рейсов": t.total_trips,
        Выполнено: t.completed_trips,
        Активных: t.active_trips,
        Статус: STATUS_META[t.status]?.label ?? t.status ?? "—",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Транспорт");
      XLSX.writeFile(wb, `tazalyk-transport-${dateFrom}-${dateTo}.xlsx`);
      toast.success("Файл жүктөлдү / Файл сохранён");
    } catch {
      toast.error("Экспорт катасы / Ошибка экспорта");
    } finally {
      setExportingTransport(false);
    }
  };

  // Chart data
  const daysMap: Record<string, number> = {};
  if (dateFrom && dateTo) {
    const fromD = new Date(dateFrom);
    const toD = new Date(dateTo);
    for (let d = new Date(fromD); d <= toD; d.setDate(d.getDate() + 1)) {
      daysMap[d.toISOString().slice(0, 10)] = 0;
    }
  }
  applications.forEach((a) => {
    if (a.created_at) {
      const dateStr = a.created_at.slice(0, 10);
      if (daysMap[dateStr] !== undefined) {
        daysMap[dateStr]++;
      }
    }
  });
  const historyData = Object.entries(daysMap).sort().map(([date, count]) => ({
    name: new Date(date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
    requests: count,
  }));

  const wasteMap: Record<string, number> = {};
  applications.forEach(a => {
    const wt = a.waste_type || "Не указано";
    wasteMap[wt] = (wasteMap[wt] || 0) + 1;
  });
  const wasteTypeData = Object.entries(wasteMap).map(([name, value]) => ({ name, value }));

  const SOURCE_LABELS: Record<string, string> = {
    whatsapp: "WhatsApp",
    phone: "Телефон",
    website: "Сайт",
    app: "Приложение",
    resident: "Житель / Жашоочу",
    institution: "Учреждение / Мекеме",
    in_person: "Лично / Жеке",
  };
  const USER_TYPE_LABELS: Record<string, string> = {
    resident: "Житель / Жашоочу",
    institution: "Учреждение / Мекеме",
  };

  const sourceData: any[] = Object.entries(summary?.by_source || {}).map(([name, value]) => ({
    name: SOURCE_LABELS[name] ?? name,
    value,
  }));
  const userTypeData: any[] = Object.entries(summary?.by_user_type || {}).map(([name, value]) => ({
    name: USER_TYPE_LABELS[name] ?? name,
    value,
  }));

  const total = applications.length;
  const completed = applications.filter((a) => a.status === "completed").length;
  const pending = applications.filter((a) => ["new", "in_progress"].includes(a.status)).length;

  const transportUsage: any[] = summary?.transport_usage ?? [];
  const totalTripsSum = transportUsage.reduce((s, t) => s + (t.total_trips || 0), 0);
  const completedTripsSum = transportUsage.reduce((s, t) => s + (t.completed_trips || 0), 0);
  const activeTripsSum = transportUsage.reduce((s, t) => s + (t.active_trips || 0), 0);

  // Top performers
  const mostTrips = transportUsage[0] ?? null;
  const mostCompleted = [...transportUsage].sort((a, b) => b.completed_trips - a.completed_trips)[0] ?? null;
  const workingCount = transportUsage.filter(t => t.status === "working").length;

  const QUICK_FILTERS = [
    { label: "7 күн", days: 7 },
    { label: "30 күн", days: 30 },
    { label: "3 ай", days: 90 },
    { label: "6 ай", days: 180 },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Отчёттор / Отчёты" showSearch={false} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm shadow-sm">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-sm text-gray-700 bg-transparent outline-none"
              />
            </div>
            <span className="text-gray-400">—</span>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm shadow-sm">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-sm text-gray-700 bg-transparent outline-none"
              />
            </div>
            <div className="flex gap-1">
              {QUICK_FILTERS.map(f => (
                <button
                  key={f.days}
                  onClick={() => { setDateTo(today()); setDateFrom(daysAgo(f.days)); }}
                  className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 shadow-sm transition-colors"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || loading || applications.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm font-medium disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Excel жүктөө / Скачать Excel
          </button>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Бардыгы / Всего заявок" value={total} />
            <StatCard label="Жабылды / Выполнено" value={completed} />
            <StatCard label="Күтүүдө / В ожидании" value={pending} />
          </div>
        )}

        {/* Area chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-900 mb-5" style={{ fontWeight: 600 }}>Динамика заявок</h3>
          {loading ? (
            <div className="h-[220px] bg-gray-50 rounded-lg animate-pulse" />
          ) : historyData.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Маалымат жок / Нет данных за период</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Area type="monotone" dataKey="requests" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorR)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "По типу отходов", data: wasteTypeData },
            { title: "По источнику", data: sourceData },
            { title: "По типу клиента", data: userTypeData },
          ].map((chart) => (
            <div key={chart.title} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-gray-900 text-sm mb-4" style={{ fontWeight: 600 }}>{chart.title}</h3>
              {loading ? (
                <div className="h-[180px] bg-gray-50 rounded-lg animate-pulse" />
              ) : chart.data.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">Нет данных</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={chart.data} cx="50%" cy="50%" outerRadius={65} dataKey="value" paddingAngle={2}>
                      {chart.data.map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          ))}
        </div>

        {/* Transport section */}
        {!loading && transportUsage.length > 0 && (
          <div className="space-y-4">
            {/* Top performers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5">🥇</span>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Эң көп рейс / Больше всего рейсов</p>
                  <p className="font-semibold text-gray-800 text-sm">{mostTrips?.name ?? "—"}</p>
                  <p className="text-green-600 text-xs font-medium mt-0.5">{mostTrips?.total_trips ?? 0} рейс</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5">🚛</span>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Эң көп аяктады / Больше всего выполнено</p>
                  <p className="font-semibold text-gray-800 text-sm">{mostCompleted?.name ?? "—"}</p>
                  <p className="text-blue-600 text-xs font-medium mt-0.5">{mostCompleted?.completed_trips ?? 0} аяктады</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5">⚡</span>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Азыр иштейт / Сейчас работают</p>
                  <p className="font-semibold text-gray-800 text-sm">{workingCount} транспорт</p>
                  <p className="text-yellow-600 text-xs font-medium mt-0.5">активдүү / активных</p>
                </div>
              </div>
            </div>

            {/* Transport table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <h3 className="text-gray-900 text-sm font-semibold">Транспорт колдонуу / Использование транспорта</h3>
                </div>
                <button
                  onClick={handleTransportExport}
                  disabled={exportingTransport}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition-colors shadow-sm font-medium disabled:opacity-50"
                >
                  {exportingTransport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  📥 Excel
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Транспорт</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Гос номер</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Тип</th>
                      <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">Бардыгы / Всего</th>
                      <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">Аяктады / Выполнено</th>
                      <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">Активдүү / Активных</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Таштанды түрлөрү</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportUsage.map((t: any, i: number) => {
                      const sm = STATUS_META[t.status] ?? { label: t.status ?? "—", cls: "bg-gray-100 text-gray-600" };
                      const typeCls = TYPE_COLORS[t.type] ?? "bg-gray-100 text-gray-600";
                      const topWaste = Object.entries(t.waste_breakdown || {})
                        .sort((a: any, b: any) => b[1] - a[1])
                        .slice(0, 2) as [string, number][];
                      return (
                        <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-800">{t.name || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-mono">{t.plate || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            {t.type ? (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeCls}`}>{t.type}</span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold text-sm ${t.total_trips > 0 ? "text-green-600" : "text-gray-400"}`}>
                              {t.total_trips}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-green-600 font-medium">{t.completed_trips}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={t.active_trips > 0 ? "text-yellow-600 font-medium" : "text-gray-400"}>
                              {t.active_trips}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {topWaste.length === 0 ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {topWaste.map(([wt, cnt]) => (
                                  <span key={wt} className="px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                                    {wt}: {cnt}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${sm.cls}`}>{sm.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Summary row */}
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wide" colSpan={3}>
                        Жыйынтык / Итого
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-green-700">{totalTripsSum}</td>
                      <td className="px-4 py-3 text-center font-bold text-green-700">{completedTripsSum}</td>
                      <td className="px-4 py-3 text-center font-bold text-yellow-700">{activeTripsSum}</td>
                      <td className="px-4 py-3" colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
