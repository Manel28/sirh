// Reexport de compatibilite : la configuration HTTP reste definie une seule fois
// dans api.js afin d'eviter deux URL de backend differentes.
export {
  API_BASE_URL,
  BACKEND_URL as BACKEND_BASE_URL,
  buildBackendUrl,
} from "./api";
