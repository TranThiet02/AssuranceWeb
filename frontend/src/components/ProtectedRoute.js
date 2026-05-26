import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const spinnerStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#0f172a",
};

const dotStyle = {
  width: 32, height: 32,
  border: "2px solid #1e3a5f",
  borderTopColor: "#3b82f6",
  borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
};

export default function ProtectedRoute({ roles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={spinnerStyle}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={dotStyle} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles.length > 0 && !roles.includes(user.role)) {
    const dashboards = { admin: "/admin/users", staff: "/staff/dashboard", customer: "/customer/dashboard" };
    return <Navigate to={dashboards[user.role] || "/login"} replace />;
  }

  return <Outlet />;
}