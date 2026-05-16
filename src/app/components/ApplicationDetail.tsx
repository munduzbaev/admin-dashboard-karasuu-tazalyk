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
  Truck,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
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
import { can, getRole } from "../permissions";
import { useAuth } from "../context/AuthContext";

const STATUS_OPTIONS = [
  { value: "new", label: "Жаңы / Новая" },
  { value: "in_progress", label: "Иштелүүдө / В работе" },
  { value: "completed", label: "Жабылды / Завершено" },
  { value: "closed", label: "Жабылды / Закрыто" },
  { value: "cancelled", label: "Жокко чыгарылды / Отменено" },
  { value: "waiting_user", label: "Күтүүдө / Ожидание" },
  { value: "pending_review", label: "Кароодо / На рассмотрении" },
  { value: "pending_admin_approval", label: "Админ кароосунда / На одобрении" },
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
  const { user } = useAuth();
  const canApproveRefusal = can.approveRefusal(user);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  const [transportModalOpen, setTransportModalOpen] = useState(false);
  const [availableTransports, setAvailableTransports] = useState<any[]>([]);
  const [selectedTransportId, setSelectedTransportId] = useState<string>("");
  const [fetchingTransport, setFetchingTransport] = useState(false);
  const [assignedTransport, setAssignedTransport] = useState<any>(null);

  // Refusal workflow state
  const [refusalModalOpen, setRefusalModalOpen] = useState(false);
  const [refusalNotes, setRefusalNotes] = useState("");
  const [submittingRefusal, setSubmittingRefusal] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [decisionLoading, setDecisionLoading] = useState<"approve" | "return" | null>(null);

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

  useEffect(() => {
    if (application?.vehicle_id) {
      api.get(`/transport/${application.vehicle_id}`).then(res => {
        if (res.data?.success) {
          setAssignedTransport(res.data.data);
        }
      }).catch(() => { });
    } else {
      setAssignedTransport(null);
    }
  }, [application?.vehicle_id]);

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
    if (status === "in_progress") {
      setFetchingTransport(true);
      try {
        const res = await api.get('/transport?status=available');
        if (res.data?.success) {
          setAvailableTransports(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch (err) {
        toast.error("Не удалось загрузить список транспорта");
      } finally {
        setFetchingTransport(false);
        setTransportModalOpen(true);
      }
      return;
    }

    if (status === "completed" || status === "closed") {
      await onStatusChange(String(application.id), status);
      if (application.vehicle_id) {
        try {
          await api.patch(`/transport/${application.vehicle_id}`, {
            status: 'available',
            current_task: null
          });
          toast.success("Транспорт бошотулду / Транспорт освобождён");
        } catch (err) {
          console.error(err);
        }
      }
      onRefresh?.();
      return;
    }

    await onStatusChange(String(application.id), status);
    onRefresh?.();
  };

  const handleAssignTransport = async () => {
    if (!selectedTransportId) return;
    try {
      // New iter3 flow: dedicated endpoint that sets status='assigned',
      // records assigned_at, and fires the n8n webhook so the driver
      // gets a Telegram notification immediately.
      const res = await api.post(`/applications/${application.id}/assign`, {
        vehicle_id: selectedTransportId,
      });

      if (!res.data?.success) {
        const errMap: Record<string, string> = {
          vehicle_not_found: "Транспорт не найден",
          vehicle_inactive: "Транспорт неактивен",
          application_not_found: "Заявка не найдена",
        };
        toast.error(errMap[res.data?.error] || "Ошибка при назначении транспорта");
        return;
      }

      // If the webhook didn't reach n8n, the assignment still succeeded — but
      // warn the operator they should call the driver by phone.
      const wh = res.data?.webhook;
      if (wh && !wh.ok) {
        toast.warning(
          "Транспорт назначен, но уведомление водителю не отправлено. Позвоните напрямую."
        );
      } else {
        toast.success("Транспорт дайындалды / Транспорт назначен");
      }

      setTransportModalOpen(false);
      setSelectedTransportId("");
      onRefresh?.();
      onStatusChange(String(application.id), "assigned");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Ошибка при назначении транспорта");
    }
  };

  // ── Refusal workflow ──────────────────────────────────────────

  const submitRefusal = async () => {
    if (!refusalNotes.trim()) {
      toast.error("Укажите причину отказа");
      return;
    }
    setSubmittingRefusal(true);
    try {
      const res = await api.post(`/applications/${application.id}/reject`, {
        refusal_notes: refusalNotes.trim(),
        operator_id: user?.id || null,
      });
      if (res.data?.success) {
        toast.success("Отправлено на одобрение администратора");
        setRefusalModalOpen(false);
        setRefusalNotes("");
        onRefresh?.();
      } else {
        toast.error(res.data?.error || "Ошибка при отправке");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setSubmittingRefusal(false);
    }
  };

  const decideRefusal = async (decision: "approve" | "return") => {
    setDecisionLoading(decision);
    try {
      const res = await api.patch(`/applications/${application.id}/refusal/${decision}`, {
        approver_id: user?.id || null,
        admin_note: adminNote.trim() || undefined,
        return_to_status: decision === "return" ? "in_progress" : undefined,
      });
      if (res.data?.success) {
        toast.success(decision === "approve" ? "Отказ подтверждён" : "Возвращено оператору");
        setAdminNote("");
        onRefresh?.();
      } else {
        toast.error(res.data?.error || "Ошибка");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setDecisionLoading(null);
    }
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
              <InfoRow icon={<Truck className="w-4 h-4" />} label="🚛 Транспорт">
                {application.vehicle_id ? (
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {application.transport ? `${application.transport.name} — ${application.transport.plate}` : (assignedTransport ? `${assignedTransport.name} — ${assignedTransport.plate}` : "Загрузка...")}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-700 font-bold uppercase border border-green-200">
                        Иштейт
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-400">Дайындалган жок / Не назначен</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusSelect("in_progress")}
                      className="h-7 text-xs px-2 gap-1 border-gray-200"
                    >
                      ➕ Дайындоо / Назначить
                    </Button>
                  </div>
                )}
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
              <Select value={application.status} onValueChange={handleStatusSelect} disabled={application.status === "closed"}>
                <SelectTrigger className="h-9 text-sm w-56 bg-white border-gray-200 rounded-lg">
                  <SelectValue placeholder="Изменить статус" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.filter((o) => {
                    const current = application.status;
                    if (o.value === current) return true;
                    if (current === 'new' && (o.value === 'in_progress' || o.value === 'closed')) return true;
                    if (current === 'in_progress' && (o.value === 'completed' || o.value === 'closed')) return true;
                    if (current === 'completed' && o.value === 'closed') return true;
                    return false;
                  }).map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {application.status === "new" && (
                <>
                  <Button
                    onClick={() => handleStatusSelect("in_progress")}
                    className="gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white border-0 rounded-lg"
                    size="sm"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    В работу
                  </Button>
                  <Button
                    onClick={() => handleStatusSelect("closed")}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Жабуу / Закрыть
                  </Button>
                </>
              )}

              {application.status === "in_progress" && (
                <>
                  <Button
                    onClick={() => handleStatusSelect("completed")}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white border-0 rounded-lg"
                    size="sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Жабылды / Завершить
                  </Button>
                  {application.vehicle_id && (
                    <Button
                      onClick={() => handleStatusSelect("in_progress")}
                      variant="outline"
                      size="sm"
                      className="gap-2 border-gray-200 hover:bg-gray-50 rounded-lg"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      {assignedTransport ? assignedTransport.plate : "Транспорт"}
                    </Button>
                  )}
                </>
              )}

              {application.status === "completed" && (
                <Button
                  onClick={() => handleStatusSelect("closed")}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Жабуу / Закрыть
                </Button>
              )}

              {application.status === "closed" && (
                <>
                  <Button disabled variant="outline" size="sm" className="gap-2 border-gray-200 rounded-lg">
                    <XCircle className="w-3.5 h-3.5" />
                    Жабуу / Закрыть
                  </Button>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-500 font-medium">
                    Жабылды / Закрыто
                  </span>
                </>
              )}

              {!["new", "in_progress", "completed", "closed"].includes(application.status) && application.status !== "pending_admin_approval" && (
                <Button
                  onClick={() => handleStatusSelect("in_progress")}
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg border-gray-200"
                >
                  <Clock className="w-3.5 h-3.5" />
                  В работу
                </Button>
              )}

              {/* "Клиент отказался" — доступна оператору в new/in_progress/completed */}
              {["new", "in_progress", "completed"].includes(application.status) && (
                <Button
                  onClick={() => setRefusalModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Клиент отказался
                </Button>
              )}
            </div>

            {/* Admin approval block for refusal */}
            {application.status === "pending_admin_approval" && (
              <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-900">Запрос на отказ от клиента</p>
                    {application.refusal_notes && (
                      <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-wrap">
                        {application.refusal_notes}
                      </p>
                    )}
                    {application.refused_at && (
                      <p className="text-xs text-gray-500 mt-1.5">
                        Создан: {formatDate(application.refused_at)}
                      </p>
                    )}
                    {application.refusal_signature_url && (
                      <a
                        href={application.refusal_signature_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#3B82F6] hover:underline mt-2"
                      >
                        ✍️ Посмотреть подпись клиента
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {canApproveRefusal ? (
                  <>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Комментарий (необязательно)"
                      className="min-h-0 h-16 text-sm bg-white"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => decideRefusal("approve")}
                        disabled={decisionLoading !== null}
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                      >
                        {decisionLoading === "approve" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        Подтвердить отказ
                      </Button>
                      <Button
                        onClick={() => decideRefusal("return")}
                        disabled={decisionLoading !== null}
                        variant="outline"
                        size="sm"
                        className="gap-2 border-gray-300 rounded-lg"
                      >
                        {decisionLoading === "return" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        Вернуть оператору
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-orange-700 bg-orange-100 border border-orange-200 rounded-lg p-2">
                    Ожидает одобрения администратора
                  </p>
                )}
              </div>
            )}
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

          {/* Customer Photo */}
          {(() => {
            const hasValidPhoto = application.media_url &&
              !['received_media_url', '[Фото]', 'null', ''].includes(application.media_url);

            return (
              <div className="space-y-3">
                <h3 className="text-sm text-gray-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>
                  📸 Фото от клиента
                </h3>
                {hasValidPhoto ? (
                  <a href={application.media_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2">
                      📎 Фотону ачуу / Открыть фото ↗
                    </Button>
                  </a>
                ) : (
                  <Button
                    variant="outline"
                    className="text-gray-400 cursor-default hover:bg-transparent"
                    onClick={() => toast.info('Бул арызда фото жок / Фото отсутствует')}
                  >
                    📷 Фото жок / Фото отсутствует
                  </Button>
                )}
              </div>
            );
          })()}

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

      {/* Transport Modal */}
      <Dialog open={transportModalOpen} onOpenChange={setTransportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>🚛 Транспорт дайындоо / Назначить транспорт</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Заявка #{String(application.id).slice(0, 8)} — {application.address}</p>
          </DialogHeader>
          <div className="py-2">
            {fetchingTransport ? (
              <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
            ) : availableTransports.length === 0 ? (
              <div className="text-center p-4 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 text-sm font-medium">
                ⚠️ Бош транспорт жок / Нет свободного транспорта
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableTransports.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTransportId(String(t.id))}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all",
                      selectedTransportId === String(t.id)
                        ? "border-[#3B82F6] bg-blue-50 ring-1 ring-[#3B82F6]"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900">{t.name} — {t.plate}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {t.type && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-gray-100 text-gray-600">
                          {t.type}
                        </span>
                      )}
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-green-100 text-green-700">
                        Бош / Свободен
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-gray-200" onClick={() => setTransportModalOpen(false)}>Жок / Отмена</Button>
            <Button
              onClick={handleAssignTransport}
              disabled={!selectedTransportId || availableTransports.length === 0}
              className="bg-[#3B82F6] text-white hover:bg-[#2563EB] disabled:opacity-50"
            >
              Дайындоо / Назначить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refusal Modal — operator describes why client refused */}
      <Dialog open={refusalModalOpen} onOpenChange={(open) => {
        setRefusalModalOpen(open);
        if (!open) setRefusalNotes("");
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Клиент отказался
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Заявка #{String(application.id).slice(0, 8)} — {application.address}
            </p>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1.5 font-medium">
                Причина отказа <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={refusalNotes}
                onChange={(e) => setRefusalNotes(e.target.value)}
                placeholder="Опишите, что сказал клиент, обстоятельства отказа..."
                className="min-h-24 text-sm"
                rows={4}
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1.5">
                После отправки заявка получит статус «На одобрении» и будет ждать решения администратора.
                {application.vehicle_id && (
                  <span className="block mt-1 text-amber-600">
                    ⚠ Назначенный транспорт будет освобождён.
                  </span>
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-gray-200"
              onClick={() => setRefusalModalOpen(false)}
              disabled={submittingRefusal}
            >
              Отмена
            </Button>
            <Button
              onClick={submitRefusal}
              disabled={!refusalNotes.trim() || submittingRefusal}
              className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 gap-2"
            >
              {submittingRefusal ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Отправить на одобрение
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
