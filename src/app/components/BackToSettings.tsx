import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

/**
 * Small inline link rendered above page header on data pages
 * (Transport, Operators, Institutions). Brings the user back
 * to /settings → Data section.
 */
export function BackToSettings() {
  return (
    <Link
      to="/settings"
      className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#3B82F6] transition-colors mb-2"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Настройки → Данные
    </Link>
  );
}
