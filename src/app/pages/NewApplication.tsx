import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { MapPin, Phone, Building2, User, FileText, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";

export default function NewApplication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"resident" | "institution">("resident");
  const [source, setSource] = useState("phone");

  // Form fields
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [selectedWasteType, setSelectedWasteType] = useState("");

  // API-fetched data
  const [wasteTypes, setWasteTypes] = useState<any[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(true);

  useEffect(() => {
    async function loadDeps() {
      setLoadingDeps(true);
      try {
        const res = await api.get("/waste_types");
        const body = res.data;
        if (body.success && Array.isArray(body.data)) {
          setWasteTypes(body.data);
          if (body.data.length > 0) setSelectedWasteType(body.data[0].name || body.data[0].id);
        }
      } catch (e) {
        console.error("New application load deps error:", e);
      } finally {
        setLoadingDeps(false);
      }
    }
    loadDeps();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { toast.error("Укажите телефон"); return; }
    if (!address.trim()) { toast.error("Укажите адрес"); return; }
    if (type === "institution" && !institutionName.trim()) {
      toast.error("Укажите название учреждения");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/applications", {
        phone: phone.trim(),
        address: address.trim(),
        description: description.trim(),
        waste_type: selectedWasteType,
        source,
        user_type: type,
        institution_name: type === "institution" ? institutionName.trim() : undefined,
        status: "new",
      });
      const body = res.data;
      if (body.success) {
        toast.success("Арыз ийгиликтүү түзүлдү / Заявка успешно создана!");
        navigate("/applications");
      } else {
        toast.error("Ошибка: " + (body.error || "Не удалось создать заявку"));
      }
    } catch {
      toast.error("Ошибка при создании заявки");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] bg-white";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <Header title="Жаңы арыз / Новая заявка" showSearch={false} />

      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg text-gray-900" style={{ fontWeight: 600 }}>
              Жаңы арыз каттоо / Регистрация нового обращения
            </h2>
            <p className="text-sm text-gray-500 mt-1">Заполните данные для создания заявки вручную</p>
          </div>

          <div className="p-6 space-y-6">
            {/* User type */}
            <div>
              <label className="block text-sm text-gray-700 mb-3 font-medium">
                Колдонуучу түрү / Тип пользователя
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${type === "resident" ? "border-[#3B82F6] bg-blue-50/50" : "border-gray-200 hover:bg-gray-50"}`}>
                  <input type="radio" name="type" value="resident" checked={type === "resident"} onChange={() => setType("resident")} className="hidden" />
                  <User className={`w-5 h-5 ${type === "resident" ? "text-[#3B82F6]" : "text-gray-400"}`} />
                  <span className={`text-sm ${type === "resident" ? "text-[#3B82F6] font-medium" : "text-gray-600"}`}>
                    Жашоочу / Житель
                  </span>
                </label>
                <label className={`flex-1 flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${type === "institution" ? "border-[#3B82F6] bg-blue-50/50" : "border-gray-200 hover:bg-gray-50"}`}>
                  <input type="radio" name="type" value="institution" checked={type === "institution"} onChange={() => setType("institution")} className="hidden" />
                  <Building2 className={`w-5 h-5 ${type === "institution" ? "text-[#3B82F6]" : "text-gray-400"}`} />
                  <span className={`text-sm ${type === "institution" ? "text-[#3B82F6] font-medium" : "text-gray-600"}`}>
                    Мекеме / Учреждение
                  </span>
                </label>
              </div>
            </div>

            {/* Institution name */}
            {type === "institution" && (
              <div>
                <label className="block text-sm text-gray-700 mb-1 font-medium">
                  Мекеменин аты / Название учреждения
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className={`${inputClass} pl-10`}
                    placeholder="Мис: Мектеп №1 / Например: Школа №1"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-700 mb-1 font-medium">
                  Телефон <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    className={`${inputClass} pl-10`}
                    placeholder="+996 (___) __-__-__"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1 font-medium">
                  Дарек / Адрес <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className={`${inputClass} pl-10`}
                    placeholder="Көчө, үй, батир / Улица, дом, кв."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Waste type */}
              <div>
                <label className="block text-sm text-gray-700 mb-1 font-medium">
                  Калдыктын түрү / Тип отходов
                </label>
                {loadingDeps ? (
                  <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ) : wasteTypes.length > 0 ? (
                  <select
                    className={inputClass}
                    value={selectedWasteType}
                    onChange={(e) => setSelectedWasteType(e.target.value)}
                  >
                    {wasteTypes.map((wt: any) => (
                      <option key={wt.id || wt.name} value={wt.name || wt.id}>
                        {wt.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select className={inputClass} value={selectedWasteType} onChange={(e) => setSelectedWasteType(e.target.value)}>
                    <option value="solid">Катуу тиричилик калдыгы (ТБО)</option>
                    <option value="liquid">Суюк калдыктар (Ассенизатор)</option>
                    <option value="construction">Курулуш таштандысы</option>
                    <option value="leaves">Бутактар жана жалбырактар</option>
                  </select>
                )}
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm text-gray-700 mb-1 font-medium">
                  Булагы / Источник
                </label>
                <select
                  className={inputClass}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option value="phone">Телефон</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="walk_in">Жеке келүү / Личный визит</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-gray-700 mb-1 font-medium">
                Сүрөттөмө / Описание
              </label>
              <div className="relative">
                <FileText className="absolute top-2.5 left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                <textarea
                  rows={4}
                  className={`${inputClass} pl-10 resize-none`}
                  placeholder="Кошумча маалымат / Дополнительная информация..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/applications")}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Жокко чыгаруу / Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm transition-colors flex items-center gap-2 font-medium disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {loading ? "Жиберилүүдө..." : "Арыз жарат / Создать заявку"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
