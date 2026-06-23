export default function AdminRoute({ children }) {
  // Récupération des informations de l'utilisateur stockées dans le navigateur
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Vérification de l'authentification et du rôle administrateur
  if (!user || !user.roles?.includes("ROLE_ADMIN")) {
    // Redirection vers le tableau de bord si l'utilisateur n'est pas autorisé
    return <Navigate to="/dashboard" replace />;
  }

  // Affichage du contenu protégé si l'utilisateur est administrateur
  return children;
}