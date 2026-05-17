import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import ChangePasswordPage from "../pages/auth/ChangePasswordPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import LeavesPage from "../pages/leaves/LeavesPage";
import DocumentsPage from "../pages/documents/DocumentsPage";

import ProfilePage from "../pages/profile/ProfilePage";

import CalendarPage from "../pages/calendar/CalendarPage";
import CollaboratorsPage from "../pages/admin/CollaboratorsPage";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminRoute from "../components/AdminRoute";
import NotificationsPage from "../pages/notifications/NotificationsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/change-password",
    element: <ChangePasswordPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/leaves",
    element: (
      <ProtectedRoute>
        <LeavesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/documents",
    element: (
      <ProtectedRoute>
        <DocumentsPage />
      </ProtectedRoute>
    ),
  },
  
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/calendar",
    element: (
      <ProtectedRoute>
        <CalendarPage />
      </ProtectedRoute>
    ),
  },
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
 
  {
  path: "/notifications",
  element: (
    <ProtectedRoute>
      <NotificationsPage />
    </ProtectedRoute>
  ),
},
]);