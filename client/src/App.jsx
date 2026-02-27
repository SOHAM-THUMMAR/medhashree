import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ExplorePage from "./features/quiz/pages/ExplorePage";

export default function App() {
  return (
    <Routes>

      {/* Auth Layout */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
      </Route>

      {/* Main Layout */}
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="explore" element={<ExplorePage />} />
      </Route>

    </Routes>
  );
}