import { useState, useMemo, useEffect, useCallback } from "react";
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

type SortField = "id" | "created_at" | "status";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "new", label: "Жаңы / Новая" },
  { value: "in_progress", label: "Иштелүүдө / В работе" },
  { value: "waiting_user", label: "Күтүүдө / Ожидание" },
  { value: "closed", label: "Жабылды / Закрыто" },
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

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      const res = await api.get(`/applications?${params}`);
      if (res.success) {
        setApplications(Array.isArray(res.data) ? res.data : []);
      } else {
        toast.error("Ошибка загрузки заявок");
        setApplications([]);
      }
    } catch {
      toast.error("Ошибка загрузки заявок");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sourceFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const selectedApp = applications.find((a) => String(a.id) === selectedId) ?? null;

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await api.patch(`/applications/${id}`, { status });
      if (res.success) {
        toast.success("Статус изменён / Статус өзгөртүлдү");
        await fetchApplications();
      } else {
        toast.error("Ошибка: " + (res.error || "Не удалось изменить статус"));
      }
    } catch {
      toast.error("Ошибка при изменении статуса");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/applications/${id}`);
      if (res.success) {
        toast.success("Заявка удалена / Арыз жок кылынды");
        setSelectedId(null);
        await fetchApplications();
      } else {
        toast.error("Ошибка: " + (res.error || "Не удалось удалить"));
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
    closed: applications.filter((a) => a.status === "closed").length,
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
              { key: "closed", label: "Жабылды / Закрыто", color: "bg-green-50 text-green-700" },
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
                    ].map((col) => (
                      <th
                        key={col.field}
                        className={cn(
                          "text-left px-4 py-3 text-xs text-gray-500 cursor-pointer hover:text-gray-800 select-none transition-colors",
                          col.w
                        )}
                        style={{ fontWeight: 600 }}
                        onClick={() => handleSort(col.field)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          <SortIcon field={col.field} />
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
                        key={app.id}
                        onClick={() => setSelectedId(String(app.id) === selectedId ? null : String(app.id))}
                        className={cn(
                          "border-b border-gray-50 last:border-0 cursor-pointer transition-colors",
                          String(app.id) === selectedId ? "bg-[#EFF6FF]" : "hover:bg-gray-50/80"
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 font-mono" style={{ fontWeight: 500 }}>
                            #{String(app.id).slice(0, 8)}
                          </span>
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
                onClose={() => setSelectedId(null)}
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
