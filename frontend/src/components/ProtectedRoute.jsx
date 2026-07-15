import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Récupération des informations de l'utilisateur connecté
  const user = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  // Garde de navigation cote React : elle evite d'afficher une page privee.
  // La securite reelle reste assuree par le firewall JWT du backend Symfony.
  if (!user || !token) {
    // Redirection vers la page de connexion si aucun utilisateur n'est connecté
    return <Navigate to="/" replace />;
  }

  // Affichage du contenu protégé si l'utilisateur est authentifié
  return children;
}
