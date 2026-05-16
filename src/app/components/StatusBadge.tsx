import { cn } from "./ui/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  new: {
    label: "Жаңы / Новая",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  in_progress: {
    label: "Иштелүүдө / В работе",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  // iter3 driver workflow
  assigned: {
    label: "Дайындалды / Назначено",
    className: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dot: "bg-cyan-500",
  },
  accepted: {
    label: "Кабыл алынды / Принято водителем",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  waiting_user: {
    label: "Күтүүдө / Ожидание",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  completed: {
    label: "Жабылды / Завершено",
    className: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  cancelled: {
    label: "Жокко чыгарылды / Отменено",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  pending_review: {
    label: "Кароодо / На рассмотрении",
    className: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  pending_admin_approval: {
    label: "Админ кароосунда / На одобрении",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  // Legacy compatibility
  closed: {
    label: "Жабылды / Закрыто",
    className: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Отклонена",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  waste: { label: "Таштанды / Мусор", className: "bg-orange-50 text-orange-700 border-orange-200" },
  complaint: { label: "Даттануу / Жалоба", className: "bg-purple-50 text-purple-700 border-purple-200" },
  road: { label: "Жолдор / Дороги", className: "bg-slate-50 text-slate-700 border-slate-200" },
  lighting: { label: "Жарык / Освещение", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  other: { label: "Башка / Прочее", className: "bg-gray-50 text-gray-600 border-gray-200" },
};

const DEFAULT_STATUS = {
  label: "—",
  className: "bg-gray-50 text-gray-500 border-gray-200",
  dot: "bg-gray-400",
};

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
}

interface CategoryBadgeProps {
  category: string;
}

export function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || DEFAULT_STATUS;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border",
        config.className
      )}
      style={{ fontWeight: 500 }}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      )}
      {config.label}
    </span>
  );
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category] || { label: category || "—", className: "bg-gray-50 text-gray-600 border-gray-200" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border",
        config.className
      )}
      style={{ fontWeight: 500 }}
    >
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG, CATEGORY_CONFIG };
