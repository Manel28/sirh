export default function ProtectedRoute({ children }) {
  // Récupération des informations de l'utilisateur connecté
  const user = localStorage.getItem("user");

  // Vérification de l'authentification
  if (!user) {
    // Redirection vers la page de connexion si aucun utilisateur n'est connecté
    return <Navigate to="/" replace />;
  }

  // Affichage du contenu protégé si l'utilisateur est authentifié
  return children;
}