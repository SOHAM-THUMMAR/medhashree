import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-white text-black">
        <Topbar />
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}