import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  // Récupération des informations de l'utilisateur stockées dans le navigateur
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  // Garde d'affichage cote React. Le backend reverifie toujours ROLE_ADMIN
  // avant d'executer une route /api/admin sensible.
  if (!token || !user || !user.roles?.includes("ROLE_ADMIN")) {
    // Redirection vers le tableau de bord si l'utilisateur n'est pas autorisé
    return <Navigate to="/dashboard" replace />;
  }

  // Affichage du contenu protégé si l'utilisateur est administrateur
  return children;
}
