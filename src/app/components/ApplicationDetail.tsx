import { useState, useRef, useEffect } from "react";
import {
  X,
  Phone,
  MapPin,
  Tag,
  Calendar,
  FileText,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  User,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { ImageModal } from "./ImageModal";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "./ui/utils";
import { api } from "../api";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "new", label: "Жаңы / Новая" },
  { value: "in_progress", label: "Иштелүүдө / В работе" },
  { value: "waiting_user", label: "Күтүүдө / Ожидание" },
  { value: "closed", label: "Жабылды / Закрыто" },
  { value: "pending_review", label: "Кароодо / На рассмотрении" },
];

interface ApplicationDetailProps {
  application: any;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onRefresh?: () => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getGoogleDrivePreview(url: string) {
  if (!url) return null;
  const fileIdMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
  }
  return null;
}

export function ApplicationDetail({
  application,
  onClose,
  onStatusChange,
  onRefresh,
}: ApplicationDetailProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const media: any[] = application.media || [];
  const imageItems = media.filter((m) => m.type === "image");

  useEffect(() => {
    if (!application?.id) return;
    setMessagesLoading(true);
    api.get(`/applications/${application.id}/messages`).then((res) => {
      const body = res.data;
      if (body.success) {
        setMessages(Array.isArray(body.data) ? body.data : []);
      }
    }).finally(() => setMessagesLoading(false));
  }, [application?.id]);

  const openImage = (index: number) => {
    setModalIndex(index);
    setModalOpen(true);
  };

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;
    setSendingMsg(true);
    try {
      const user = (() => {
        try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
      })();
      const res = await api.post(`/applications/${application.id}/messages`, {
        text: chatMessage.trim(),
        user_id: user.id,
      });
      const body = res.data;
      if (body.success) {
        setMessages((prev) => [...prev, body.data || {
          id: Date.now(),
          sender: "operator",
          text: chatMessage.trim(),
          created_at: new Date().toISOString(),
        }]);
        setChatMessage("");
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      } else {
        toast.error("Ошибка отправки сообщения");
      }
    } catch {
      toast.error("Ошибка отправки сообщения");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleStatusSelect = async (status: string) => {
    await onStatusChange(String(application.id), status);
    onRefresh?.();
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-5 border-b border-gray-100 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
              #{String(application.id).slice(0, 8)}
            </span>
            <StatusBadge status={application.status} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Info */}
          <div className="space-y-4">
            <h3 className="text-sm text-gray-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>
              Маалымат / Информация
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {application.phone && (
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Телефон">
                  <a href={`tel:${application.phone}`} className="text-[#3B82F6] hover:underline">
                    {application.phone}
                  </a>
                </InfoRow>
              )}
              {application.address && (
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Адрес">
                  {application.address}
                </InfoRow>
              )}
              {application.waste_type && (
                <InfoRow icon={<Tag className="w-4 h-4" />} label="Тип отходов">
                  {application.waste_type}
                </InfoRow>
              )}
              {application.source && (
                <InfoRow icon={<Tag className="w-4 h-4" />} label="Источник">
                  {application.source}
                </InfoRow>
              )}
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Статус">
                <StatusBadge status={application.status} />
              </InfoRow>
              {application.created_at && (
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Дата">
                  {formatDate(application.created_at)}
                </InfoRow>
              )}
              {application.assigned_to && (
                <InfoRow icon={<User className="w-4 h-4" />} label="Оператор">
                  {application.assigned_to}
                </InfoRow>
              )}
            </div>

            {/* Description */}
            {application.description && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>
                    Сүрөттөмө / Описание
                  </span>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 leading-relaxed">
                  {application.description}
                </p>
              </div>
            )}
          </div>

          {/* Actions - Status Change */}
          <div>
            <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-3" style={{ fontWeight: 600 }}>
              Аракеттер / Действия
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <Select value={application.status} onValueChange={handleStatusSelect}>
                <SelectTrigger className="h-9 text-sm w-56 bg-white border-gray-200 rounded-lg">
                  <SelectValue placeholder="Изменить статус" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleStatusSelect("in_progress")}
                disabled={application.status === "in_progress"}
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-lg"
                size="sm"
              >
                <Clock className="w-3.5 h-3.5" />
                В работу
              </Button>
              <Button
                onClick={() => handleStatusSelect("closed")}
                disabled={application.status === "closed"}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white border-0 rounded-lg"
                size="sm"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Жаап коюу / Закрыть
              </Button>
              <Button
                onClick={() => handleStatusSelect("pending_review")}
                disabled={application.status === "pending_review"}
                variant="outline"
                size="sm"
                className="gap-2 rounded-lg border-gray-200"
              >
                <XCircle className="w-3.5 h-3.5" />
                На рассмотрение
              </Button>
            </div>
          </div>

          {/* Media */}
          {imageItems.length > 0 && (
            <div>
              <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-3" style={{ fontWeight: 600 }}>
                Медиафайлы ({imageItems.length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {imageItems.map((item: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => openImage(i)}
                    className="relative aspect-video rounded-xl overflow-hidden group bg-gray-100 hover:ring-2 hover:ring-[#3B82F6] transition-all"
                  >
                    <img
                      src={item.url}
                      alt={`Фото ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer Photo (media_url from Google Drive) */}
          {application.media_url && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-gray-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>
                  📸 Фото от клиента
                </h3>
                <a
                  href={application.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#3B82F6] hover:underline flex items-center gap-1"
                >
                  Открыть фото <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-white border border-gray-200">
                  <img
                    src={getGoogleDrivePreview(application.media_url) || application.media_url}
                    alt="Фото от клиента"
                    className="w-full h-full object-contain cursor-pointer"
                    onClick={() => window.open(application.media_url, "_blank")}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Нажмите+Открыть+фото";
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Chat */}
          <div>
            <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-3" style={{ fontWeight: 600 }}>
              Кат алышуу / Переписка
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="h-56 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {messagesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-gray-400">Маалымат жок / Нет сообщений</p>
                  </div>
                ) : (
                  messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender === "operator" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2.5",
                          msg.sender === "operator"
                            ? "bg-[#3B82F6] text-white rounded-br-sm"
                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
                        )}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p className={cn("text-xs mt-1", msg.sender === "operator" ? "text-blue-100" : "text-gray-400")}>
                          {msg.created_at ? formatTime(msg.created_at) : formatTime(msg.timestamp || "")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                <Textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Сообщение жазыңыз / Напишите сообщение..."
                  className="min-h-0 h-10 resize-none py-2 text-sm rounded-lg border-gray-200 bg-gray-50 focus-visible:ring-[#3B82F6]/30"
                  rows={1}
                />
                <Button
                  onClick={sendMessage}
                  size="sm"
                  className="h-10 w-10 p-0 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg shrink-0"
                  disabled={!chatMessage.trim() || sendingMsg}
                >
                  {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={modalOpen}
        imageUrl={imageItems[modalIndex]?.url ?? ""}
        onClose={() => setModalOpen(false)}
        onPrev={() => setModalIndex((i) => Math.max(0, i - 1))}
        onNext={() => setModalIndex((i) => Math.min(imageItems.length - 1, i + 1))}
        hasPrev={modalIndex > 0}
        hasNext={modalIndex < imageItems.length - 1}
        currentIndex={modalIndex}
        total={imageItems.length}
      />
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <div className="text-sm text-gray-800">{children}</div>
      </div>
    </div>
  );
}
