import { Header } from "../components/Header";
import { Download, Calendar as CalendarIcon, TrendingUp, Loader2 } from "lucide-react";
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

export default function Reports() {
  const [dateFrom, setDateFrom] = useState(getDefaultRange().from);
  const [dateTo, setDateTo] = useState(getDefaultRange().to);
  const [summary, setSummary] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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
          // fallback to main applications endpoint
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
      // Dynamic import of xlsx
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

  // Chart data
  const historyData: any[] = (summary?.applications_history || []).map((h: any) => ({
    name: new Date(h.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
    requests: h.count ?? 0,
  }));

  const wasteTypeData: any[] = Object.entries(summary?.by_waste_type || {}).map(([name, value]) => ({ name, value }));
  const sourceData: any[] = Object.entries(summary?.by_source || {}).map(([name, value]) => ({ name, value }));
  const userTypeData: any[] = Object.entries(summary?.by_user_type || {}).map(([name, value]) => ({ name, value }));

  const total = summary?.total ?? applications.length;
  const completed = summary?.completed ?? applications.filter((a) => a.status === "completed" || a.status === "closed").length;
  const pending = summary?.pending ?? applications.filter((a) => ["new", "in_progress", "waiting_user", "pending_review"].includes(a.status)).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Отчёттор / Отчёты" showSearch={false} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
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

        {/* Transport usage */}
        {!loading && summary?.transport_usage?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-gray-900 text-sm font-semibold">Транспорт колдонуу / Использование транспорта</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Транспорт</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Рейстер / Рейсы</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Жүк / Объём</th>
                </tr>
              </thead>
              <tbody>
                {summary.transport_usage.map((t: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{t.name || t.plate || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{t.trips ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{t.volume ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
