import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];
const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) return Promise.reject(err);
    if (isRefreshing) {
      return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
        .then(token => { original.headers["Authorization"] = `Bearer ${token}`; return api(original); });
    }
    original._retry = true;
    isRefreshing = true;
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) throw new Error("No refresh token");
      const { data } = await axios.post(`${api.defaults.baseURL}/auth/token/refresh/`, { refresh });
      localStorage.setItem("access_token", data.access);
      api.defaults.headers.common["Authorization"] = `Bearer ${data.access}`;
      processQueue(null, data.access);
      original.headers["Authorization"] = `Bearer ${data.access}`;
      return api(original);
    } catch (e) {
      processQueue(e, null);
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;