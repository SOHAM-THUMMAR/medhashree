import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { API_BASE } from "../config/api";
import AuthMarketingPane from "../components/AuthMarketingPane";

function AuthLayout() {
    const [settings, setSettings] = useState({
        brand_logo_text: 'MEDHASHREE',
        brand_logo_badge: 'League',
        auth_left_title: 'Sharpen Your\nEngineering Edge',
        auth_left_subtitle: 'Dive deep into core technical assessments. Compete live inside professional environments, secure your rank on our global leaderboard, and gain instant, audited feedback.',
        landing_tournament_1_icon: '⚛️',
        landing_tournament_1_name: 'React Mastermind League',
        landing_tournament_1_desc: 'React 19 Server Components, concurrent renders, and custom hooks.',
        landing_tournament_2_icon: '⚡',
        landing_tournament_2_name: 'JavaScript Champions Cup',
        landing_tournament_2_desc: 'Event loops, macro/micro task queues, and memory allocations.',
        landing_tournament_3_icon: '🗄️',
        landing_tournament_3_name: 'Database Titans Arena',
        landing_tournament_3_desc: 'LATERAL subqueries, index structures, and storage optimizations.'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE}/site-settings`);
                const data = await res.json();
                if (data.success && data.data) {
                    setSettings(prev => ({
                        ...prev,
                        ...data.data
                    }));
                }
            } catch (err) {
                console.error("Failed to load site settings in AuthLayout:", err);
            }
        };
        fetchSettings();
    }, []);

    return (
        <div className="min-h-screen bg-[#080710] text-white flex select-none relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 blur-[130px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[130px] rounded-full pointer-events-none"></div>

            {/* Left Split Pane: Shared Reusable Visual/Marketing Brand Display */}
            <AuthMarketingPane settings={settings} />

            {/* Right Split Pane: Auth Card container */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-md bg-[#0f0e1d]/70 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative">
                    {/* Visual subtle card glow */}
                    <div className="absolute -top-[1px] left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                    
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;