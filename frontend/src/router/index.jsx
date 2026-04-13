import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import LeavesPage from "../pages/leaves/LeavesPage";
import DocumentsPage from "../pages/documents/DocumentsPage";
import PayrollPage from "../pages/payroll/PayrollPage";
import ProfilePage from "../pages/profile/ProfilePage";
import EmployeesPage from "../pages/employees/EmployeesPage";
import CalendarPage from "../pages/calendar/CalendarPage";
import CollaboratorsPage from "../pages/admin/CollaboratorsPage";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminRoute from "../components/AdminRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
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
    path: "/payroll",
    element: (
      <ProtectedRoute>
        <PayrollPage />
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
    path: "/employees",
    element: (
      <ProtectedRoute>
        <AdminRoute>
          <EmployeesPage />
        </AdminRoute>
      </ProtectedRoute>
    ),
  },
]);