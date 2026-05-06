import { useState } from "react";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Bell, Shield, Globe, Database, ChevronRight } from "lucide-react";

const SECTIONS = [
  { id: "notifications", icon: Bell, label: "Уведомления" },
  { id: "security", icon: Shield, label: "Безопасность" },
  { id: "system", icon: Globe, label: "Система" },
  { id: "data", icon: Database, label: "Данные" },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState("notifications");
  const [notifSettings, setNotifSettings] = useState({
    newRequest: true,
    statusChange: true,
    dailySummary: false,
    chat: true,
  });
  const [orgName, setOrgName] = useState("Управление городских сервисов");
  const [botPhone, setBotPhone] = useState("+7 727 250 0000");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Настройки" showSearch={false} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left menu */}
        <div className="w-56 shrink-0 border-r border-gray-100 bg-white p-3 space-y-0.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeSection === s.id
                  ? "bg-[#EFF6FF] text-[#3B82F6]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              style={{ fontWeight: activeSection === s.id ? 600 : 400 }}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
              {activeSection === s.id && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === "notifications" && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>
                  Настройки уведомлений
                </h2>
                <p className="text-sm text-gray-500">
                  Управляйте тем, какие уведомления вы получаете
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {[
                  {
                    key: "newRequest" as const,
                    label: "Новые заявки",
                    desc: "Уведомление при поступлении новой заявки",
                  },
                  {
                    key: "statusChange" as const,
                    label: "Смена статуса",
                    desc: "Уведомление при изменении статуса заявки",
                  },
                  {
                    key: "dailySummary" as const,
                    label: "Ежедневная сводка",
                    desc: "Ежедневный отчёт в 09:00",
                  },
                  {
                    key: "chat" as const,
                    label: "Сообщения в чате",
                    desc: "Уведомление о новых сообщениях от пользователей",
                  },
                ].map((item, i, arr) => (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between p-4 ${
                      i < arr.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifSettings[item.key]}
                      onCheckedChange={(v) =>
                        setNotifSettings((s) => ({ ...s, [item.key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "system" && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>
                  Настройки системы
                </h2>
                <p className="text-sm text-gray-500">
                  Основные параметры системы
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-700">
                    Название организации
                  </Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="bg-gray-50 border-gray-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-700">
                    Телефон бота (WhatsApp)
                  </Label>
                  <Input
                    value={botPhone}
                    onChange={(e) => setBotPhone(e.target.value)}
                    className="bg-gray-50 border-gray-200 rounded-lg"
                  />
                </div>
                <Button
                  size="sm"
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg mt-2"
                >
                  Сохранить изменения
                </Button>
              </div>
            </div>
          )}

          {(activeSection === "security" || activeSection === "data") && (
            <div className="max-w-lg">
              <div>
                <h2 className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>
                  {SECTIONS.find((s) => s.id === activeSection)?.label}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Раздел находится в разработке
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-12 text-center">
                <p className="text-gray-400 text-sm">Скоро появится</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
