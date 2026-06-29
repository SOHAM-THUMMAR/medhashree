import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && userString) {
        try {
            const user = JSON.parse(userString);
            if (!allowedRoles.includes(user.role)) {
                return <Navigate to="/" replace />;
            }
        } catch (e) {
            return <Navigate to="/login" replace />;
        }
    }

    return <Outlet />;
}
