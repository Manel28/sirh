// Import du routeur React Router permettant de gérer la navigation
import { createBrowserRouter } from "react-router-dom";

// Import des pages d'authentification
import LoginPage from "../pages/auth/LoginPage";
import ChangePasswordPage from "../pages/auth/ChangePasswordPage";

// Import des pages principales de l'application
import DashboardPage from "../pages/dashboard/DashboardPage";
import LeavesPage from "../pages/leaves/LeavesPage";
import DocumentsPage from "../pages/documents/DocumentsPage";
import ProfilePage from "../pages/profile/ProfilePage";
import CalendarPage from "../pages/calendar/CalendarPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";

// Import de la page réservée à l'administration
import CollaboratorsPage from "../pages/admin/CollaboratorsPage";

// Import des composants de protection des routes
import ProtectedRoute from "../components/ProtectedRoute";
import AdminRoute from "../components/AdminRoute";

/**
 * Configuration globale des routes de l'application.
 *
 * Chaque route associe :
 * - une URL ;
 * - un composant React ;
 * - éventuellement une protection d'accès.
 */
export const router = createBrowserRouter([
  /**
   * Page de connexion.
   *
   * Accessible sans authentification.
   */
  {
    path: "/",
    element: <LoginPage />,
  },

  /**
   * Page de changement de mot de passe.
   *
   * Utilisée lors de la première connexion
   * ou lorsqu'un changement est obligatoire.
   */
  {
    path: "/change-password",
    element: <ChangePasswordPage />,
  },

  /**
   * Tableau de bord principal.
   *
   * Accessible uniquement aux utilisateurs connectés.
   */
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },

  /**
   * Gestion des congés.
   *
   * Accessible uniquement après authentification.
   */
  {
    path: "/leaves",
    element: (
      <ProtectedRoute>
        <LeavesPage />
      </ProtectedRoute>
    ),
  },

  /**
   * Gestion des documents RH.
   *
   * Accessible uniquement après authentification.
   */
  {
    path: "/documents",
    element: (
      <ProtectedRoute>
        <DocumentsPage />
      </ProtectedRoute>
    ),
  },

  /**
   * Profil utilisateur.
   *
   * Permet de consulter et modifier ses informations personnelles.
   */
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },

  /**
   * Calendrier RH.
   *
   * Accessible uniquement aux utilisateurs connectés.
   */
  {
    path: "/calendar",
    element: (
      <ProtectedRoute>
        <CalendarPage />
      </ProtectedRoute>
    ),
  },

  /**
   * Gestion des collaborateurs.
   *
   * Route réservée aux administrateurs/RH.
   *
   * Double protection :
   * - utilisateur connecté ;
   * - rôle ROLE_ADMIN obligatoire.
   */
  {
    path: "/admin/collaborators",
    element: (
      <ProtectedRoute>
        <AdminRoute>
          <CollaboratorsPage />
        </AdminRoute>
      </ProtectedRoute>
    ),
  },

  /**
   * Centre de notifications.
   *
   * Permet de consulter les notifications reçues
   * et de les marquer comme lues.
   */
  {
    path: "/notifications",
    element: (
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    ),
  },
]);