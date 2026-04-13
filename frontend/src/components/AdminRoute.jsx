import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user || !user.roles?.includes("ROLE_ADMIN")) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}