import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "../services/notificationService";

/**
 * Layout principal de l'application.
 *
 * Ce composant sert de structure commune pour les pages connectées.
 * Il affiche l'en-tête, le menu de navigation, le nom de l'utilisateur,
 * le bouton de déconnexion, le compteur de notifications non lues
 * et le contenu principal de la page.
 *
 * Props :
 * @param {string} title Titre affiché en haut de la page
 * @param {ReactNode} children Contenu de la page affiché dans le layout
 */
export default function AppLayout({ title, children }) {
  // Hook permettant de rediriger l'utilisateur vers une autre route
  const navigate = useNavigate();

  // État permettant d'ouvrir ou fermer le menu mobile
  const [menuOpen, setMenuOpen] = useState(false);

  // État contenant le nombre de notifications non lues
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Récupération de l'utilisateur connecté depuis le localStorage
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Vérifie si l'utilisateur possède le rôle administrateur
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  // Construction du nom complet de l'utilisateur
  // Si le prénom/nom n'existe pas, on affiche l'email, sinon "Guest"
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Guest";

  /**
   * Chargement du nombre de notifications non lues.
   *
   * Le useEffect s'exécute au chargement du composant
   * et à chaque changement de l'identifiant utilisateur.
   */
  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        // Si aucun utilisateur n'est connecté, le compteur est remis à zéro
        if (!user?.id) {
          setUnreadNotifications(0);
          return;
        }

        // Appel au service pour récupérer les notifications de l'utilisateur
        const data = await getNotifications();

        // Calcul du nombre de notifications non lues
        const unread = Array.isArray(data)
          ? data.filter((item) => !item.isRead).length
          : 0;

        // Mise à jour du compteur affiché dans le menu
        setUnreadNotifications(unread);
      } catch (error) {
        // En cas d'erreur, on affiche l'erreur dans la console
        console.error("Failed to load notification count:", error);

        // Le compteur est remis à zéro pour éviter un affichage incorrect
        setUnreadNotifications(0);
      }
    };

    fetchUnreadNotifications();
  }, [user?.id]);

  /**
   * Redirige l'utilisateur vers une page donnée.
   *
   * Cette fonction ferme également le menu mobile après navigation.
   *
   * @param {string} path Route vers laquelle rediriger l'utilisateur
   */
  const goTo = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  /**
   * Déconnecte l'utilisateur après confirmation.
   *
   * Les informations de l'utilisateur sont supprimées du localStorage,
   * puis l'utilisateur est redirigé vers la page de connexion.
   */
  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100">
      {/* En-tête principal de l'application */}
      <header className="bg-[#0b2a55] text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo / nom de l'application */}
            <h1
              className="text-xl font-bold cursor-pointer shrink-0"
              onClick={() => goTo("/dashboard")}
            >
              HRIS
            </h1>

            {/* Menu de navigation desktop */}
            <nav className="hidden lg:flex items-center gap-5 text-sm">
              <NavButton onClick={() => goTo("/dashboard")}>Dashboard</NavButton>

              <NavButton onClick={() => goTo("/leaves")}>
                {isAdmin ? "Leave Requests" : "My Leaves"}
              </NavButton>

              <NavButton onClick={() => goTo("/calendar")}>Calendar</NavButton>

              <NavButton onClick={() => goTo("/documents")}>Documents</NavButton>

              <NavButton onClick={() => goTo("/profile")}>Profile</NavButton>

              {/* Bouton des notifications avec badge */}
              <button
                onClick={() => goTo("/notifications")}
                className="relative hover:text-blue-200 transition"
                title="Notifications"
              >
                🔔
                {unreadNotifications > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Lien visible uniquement pour les administrateurs */}
              {isAdmin && (
                <button
                  onClick={() => goTo("/admin/collaborators")}
                  className="bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition font-semibold"
                >
                  Collaborators
                </button>
              )}
            </nav>

            {/* Zone utilisateur desktop */}
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <span className="font-medium max-w-[180px] truncate">
                {fullName}
              </span>

              <button
                onClick={handleLogout}
                className="text-red-300 hover:text-red-200 transition"
              >
                Logout
              </button>
            </div>

            {/* Bouton d'ouverture du menu mobile */}
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="lg:hidden rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/20 transition"
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>

          {/* Menu mobile affiché uniquement lorsqu'il est ouvert */}
          {menuOpen && (
            <div className="lg:hidden mt-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <span className="text-sm font-semibold truncate">
                  {fullName}
                </span>

                <button
                  onClick={handleLogout}
                  className="text-sm text-red-300 font-semibold"
                >
                  Logout
                </button>
              </div>

              {/* Navigation mobile */}
              <nav className="grid gap-2 text-sm">
                <MobileButton onClick={() => goTo("/dashboard")}>
                  Dashboard
                </MobileButton>

                <MobileButton onClick={() => goTo("/leaves")}>
                  {isAdmin ? "Leave Requests" : "My Leaves"}
                </MobileButton>

                <MobileButton onClick={() => goTo("/calendar")}>
                  Calendar
                </MobileButton>

                <MobileButton onClick={() => goTo("/documents")}>
                  Documents
                </MobileButton>

                <MobileButton onClick={() => goTo("/profile")}>
                  Profile
                </MobileButton>

                <MobileButton onClick={() => goTo("/notifications")}>
                  Notifications
                  {unreadNotifications > 0 && ` (${unreadNotifications})`}
                </MobileButton>

                {isAdmin && (
                  <MobileButton onClick={() => goTo("/admin/collaborators")}>
                    Collaborators
                  </MobileButton>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Contenu principal de la page */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-6 sm:mb-8 break-words">
          {title}
        </h2>

        {/* Affichage du contenu spécifique à chaque page */}
        {children}
      </main>
    </div>
  );
}

/**
 * Bouton de navigation utilisé dans le menu desktop.
 *
 * @param {ReactNode} children Texte du bouton
 * @param {Function} onClick Fonction exécutée au clic
 */
function NavButton({ children, onClick }) {
  return (
    <button onClick={onClick} className="hover:text-blue-200 transition">
      {children}
    </button>
  );
}

/**
 * Bouton de navigation utilisé dans le menu mobile.
 *
 * @param {ReactNode} children Texte du bouton
 * @param {Function} onClick Fonction exécutée au clic
 */
function MobileButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl px-4 py-3 text-left font-semibold hover:bg-white/10 transition"
    >
      {children}
    </button>
  );
}
