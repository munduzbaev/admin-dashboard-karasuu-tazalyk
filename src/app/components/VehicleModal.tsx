import React, { useState, useEffect } from "react";
import {
    X, Truck, User, Phone, Gauge, Activity,
    Plus, Edit2, Save, Loader2, DollarSign,
    Calendar, Wrench, ChevronRight, Fuel
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { toast } from "sonner";
import { can } from "../permissions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";

interface VehicleModalProps {
    vehicle: any;
    onClose: () => void;
    onUpdate: () => void;
}

const STATUS_OPTIONS = [
    { value: "available", label: "Бош / Свободен", color: "text-green-600 bg-green-50" },
    { value: "working", label: "Иштейт / Работает", color: "text-blue-600 bg-blue-50" },
    { value: "repair", label: "Оңдоодо / В ремонте", color: "text-red-600 bg-red-50" },
    { value: "off", label: "Өчүк / Выключен", color: "text-gray-500 bg-gray-50" },
];

export function VehicleModal({ vehicle: initialVehicle, onClose, onUpdate }: VehicleModalProps) {
    const { user } = useAuth();
    const [vehicle, setVehicle] = useState(initialVehicle);
    const [loading, setLoading] = useState(false);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [expensesLoading, setExpensesLoading] = useState(false);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [newExpense, setNewExpense] = useState({ amount: "", item: "", date: new Date().toISOString().split("T")[0] });
    const [expenseSaving, setExpenseSaving] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ ...initialVehicle });
    const [saving, setSaving] = useState(false);

    const isAdmin = can.editTransport(user);
    const canAddExpense = can.editTransportExpenses(user);

    useEffect(() => {
        setVehicle(initialVehicle);
        setEditForm({ ...initialVehicle });
    }, [initialVehicle]);

    useEffect(() => {
        if (vehicle.id) fetchExpenses();
    }, [vehicle.id]);

    const fetchExpenses = async () => {
        setExpensesLoading(true);
        try {
            const res = await api.get(`/transport/${vehicle.id}/expenses`);
            const body = res.data;
            if (body.success) {
                setExpenses(body.data || []);
            }
        } catch (err) {
            console.error("Fetch expenses error:", err);
        } finally {
            setExpensesLoading(false);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpense.amount || !newExpense.item) return;
        setExpenseSaving(true);
        try {
            const res = await api.post(`/transport/${vehicle.id}/expenses`, {
                ...newExpense,
                amount: Number(newExpense.amount),
                created_by: user?.id
            });
            if (res.data.success) {
                toast.success("Чыгаша кошулду / Расход добавлен");
                setNewExpense({ amount: "", item: "", date: new Date().toISOString().split("T")[0] });
                setShowAddExpense(false);
                fetchExpenses();
            }
        } catch {
            toast.error("Ката / Ошибка при сохранении");
        } finally {
            setExpenseSaving(false);
        }
    };

    const handleUpdateVehicle = async () => {
        setSaving(true);
        try {
            const res = await api.patch(`/transport/${vehicle.id}`, editForm);
            if (res.data.success) {
                toast.success("Жаңыртылды / Обновлено");
                setVehicle({ ...vehicle, ...editForm });
                setIsEditing(false);
                onUpdate();
            }
        } catch {
            toast.error("Жаңыртуу катасы / Ошибка обновления");
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                            <Truck className="w-6 h-6 text-[#3B82F6]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 leading-none mb-1">{vehicle.plate}</h2>
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">{vehicle.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isAdmin && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors font-medium border border-[#3B82F6]/20"
                            >
                                <Edit2 className="w-4 h-4" />
                                Изменить
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Block: Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                            <Activity className="w-5 h-5 text-blue-500" />
                            <h3 className="text-lg font-bold text-gray-900">Инфо / Информация</h3>
                        </div>

                        {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Наименование</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Номер</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20"
                                        value={editForm.plate}
                                        onChange={e => setEditForm({ ...editForm, plate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Водитель</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20"
                                        value={editForm.driver_name || ""}
                                        onChange={e => setEditForm({ ...editForm, driver_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Тел. водителя</label>
                                    <input
                                        type="tel"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20"
                                        value={editForm.driver_phone || ""}
                                        onChange={e => setEditForm({ ...editForm, driver_phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Статус</label>
                                    <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                                        <SelectTrigger className="h-9 text-sm bg-white border-gray-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUS_OPTIONS.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Топливо (%)</label>
                                    <input
                                        type="number"
                                        min="0" max="100"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20"
                                        value={editForm.fuel_level}
                                        onChange={e => setEditForm({ ...editForm, fuel_level: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="md:col-span-2 flex gap-3 pt-2 border-t border-gray-200 mt-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 py-2 text-sm text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        onClick={handleUpdateVehicle}
                                        disabled={saving}
                                        className="flex-1 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Сохранить
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <InfoCard icon={<Gauge className="w-4 h-4" />} label="Пробег" value={`${vehicle.mileage || 0} км`} col="blue" />
                                    <InfoCard icon={<Fuel className="w-4 h-4" />} label="Топливо" value={`${vehicle.fuel_level || 0}%`} col={vehicle.fuel_level > 20 ? "green" : "red"} />
                                    <InfoCard icon={<Truck className="w-4 h-4" />} label="Тип" value={vehicle.type} col="blue" />
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Статус</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${STATUS_OPTIONS.find(o => o.value === vehicle.status)?.color.split(" ")[0].replace("text", "bg")}`} />
                                            <p className="text-xs font-bold text-gray-700">
                                                {STATUS_OPTIONS.find(o => o.value === vehicle.status)?.label.split(" / ")[1]}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Водитель</p>
                                            <p className="text-sm font-semibold text-slate-700">{vehicle.driver_name || "Не назначен"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                                            <Phone className="w-5 h-5 text-[#3B82F6]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-[#3B82F6]/60 uppercase">Телефон</p>
                                            <a href={`tel:${vehicle.driver_phone}`} className="text-sm font-semibold text-[#3B82F6] hover:underline">
                                                {vehicle.driver_phone || "—"}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Block: Expenses */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                                < DollarSign className="w-5 h-5 text-green-500" />
                                <h3 className="text-lg font-bold text-gray-900">Расходы / Чыгашалар</h3>
                            </div>
                            {!showAddExpense && canAddExpense && (
                                <button
                                    onClick={() => setShowAddExpense(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-200 active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    Добавить расход
                                </button>
                            )}
                        </div>

                        <AnimatePresence>
                            {showAddExpense && (
                                <motion.form
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    onSubmit={handleAddExpense}
                                    className="p-4 bg-gray-50 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-hidden"
                                >
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase font-mono">Описание</label>
                                        <input
                                            required
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20"
                                            placeholder="Замена масла"
                                            value={newExpense.item}
                                            onChange={e => setNewExpense({ ...newExpense, item: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase font-mono">Сумма (сом)</label>
                                        <input
                                            required
                                            type="number"
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20"
                                            placeholder="5000"
                                            value={newExpense.amount}
                                            onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1 flex flex-col justify-end">
                                        <div className="flex gap-2 h-9">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddExpense(false)}
                                                className="flex-1 text-xs text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                Отмена
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={expenseSaving}
                                                className="flex-1 bg-[#10B981] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#059669] disabled:opacity-50 shadow-sm"
                                            >
                                                {expenseSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                Сактоо
                                            </button>
                                        </div>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            {expensesLoading ? (
                                <div className="p-8 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                                </div>
                            ) : expenses.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <p className="text-sm italic">Расходдор жок / Записей пока нет</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp: any) => (
                                        <div key={exp.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                                    <Wrench className="w-4.5 h-4.5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{exp.item}</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(exp.date)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-black text-[#10B981]">
                                                {exp.amount.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">сом</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Block: History */}
                    {Array.isArray(vehicle.history) && vehicle.history.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-orange-400" />
                                <h3 className="text-lg font-bold text-gray-900">История / Тарых</h3>
                            </div>
                            <div className="space-y-2">
                                {vehicle.history.slice(0, 10).map((h: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 shadow-sm transition-colors group">
                                        <span className="text-[10px] font-bold text-gray-400 w-16 group-hover:text-amber-500 transition-colors">
                                            {h.date ? new Date(h.date).toLocaleDateString("ru-RU") : "—"}
                                        </span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-amber-400 shrink-0" />
                                        <span className="text-sm text-gray-700 font-medium">{h.action || h.description || "Действие"}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function InfoCard({ icon, label, value, col }: { icon: React.ReactNode, label: string, value: string, col: "blue" | "green" | "red" }) {
    const styles = {
        blue: "bg-blue-50 border-blue-100 text-[#3B82F6]",
        green: "bg-green-50 border-green-100 text-[#10B981]",
        red: "bg-red-50 border-red-100 text-[#EF4444]",
    };

    return (
        <div className={`p-4 rounded-2xl border ${styles[col].split(" ").slice(0, 2).join(" ")}`}>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</p>
            <div className="flex items-center gap-2">
                <span className={styles[col].split(" ")[3]}>{icon}</span>
                <p className="text-xs font-black text-gray-900">{value}</p>
            </div>
        </div>
    );
}
