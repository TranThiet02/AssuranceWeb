import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me/")
      .then(res => setUser(res.data))
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login/", { email, password });
    const { access, refresh, user: userData } = res.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout/", { refresh: localStorage.getItem("refresh_token") });
    } catch (_) {}
    localStorage.clear();
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  }, []);

  const updateMe = useCallback((data) => setUser(prev => ({ ...prev, ...data })), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};