import { NavLink, useNavigate } from "react-router-dom";

const getMenuSections = (role) => {
  const sections = [];

  // Admin Section (only for admins!) - Pinned on top!
  if (role === 'admin') {
    sections.push({
      id: "admin",
      title: "ADMIN SECTION",
      items: [
        { name: "Admin Panel", path: "/admin" },
        { name: "Manage Users", path: "/admin/users" },
        { name: "Manage Questions", path: "/admin/content" },
        { name: "Upload Questions", path: "/create" },
        { name: "Upload PYQ", path: "/admin/upload-solved" },
        { name: "Manage Tournament", path: "/admin/tournaments" },
        { name: "Create Tournament", path: "/admin/create-tournament" },
        { name: "Reports", path: "/admin/reports" },
        { name: "Site Settings", path: "/admin/settings" }
      ]
    });
  }

  // Normal Section (for all users!)
  const normalItems = [
    { name: "Home", path: "/dashboard" },
    { name: "Self Study", path: "/self-study" },
    { name: "Explore Q's", path: "/explore" },
    { name: "Solved Papers", path: "/solved-papers" },
    { name: "Quiz Tournament", path: "/tournaments" },
    // { name: "Quiz Battle", path: "/battle" },
    { name: "News & Update", path: "/news" },
    // { name: "Leaderboard", path: "/leaderboard" },
  ];



  sections.push({
    id: "normal",
    title: "NORMAL SECTION",
    items: normalItems
  });

  return sections;
};

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  // Read real user role from localStorage
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userRole = user?.role || 'student';
  const menuSections = getMenuSections(userRole);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNavClick = () => {
    // Close sidebar on mobile when a nav link is clicked
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside aria-label="Main navigation" className={`w-64 bg-white dark:bg-brand-surface border-r border-gray-200 dark:border-white/10 p-5 text-black dark:text-white fixed left-0 top-0 h-screen overflow-y-auto z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent italic tracking-wider">
            MEDHASHREE
          </h2>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:hover:text-white text-2xl p-1"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col justify-between h-[calc(100%-80px)]">
          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
            {menuSections.map((section, index) => (
              <div key={section.id} className="space-y-2.5">
                {/* Visual Separator Bar between sections */}
                {index > 0 && (
                  <div className="border-t border-gray-200 dark:border-white/10 my-4 mx-4" />
                )}

                {/* Section Header */}
                <div className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400/80 uppercase px-4 border-b border-gray-200 dark:border-white/5 pb-1">
                  {section.title}
                </div>
                
                {/* Section Items */}
                <ul className="space-y-1 text-[13px] font-semibold">
                  {section.items.map((item) => (
                    <li key={item.name}>
                      <NavLink
                        to={item.path}
                        onClick={handleNavClick}
                        className={({ isActive }) => {
                          const baseClasses = "block px-4 py-2.5 rounded-xl transition-all duration-200 text-center font-bold active:scale-95";
                          if (isActive) {
                            return `${baseClasses} bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20`;
                          }
                          return `${baseClasses} text-gray-600 dark:text-[#a1a1aa] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400`;
                        }}
                      >
                        {item.name === "Manage Questions" ? (
                          <>Manage<br />Questions</>
                        ) : item.name === "Manage Tournament" ? (
                          <>Manage<br />Tournament</>
                        ) : item.name === "Create Tournament" ? (
                          <>Create<br />Tournament</>
                        ) : item.name === "Site Settings" ? (
                          <>Site<br />Settings</>
                        ) : (
                          item.name
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-4 mt-auto">
            <button
              onClick={handleLogout}
              className="block w-full px-4 py-2.5 rounded-xl text-gray-600 dark:text-[#a1a1aa] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors text-[13px] font-bold border border-transparent hover:border-red-500/20"
            >
              <div className="flex items-center justify-center gap-2">
                <span>Logout Door</span>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
