import axios from "axios";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8001/api"
).replace(/\/$/, "");

export const BACKEND_URL = API_BASE_URL.replace(/\/api$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const isLoginRequest = config.url === "/login";
  const token = localStorage.getItem("token");

  if (token && !isLoginRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url === "/login";

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/") {
        window.location.assign("/");
      }
    }

    return Promise.reject(error);
  }
);

export const buildBackendUrl = (path) => {
  if (!path || path.startsWith("http")) return path || "";
  return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export default api;
