import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const authToken = localStorage.getItem("authToken");

  if (!authToken) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}