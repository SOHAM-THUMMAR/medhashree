import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && userString) {
        let isRoleAllowed = true;
        let isJsonValid = true;

        try {
            const user = JSON.parse(userString);
            if (!allowedRoles.includes(user.role)) {
                isRoleAllowed = false;
            }
        } catch {
            isJsonValid = false;
        }

        if (!isJsonValid) {
            return <Navigate to="/login" replace />;
        }

        if (!isRoleAllowed) {
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
}
