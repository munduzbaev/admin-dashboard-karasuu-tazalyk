import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { Filter, ChevronUp, ChevronDown, Trash2, Loader2 } from "lucide-react";
import { Header } from "../components/Header";
import { StatusBadge } from "../components/StatusBadge";
import { ApplicationDetail } from "../components/ApplicationDetail";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
import { cn } from "../components/ui/utils";
import { api } from "../api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

type SortField = "id" | "created_at" | "status";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "new", label: "Жаңы / Новая" },
  { value: "in_progress", label: "Иштелүүдө / В работе" },
  { value: "pending_admin_approval", label: "Админ кароосунда / На одобрении" },
  { value: "completed", label: "Жабылды / Завершено" },
  { value: "closed", label: "Жабылды / Закрыто" },
  { value: "cancelled", label: "Жокко чыгарылды / Отменено" },
  { value: "waiting_user", label: "Күтүүдө / Ожидание" },
  { value: "pending_review", label: "Кароодо / На рассмотрении" },
];

const SOURCE_OPTIONS = [
  { value: "all", label: "Все источники" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Телефон" },
  { value: "walk_in", label: "Личный визит" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function Applications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [searchParams, setSearchParams] = useSearchParams();
  const urlId = searchParams.get("id");

  useEffect(() => {
    if (urlId && applications.length > 0) {
      const found = applications.find((a) => String(a.id) === urlId);
      if (found && selectedId !== urlId) {
        setSelectedId(urlId);
        setTimeout(() => {
          const el = document.getElementById(`app-row-${urlId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
    }
  }, [urlId, applications]);

  const handleCloseDetail = () => {
    setSelectedId(null);
    if (urlId) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("id");
      setSearchParams(newParams, { replace: true });
    }
  };

  const fetchApplications = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      // Fetch applications + transport list in parallel.
      // Transport is merged client-side as a fallback for when the API
      // doesn't include the joined transport object.
      const [appsRes, transportRes] = await Promise.all([
        api.get(`/applications?${params}`),
        api.get("/transport").catch(() => ({ data: { success: false } })),
      ]);
      const body = appsRes.data;
      if (body.success) {
        const list = Array.isArray(body.data) ? body.data : [];
        const transportMap = new Map<string, { name?: string; plate?: string }>();
        const tBody = transportRes.data;
        if (tBody?.success && Array.isArray(tBody.data)) {
          for (const t of tBody.data) {
            if (t?.id) transportMap.set(String(t.id), { name: t.name, plate: t.plate });
          }
        }
        const enriched = list.map((a: any) => {
          if (a.transport && (a.transport.name || a.transport.plate)) return a;
          const t = a.vehicle_id ? transportMap.get(String(a.vehicle_id)) : null;
          return t ? { ...a, transport: t } : a;
        });
        setApplications(enriched);
      } else {
        if (showSpinner) toast.error("Ошибка загрузки заявок");
        setApplications([]);
      }
    } catch {
      if (showSpinner) toast.error("Ошибка загрузки заявок");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [statusFilter, sourceFilter]);

  useEffect(() => {
    fetchApplications(true);
  }, [fetchApplications]);

  useAutoRefresh(() => fetchApplications(false));

  const selectedApp = applications.find((a) => String(a.id) === selectedId) ?? null;

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await api.patch(`/applications/${id}`, { status });
      const body = res.data;
      if (body.success) {
        toast.success("Статус изменён / Статус өзгөртүлдү");
        await fetchApplications();
      } else {
        toast.error("Ошибка: " + (body.error || "Не удалось изменить статус"));
      }
    } catch {
      toast.error("Ошибка при изменении статуса");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/applications/${id}`);
      const body = res.data;
      if (body.success) {
        toast.success("Заявка удалена / Арыз жок кылынды");
        setSelectedId(null);
        await fetchApplications();
      } else {
        toast.error("Ошибка: " + (body.error || "Не удалось удалить"));
      }
    } catch {
      toast.error("Ошибка при удалении");
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let result = [...applications];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          String(a.id).toLowerCase().includes(q) ||
          (a.address || "").toLowerCase().includes(q) ||
          (a.phone || "").includes(q)
      );
    }
    result.sort((a, b) => {
      let av: string, bv: string;
      if (sortField === "created_at") {
        av = a.created_at || "";
        bv = b.created_at || "";
      } else if (sortField === "id") {
        av = String(a.id);
        bv = String(b.id);
      } else {
        av = a.status || "";
        bv = b.status || "";
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [applications, search, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="w-3 h-3 opacity-30 inline-block">↕</span>;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 inline-block text-[#3B82F6]" />
    ) : (
      <ChevronDown className="w-3 h-3 inline-block text-[#3B82F6]" />
    );
  };

  const statCounts = {
    all: applications.length,
    new: applications.filter((a) => a.status === "new").length,
    in_progress: applications.filter((a) => a.status === "in_progress").length,
    pending_admin_approval: applications.filter((a) => a.status === "pending_admin_approval").length,
    completed: applications.filter((a) => a.status === "completed" || a.status === "closed").length,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Арыздар / Заявки"
        searchPlaceholder="Поиск по ID, адресу, телефону..."
        searchValue={search}
        onSearch={setSearch}
        showSearch={!selectedApp}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Table Panel */}
        <div
          className={cn(
            "flex flex-col flex-1 overflow-hidden transition-all duration-300",
            selectedApp ? "hidden xl:flex xl:w-[55%] xl:flex-none" : "flex"
          )}
        >
          {/* Status pills */}
          <div className="px-6 pt-4 pb-0 flex gap-2 shrink-0 flex-wrap">
            {[
              { key: "all", label: "Бардыгы / Все", color: "bg-gray-100 text-gray-700" },
              { key: "new", label: "Жаңы / Новые", color: "bg-blue-50 text-blue-700" },
              { key: "in_progress", label: "Иштелүүдө / В работе", color: "bg-amber-50 text-amber-700" },
              { key: "pending_admin_approval", label: "На одобрении", color: "bg-orange-50 text-orange-700" },
              { key: "completed", label: "Жабылды / Завершено", color: "bg-green-50 text-green-700" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition-all border",
                  statusFilter === s.key
                    ? `${s.color} border-transparent`
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                )}
                style={{ fontWeight: statusFilter === s.key ? 600 : 400 }}
              >
                {s.label}{" "}
                <span className="ml-1 opacity-75">
                  {statCounts[s.key as keyof typeof statCounts] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="px-6 py-3 flex flex-wrap items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-44 bg-white border-gray-200 rounded-lg">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-8 text-xs w-40 bg-white border-gray-200 rounded-lg">
                <SelectValue placeholder="Источник" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <span className="text-xs text-gray-400">
              {filtered.length} из {applications.length}
            </span>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto px-6 pb-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {[
                      { field: "id" as SortField, label: "ID", w: "w-24" },
                      { field: "status" as SortField, label: "Статус", w: "w-36" },
                      { field: "created_at" as SortField, label: "Адрес / Дата", w: "" },
                      { field: "id" as SortField, label: "Транспорт", w: "w-40" },
                    ].map((col, idx) => (
                      <th
                        key={idx}
                        className={cn(
                          "text-left px-4 py-3 text-xs text-gray-500 cursor-pointer hover:text-gray-800 select-none transition-colors",
                          col.w
                        )}
                        style={{ fontWeight: 600 }}
                        onClick={() => col.field && handleSort(col.field)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          {col.field !== "id" || idx === 0 ? <SortIcon field={col.field} /> : null}
                        </span>
                      </th>
                    ))}
                    <th className="text-left px-4 py-3 text-xs text-gray-500 w-36" style={{ fontWeight: 600 }}>
                      Телефон
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                        Маалымат жок / Нет данных
                      </td>
                    </tr>
                  ) : (
                    filtered.map((app) => (
                      <tr
                        id={`app-row-${app.id}`}
                        key={app.id}
                        onClick={() => setSelectedId(String(app.id) === selectedId ? null : String(app.id))}
                        className={cn(
                          "border-b border-gray-50 last:border-0 cursor-pointer transition-colors",
                          String(app.id) === selectedId ? "bg-[#EFF6FF]" : "hover:bg-gray-50/80"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-mono" style={{ fontWeight: 500 }}>
                              #{String(app.id).slice(0, 8)}
                            </span>
                            {app.media_url && (
                              <span title="Сүрөт бар / Есть фото" className="text-sm">📸</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800 truncate max-w-[200px]" style={{ fontWeight: 500 }}>
                            {app.address || "—"}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {app.created_at ? formatDate(app.created_at) : "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {app.transport ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-gray-700">{app.transport.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">{app.transport.plate}</span>
                            </div>
                          ) : app.vehicle_id ? (
                            <span className="text-xs text-amber-600">Назначен (ID: {String(app.vehicle_id).slice(0, 4)})</span>
                          ) : (
                            <span className="text-xs text-gray-400">Не назначен</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {app.phone ? (
                            <a
                              href={`tel:${app.phone}`}
                              className="text-xs text-[#3B82F6] font-mono hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {app.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Чындап эле жок кылуу керекпи?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Вы уверены, что хотите удалить эту заявку? Это действие необратимо.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Жок / Отмена</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(String(app.id))}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Ооба, жок кыл / Да, удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedApp && (
            <motion.div
              key={selectedApp.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 xl:flex-none xl:w-[45%] overflow-hidden border-l border-gray-100"
            >
              <ApplicationDetail
                application={selectedApp}
                onClose={handleCloseDetail}
                onStatusChange={handleStatusChange}
                onRefresh={fetchApplications}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
