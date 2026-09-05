import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Reusable Admin Navigation Banner Component
 * Standardized across all Admin Workspace pages for a premium, unified dark UI layout
 */
export default function AdminNavBanner({ title = 'Admin Workspace', subtitle = 'Centralized Control Panel' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Manage Users', icon: '👥' },
    { path: '/admin/content', label: 'Manage Questions', icon: '⚡' },
    { path: '/admin/tournaments', label: 'Tournaments', icon: '🏆' },
    { path: '/admin/activity-logs', label: 'Activity Logs', icon: '📋' },
    { path: '/admin/reports', label: 'Bug Reports', icon: '🚨' },
    { path: '/admin/settings', label: 'System Settings', icon: '⚙️' }
  ];

  return (
    <div className="relative w-full bg-gradient-to-r from-indigo-900/60 via-purple-950/70 to-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 lg:p-8 shadow-2xl overflow-hidden backdrop-blur-md mb-8">
      <div className="relative z-10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-semibold text-xs tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Admin Workspace
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {subtitle}
          </p>
        </div>

        {/* Top Navigation Bar Pills */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all transform active:scale-95 ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-lg shadow-white/10'
                    : 'bg-white/5 hover:bg-white/15 border border-white/20 text-white backdrop-blur-sm hover:border-white/40'
                }`}
              >
                <span>{item.icon}</span> {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ambient Glow Graphic */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );
}
