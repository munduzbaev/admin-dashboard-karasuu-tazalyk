import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  BarChart2,
} from "lucide-react";
import { Header } from "../components/Header";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100" />
      </div>
      <div className="h-8 w-16 bg-gray-100 rounded mb-2" />
      <div className="h-4 w-24 bg-gray-100 rounded" />
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [analyticsRes, appsRes] = await Promise.all([
          api.get("/analytics"),
          api.get("/applications?limit=5"),
        ]);

        const analyticsBody = analyticsRes.data;
        const appsBody = appsRes.data;

        if (analyticsBody.success) {
          setAnalytics(analyticsBody.data);
        }

        if (appsBody.success) {
          const data = Array.isArray(appsBody.data) ? appsBody.data : [];
          setRecentApps(data.slice(0, 5));
        }
      } catch (e) {
        console.error("Dashboard data load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const appStats = analytics?.applications || {};
  const stats = {
    total: appStats.total ?? 0,
    new: appStats.new ?? 0,
    inProgress: appStats.in_progress ?? 0,
    closed: appStats.closed ?? 0,
  };

  // Build chart data from applications_history
  const history: any[] = appStats.applications_history || [];
  const areaData = history.length > 0
    ? history.slice(-14).map((h: any) => ({
      day: new Date(h.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      requests: h.count ?? 0,
    }))
    : [{ day: "—", requests: 0 }];

  const pieData = [
    { name: "Жаңы / Новые", value: stats.new },
    { name: "Иштелүүдө / В работе", value: stats.inProgress },
    { name: "Жабылды / Закрыто", value: stats.closed },
  ].filter((d) => d.value > 0);

  const statCards = [
    {
      label: "Бардыгы / Всего",
      value: stats.total,
      icon: <ClipboardList className="w-5 h-5" />,
      color: "bg-blue-50 text-[#3B82F6]",
      trendUp: true,
    },
    {
      label: "Жаңы / Новые",
      value: stats.new,
      icon: <AlertCircle className="w-5 h-5" />,
      color: "bg-blue-50 text-blue-500",
      trendUp: null,
    },
    {
      label: "Иштелүүдө / В работе",
      value: stats.inProgress,
      icon: <Clock className="w-5 h-5" />,
      color: "bg-amber-50 text-amber-500",
      trendUp: null,
    },
    {
      label: "Жабылды / Закрыто",
      value: stats.closed,
      icon: <CheckCircle className="w-5 h-5" />,
      color: "bg-green-50 text-green-600",
      trendUp: true,
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Дашборд" showSearch={false} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-gray-900 mb-0.5" style={{ fontSize: 22, fontWeight: 600 }}>
            Добрый день, {user?.name?.split(" ")[0] || "Администратор"} 👋
          </h2>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" "}— вот сводка по заявкам
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : statCards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                    {card.icon}
                  </div>
                  {card.trendUp !== null && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
                      <TrendingUp className="w-3 h-3 inline mr-0.5" />↑
                    </span>
                  )}
                </div>
                <p className="text-3xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  {card.value}
                </p>
                <p className="text-sm text-gray-600" style={{ fontWeight: 500 }}>
                  {card.label}
                </p>
              </div>
            ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Area chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-gray-900" style={{ fontWeight: 600 }}>
                  Динамика заявок
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">За последние 14 дней</p>
              </div>
              <BarChart2 className="w-4 h-4 text-gray-400" />
            </div>
            {loading ? (
              <div className="h-[180px] bg-gray-50 rounded-lg animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={areaData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                    labelStyle={{ color: "#374151", fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fill="url(#grad)"
                    dot={{ fill: "#3B82F6", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>
              По статусам
            </h3>
            <p className="text-xs text-gray-400 mb-4">Распределение</p>
            {loading ? (
              <div className="h-[130px] bg-gray-50 rounded-lg animate-pulse" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie
                      data={pieData.length ? pieData : [{ name: "Нет данных", value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(pieData.length ? pieData : [{ name: "—", value: 1 }]).map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-xs text-gray-600 flex-1">{entry.name}</span>
                      <span className="text-xs text-gray-900" style={{ fontWeight: 600 }}>
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent applications */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-gray-900" style={{ fontWeight: 600 }}>
              Акыркы арыздар / Последние заявки
            </h3>
            <button
              onClick={() => navigate("/applications")}
              className="text-xs text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1 transition-colors"
              style={{ fontWeight: 500 }}
            >
              Бардыгы / Все заявки
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentApps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Маалымат жок / Нет данных</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left px-5 py-2.5 text-xs text-gray-500" style={{ fontWeight: 600 }}>ID</th>
                  <th className="text-left px-4 py-2.5 text-xs text-gray-500" style={{ fontWeight: 600 }}>Статус</th>
                  <th className="text-left px-4 py-2.5 text-xs text-gray-500 hidden md:table-cell" style={{ fontWeight: 600 }}>Адрес</th>
                  <th className="text-left px-4 py-2.5 text-xs text-gray-500 hidden sm:table-cell" style={{ fontWeight: 600 }}>Дата</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => navigate("/applications")}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 text-xs text-gray-500 font-mono" style={{ fontWeight: 500 }}>
                      #{String(app.id).slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-700 text-xs truncate block max-w-[200px]">
                        {app.address}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-400">
                        {app.created_at ? formatDate(app.created_at) : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
