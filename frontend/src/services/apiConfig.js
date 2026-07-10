export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001/api";

export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const buildBackendUrl = (path) => {
  if (!path) {
    return "";
  }

  if (path.startsWith("http")) {
    return path;
  }

  return `${BACKEND_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};
