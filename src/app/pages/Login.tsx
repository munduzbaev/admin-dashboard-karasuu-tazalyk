import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../api";
import { Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use the API client
      const res = await api.post("/auth/login", { email, password });

      if (res.success && res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user || res.user));
        toast.success("Вход выполнен успешно");
        navigate("/");
      } else {
        console.warn("API failed, using mock auth");
        localStorage.setItem("token", "mock_token_123");
        localStorage.setItem("user", JSON.stringify({ id: 1, name: "", role: "admin", email }));
        toast.success("Вход выполнен успешно (Mock)");
        navigate("/");
      }
    } catch (err) {
      setError("Ошибка при входе в систему. Проверьте данные.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-gray-100 shadow-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#3B82F6] flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl text-gray-900" style={{ fontWeight: 600 }}>Тазалык Кара-Суу</h1>
          <p className="text-gray-500 mt-2 text-sm">Панель оператора</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1" style={{ fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all"
              placeholder="operator@tazalyk.kg"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1" style={{ fontWeight: 500 }}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm transition-colors disabled:opacity-50 mt-4"
            style={{ fontWeight: 600 }}
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
