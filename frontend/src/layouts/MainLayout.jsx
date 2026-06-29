import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { SearchProvider } from "../context/SearchContext";

function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <SearchProvider>
            <div className="bg-white dark:bg-brand-dark text-black dark:text-white min-h-screen">
                {/* Skip Navigation Link (visually hidden until focused) */}
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-semibold"
                >
                    Skip to main content
                </a>

                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Right side */}
                <div className="lg:ml-64 pt-20">
                    <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

                    {/* Scrollable content */}
                    <main id="main-content" className="px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-80px)] overflow-y-auto" role="main">
                        <Outlet />
                    </main>
                </div>
            </div>
        </SearchProvider>
    );
}

export default MainLayout;