import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MessagesPanel from "./MessagesPanel";
import NotificationsPanel from "./NotificationsPanel";
import ProfileMenu from "./ProfileMenu";
import { useTheme } from "../context/ThemeContext";
import { useSearch } from "../context/SearchContext";
import { API_BASE } from "../config/api";


function Topbar({ onMenuToggle }) {
  const [showMessages, setShowMessages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { dark, setDark } = useTheme();
  const { searchQuery, setSearchQuery } = useSearch();
  const [latestNews, setLatestNews] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_BASE}/news/latest`);
        const data = await res.json();
        if (data.success && data.data) {
          setLatestNews(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch latest news:", err);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="fixed top-0 left-0 lg:left-64 right-0 h-20 bg-white dark:bg-brand-dark border-b border-gray-200 dark:border-white/10 px-4 sm:px-8 flex items-center justify-between z-40">

      {/* Hamburger menu button - mobile only */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-surfaceAlt border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors shrink-0 mr-2"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1 max-w-md flex flex-col justify-center">
        <label htmlFor="search-quizzes" className="sr-only">Search quizzes</label>
        <input
          id="search-quizzes"
          placeholder="Search quizzes, categories, creators..."
          className="bg-gray-100 dark:bg-brand-surfaceAlt border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white px-4 py-2 rounded-xl w-full outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Icons */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Report Bug Button - hide text on very small screens */}
        <Link
          to="/report-bug"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 transition-colors mr-1 sm:mr-2 shadow-md shadow-indigo-500/10 whitespace-nowrap"
        >
          <span className="hidden sm:inline">report bug</span>
          <svg className="w-4 h-4 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M12 2v4M12 18v4M4 9l3 3M20 9l-3 3M4 17l3-3M20 17l-3-3" />
          </svg>
        </Link>

        {/* Messages */}
        <button
          onClick={() => {
            setShowMessages(!showMessages);
            setShowNotifications(false);
          }}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-brand-surfaceAlt border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          aria-label="Messages"
        >
          <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Notifications */}
        <button
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowMessages(false);
          }}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-brand-surfaceAlt border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="hidden sm:flex w-10 h-10 items-center justify-center bg-gray-100 dark:bg-brand-surfaceAlt border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          aria-label="Toggle theme"
        >
          {dark ? (
            <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Profile */}
        <ProfileMenu />
      </div>

      {showMessages && <MessagesPanel onClose={() => setShowMessages(false)} latestNews={latestNews} />}
      {showNotifications && (
        <NotificationsPanel onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
}

export default Topbar;