import axios from "axios";

// URL commune de l'API Symfony. La variable Vite permet de changer de backend
// entre Docker, les tests et le deploiement sans modifier le code React.
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8001/api"
).replace(/\/$/, "");

export const BACKEND_URL = API_BASE_URL.replace(/\/api$/, "");

// Instance Axios partagee par tous les services (conges, documents, utilisateurs...).
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Cet intercepteur s'execute avant chaque requete. Il ajoute automatiquement le
// JWT dans l'en-tete HTTP, sauf pendant la connexion ou le token n'existe pas encore.
api.interceptors.request.use((config) => {
  const isLoginRequest = config.url === "/login";
  const token = localStorage.getItem("token");

  if (token && !isLoginRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Cet intercepteur centralise les erreurs d'authentification. Un code 401 signifie
// que le JWT est absent, invalide ou expire : la session locale est alors nettoyee.
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

// Transforme un chemin relatif stocke en base en URL complete vers le backend.
export const buildBackendUrl = (path) => {
  if (!path || path.startsWith("http")) return path || "";
  return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export default api;
