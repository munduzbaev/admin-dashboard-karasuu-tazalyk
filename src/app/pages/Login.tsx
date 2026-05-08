import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../api";
import { Building2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });

      // The backend returns { success: true, token: "...", user: { ... } }
      const { success, token, user } = res.data;

      if (success && token) {
        login(token, user);
        toast.success("Вход выполнен успешно");
        navigate("/");
      } else {
        setError("Неверный email или пароль");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Ошибка при входе в систему. Проверьте подключение.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-gray-100 shadow-xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#3B82F6] flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Тазалык Кара-Суу</h1>
          <p className="text-gray-500 mt-2 text-sm">Панель администратора</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all"
              placeholder="operator@tazalyk.kg"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-sm font-bold transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Вход...
              </>
            ) : (
              "Войти"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
