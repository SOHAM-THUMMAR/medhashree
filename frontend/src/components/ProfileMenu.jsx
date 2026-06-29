import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { dark, setDark } = useTheme();
  const navigate = useNavigate();

  // Get first letter for avatar
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  // Read logged-in user from localStorage
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setOpen(false);
    navigate('/login');
  };

  return (
    <div className="relative">
      {/* Profile Avatar — Initial Letter */}
      <div
        className="w-10 h-10 rounded-full cursor-pointer bg-gradient-to-br from-indigo-500 to-primary-dark flex items-center justify-center border border-white/20 shadow-md"
        onClick={() => setOpen(!open)}
      >
        <span className="text-white text-lg font-bold select-none">{getInitial(user?.full_name)}</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-brand-dark rounded-xl shadow-xl z-50 overflow-hidden">

          {/* User Info */}
          <div className="flex items-center gap-4 p-4 border-b border-gray-300 dark:border-white/10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-primary-dark flex items-center justify-center border border-white/20 shadow-md shrink-0">
              <span className="text-white text-xl font-bold select-none">{getInitial(user?.full_name)}</span>
            </div>
            <div>
              <h3 className="font-semibold text-base">{user?.full_name || 'Guest'}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">@{user?.username || 'unknown'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
            </div>
          </div>

          {/* Menu */}
          <ul className="p-2 space-y-0.5 text-sm">

            <li>
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-blue-500/20 rounded-md">
                  👤
                </div>
                <div>
                  <p className="font-medium leading-tight text-gray-800 dark:text-gray-200">My Profile</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Account settings</p>
                </div>
              </Link>
            </li>

            <li>
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="flex gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-purple-500/20 rounded-md">
                  📊
                </div>
                <div>
                  <p className="font-medium leading-tight text-gray-800 dark:text-gray-200">Dashboard</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your activity and stats</p>
                </div>
              </Link>
            </li>

            {/* My Quizzes - only for admins */}
            {user?.role === 'admin' && (
            <li>
              <Link
                to="/my-quizzes"
                onClick={() => setOpen(false)}
                className="flex gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-indigo-500/20 rounded-md">
                  📝
                </div>
                <div>
                  <p className="font-medium leading-tight text-gray-800 dark:text-gray-200">My Quizzes</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your created quizzes</p>
                </div>
              </Link>
            </li>
            )}

            {/* Admin Panel - only for admins */}
            {user?.role === 'admin' && (
            <li>
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-red-500/20 rounded-md">
                  ⚙️
                </div>
                <div>
                  <p className="font-medium leading-tight text-gray-800 dark:text-gray-200">Admin Panel</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manage platform</p>
                </div>
              </Link>
            </li>
            )}

            {/* Dark Mode */}
            <li className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
              <div className="flex gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-purple-500/20 rounded-md">
                  🌙
                </div>
                <div>
                  <p className="font-medium leading-tight">Dark Mode</p>
                  <p className="text-xs text-gray-400">Toggle theme</p>
                </div>
              </div>

              <button
                onClick={() => setDark(!dark)}
                className={`w-9 h-5 rounded-full relative transition focus:outline-none
                  ${dark ? "bg-indigo-500" : "bg-gray-600"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition
                    ${dark ? "translate-x-4" : ""}`}
                />
              </button>
            </li>
          </ul>

          {/* Logout */}
          <div className="p-3 border-t border-gray-300 dark:border-white/10">
            <button 
              onClick={handleLogout}
              className="w-full bg-red-800 hover:bg-red-700 py-2.5 rounded-lg font-medium text-white"
            >
              ⎋ Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;