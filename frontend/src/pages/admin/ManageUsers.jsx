import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, authFetch } from '../../config/api';

function ManageUsers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all"); // 'all', 'admin', 'instructor', 'student'
    const [openRoleDropdownId, setOpenRoleDropdownId] = useState(null);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    
    // Modal states for password change
    const [passwordModalUser, setPasswordModalUser] = useState(null);
    const [newPasswordInput, setNewPasswordInput] = useState("");
    const [modalMessage, setModalMessage] = useState(null);
    const [modalSubmitting, setModalSubmitting] = useState(false);

    const actionMenuRef = useRef(null);
    const roleDropdownRef = useRef(null);

    // Handle outside clicks for dropdowns
    useEffect(() => {
        function handleClickOutside(event) {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
                setOpenActionMenuId(null);
            }
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
                setOpenRoleDropdownId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch Users from API
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_BASE}/admin/users`);
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                setUsers(data.data.map((u) => ({
                    id: u.user_id,
                    fullName: u.full_name || 'User',
                    username: u.username ? (u.username.startsWith('@') ? u.username : `@${u.username}`) : '@user',
                    email: u.email,
                    points: (u.total_points || 0).toLocaleString(),
                    role: (u.role || 'student').toLowerCase(),
                    is_active: u.is_active === 1 || u.is_active === true,
                    created_at: u.created_at
                })));
            } else {
                setUsers([]);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Update Role handler
    const handleRoleChange = async (userId, newRole) => {
        setOpenRoleDropdownId(null);
        try {
            const res = await authFetch(`${API_BASE}/admin/users/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole })
            });
            const data = await res.json();
            if (data.success) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            }
        } catch (err) {
            console.error('Failed to update role:', err);
        }
    };

    // Toggle Active/Inactive status
    const handleToggleActive = async (userId, currentActiveState) => {
        setOpenActionMenuId(null);
        const nextState = !currentActiveState;
        try {
            const res = await authFetch(`${API_BASE}/admin/users/${userId}/active`, {
                method: 'PUT',
                body: JSON.stringify({ is_active: nextState })
            });
            const data = await res.json();
            if (data.success) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: nextState } : u));
            }
        } catch (err) {
            console.error('Failed to toggle active state:', err);
        }
    };

    // Delete User
    const handleDeleteUser = async (userId, userEmail) => {
        setOpenActionMenuId(null);
        if (!window.confirm(`Are you sure you want to permanently remove user ${userEmail}?`)) return;
        try {
            const res = await authFetch(`${API_BASE}/admin/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setUsers(prev => prev.filter(u => u.id !== userId));
            }
        } catch (err) {
            console.error('Failed to delete user:', err);
        }
    };

    // Password change submit handler
    const handlePasswordChangeSubmit = async (e) => {
        e.preventDefault();
        if (!newPasswordInput || newPasswordInput.length < 6) {
            setModalMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
            return;
        }

        setModalSubmitting(true);
        setModalMessage(null);
        try {
            const res = await authFetch(`${API_BASE}/admin/users/${passwordModalUser.id}/password`, {
                method: 'PUT',
                body: JSON.stringify({ newPassword: newPasswordInput })
            });
            const data = await res.json();
            if (data.success) {
                setModalMessage({ type: 'success', text: 'Password updated successfully!' });
                setTimeout(() => {
                    setPasswordModalUser(null);
                    setNewPasswordInput('');
                    setModalMessage(null);
                }, 1200);
            } else {
                setModalMessage({ type: 'error', text: data.error || 'Failed to update password' });
            }
        } catch (err) {
            setModalMessage({ type: 'error', text: 'Server error updating password' });
        } finally {
            setModalSubmitting(false);
        }
    };

    // Derived Statistics
    const activeCount = users.filter(u => u.is_active).length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const instructorCount = users.filter(u => u.role === 'instructor').length;
    const studentCount = users.filter(u => u.role === 'student').length;

    // Filtered user list
    const filteredUsers = users.filter(u => {
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query ||
            u.fullName.toLowerCase().includes(query) ||
            u.username.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query);
        return matchesRole && matchesSearch;
    });

    // Helper for Avatar Background Color Palette
    const getAvatarGradient = (name) => {
        const colors = [
            'from-blue-600 to-indigo-600',
            'from-purple-600 to-pink-600',
            'from-emerald-600 to-teal-600',
            'from-amber-500 to-orange-600',
            'from-cyan-500 to-blue-600',
            'from-rose-600 to-red-600'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
        return colors[Math.abs(hash) % colors.length];
    };

    // Helper for initials
    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="min-h-screen bg-[#090d16] text-white p-4 lg:p-8 font-sans">
            <div className="max-w-[1320px] mx-auto space-y-8">

                {/* 1. Header Banner */}
                <div className="relative w-full bg-gradient-to-r from-indigo-900/60 via-purple-950/70 to-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 lg:p-10 shadow-2xl overflow-hidden backdrop-blur-md">
                    <div className="relative z-10 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-semibold text-xs tracking-wider uppercase">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                            Admin Workspace
                        </div>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                            One Centralized Panel for Management
                        </h1>

                        {/* Top Navigation Bar Pills */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => navigate('/admin/users')}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-950 font-bold text-sm shadow-lg shadow-white/10 hover:bg-slate-100 transition-all transform active:scale-95"
                            >
                                <span>📊</span> Manage Users
                            </button>
                            <button
                                onClick={() => navigate('/admin/content')}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm backdrop-blur-sm transition-all hover:border-white/40"
                            >
                                <span>⚡</span> Manage Questions
                            </button>
                            <button
                                onClick={() => navigate('/admin/tournaments')}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm backdrop-blur-sm transition-all hover:border-white/40"
                            >
                                <span>🏆</span> Tournaments
                            </button>
                            <button
                                onClick={() => navigate('/admin/reports')}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm backdrop-blur-sm transition-all hover:border-white/40"
                            >
                                <span>🚨</span> Reports
                            </button>
                        </div>
                    </div>

                    {/* Ambient Glow Graphic */}
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
                </div>

                {/* 2. Stat Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Active Users */}
                    <div className="bg-[#111726]/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all group">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Active Users</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl lg:text-3xl font-extrabold text-white">{activeCount}</span>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 2: Administrators */}
                    <div className="bg-[#111726]/80 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all group">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Administrators</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl lg:text-3xl font-extrabold text-white">{adminCount}</span>
                                <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Full Access</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 3: Instructors */}
                    <div className="bg-[#111726]/80 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all group">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Instructors</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl lg:text-3xl font-extrabold text-white">{instructorCount}</span>
                                <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">Creators</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 4: Students */}
                    <div className="bg-[#111726]/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all group">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Students</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl lg:text-3xl font-extrabold text-white">{studentCount}</span>
                                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">Learners</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* 3. Filter Bar & Search */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    {/* Role Filter Tabs */}
                    <div className="flex items-center gap-2 bg-[#111726]/80 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
                        <button
                            onClick={() => setRoleFilter("all")}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                                roleFilter === "all"
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            All Users <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">{users.length}</span>
                        </button>
                        <button
                            onClick={() => setRoleFilter("admin")}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                                roleFilter === "admin"
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            Admins <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px]">{adminCount}</span>
                        </button>
                        <button
                            onClick={() => setRoleFilter("instructor")}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                                roleFilter === "instructor"
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            Instructors <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px]">{instructorCount}</span>
                        </button>
                        <button
                            onClick={() => setRoleFilter("student")}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                                roleFilter === "student"
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            Students <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px]">{studentCount}</span>
                        </button>
                    </div>

                    {/* Search Input Box */}
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Search by name, email, or @user..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#111726]/80 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                        />
                        <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* 4. Registered Accounts Data Table */}
                <div className="bg-[#111726]/90 border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
                    {/* Table Title Bar */}
                    <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">Registered Accounts</h2>
                            <p className="text-xs font-medium text-slate-400 mt-1">
                                Double click / click a user's role badge to modify roles instantly.
                            </p>
                        </div>
                        <div className="text-xs font-semibold text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50 self-start sm:self-auto">
                            Showing {filteredUsers.length} of {users.length} users
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[950px]">
                            <thead>
                                <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-900/40">
                                    <th className="py-4 px-6 w-16"># ID</th>
                                    <th className="py-4 px-6">User Profile</th>
                                    <th className="py-4 px-6">Email Address</th>
                                    <th className="py-4 px-6">Score / Points</th>
                                    <th className="py-4 px-6">System Role (Click to Change)</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800/60">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-slate-400 text-sm">
                                            <div className="inline-flex items-center gap-3">
                                                <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></span>
                                                Loading users...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-slate-500 text-sm">
                                            No user accounts match your search or filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u, idx) => {
                                        const formattedId = String(idx + 1).padStart(2, '0');
                                        return (
                                            <tr key={u.id} className="hover:bg-slate-800/40 transition-colors group">
                                                {/* ID */}
                                                <td className="py-4 px-6 text-xs font-mono font-bold text-slate-400">
                                                    {formattedId}
                                                </td>

                                                {/* Profile Avatar + Name + Username */}
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(u.fullName)} flex items-center justify-center font-extrabold text-white text-xs shadow-md border border-white/20 shrink-0`}>
                                                            {getInitials(u.fullName)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                                                                {u.fullName}
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-medium">
                                                                {u.username}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Email Address */}
                                                <td className="py-4 px-6 text-xs font-mono font-medium text-slate-300">
                                                    {u.email}
                                                </td>

                                                {/* Score / Points */}
                                                <td className="py-4 px-6">
                                                    <div className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-xs bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                                                        <span>★</span>
                                                        <span>{u.points} pts</span>
                                                    </div>
                                                </td>

                                                {/* Interactive Role Switcher Dropdown Badge */}
                                                <td className="py-4 px-6 relative">
                                                    <div className="relative inline-block">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenRoleDropdownId(openRoleDropdownId === u.id ? null : u.id);
                                                                setOpenActionMenuId(null);
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full font-extrabold text-[11px] tracking-wider uppercase transition-all flex items-center gap-1.5 border shadow-sm ${
                                                                u.role === 'admin'
                                                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                                                    : u.role === 'instructor'
                                                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                                                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                                            }`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                                u.role === 'admin' ? 'bg-rose-400' : u.role === 'instructor' ? 'bg-purple-400' : 'bg-emerald-400'
                                                            }`}></span>
                                                            {u.role}
                                                            <span className="text-[9px] opacity-70">˅</span>
                                                        </button>

                                                        {/* Role Menu Dropdown */}
                                                        {openRoleDropdownId === u.id && (
                                                            <div
                                                                ref={roleDropdownRef}
                                                                className="absolute left-0 top-full mt-2 w-40 bg-[#161d2f] border border-slate-700 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
                                                            >
                                                                <button
                                                                    onClick={() => handleRoleChange(u.id, 'student')}
                                                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                                                                        u.role === 'student' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                                                    STUDENT
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRoleChange(u.id, 'instructor')}
                                                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                                                                        u.role === 'instructor' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300 hover:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                                                    INSTRUCTOR
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRoleChange(u.id, 'admin')}
                                                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                                                                        u.role === 'admin' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-300 hover:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                                                                    ADMIN
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Active Status Badge */}
                                                <td className="py-4 px-6">
                                                    {u.is_active ? (
                                                        <div className="inline-flex items-center gap-1.5 text-emerald-400 font-extrabold text-[11px] tracking-wider uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                                            ACTIVE
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 text-rose-400 font-extrabold text-[11px] tracking-wider uppercase bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                            INACTIVE
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Action Menu (3 Dots Menu) */}
                                                <td className="py-4 px-6 text-right relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenActionMenuId(openActionMenuId === u.id ? null : u.id);
                                                            setOpenRoleDropdownId(null);
                                                        }}
                                                        className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors font-bold text-base inline-flex"
                                                    >
                                                        ⋮
                                                    </button>

                                                    {/* Dropdown Options */}
                                                    {openActionMenuId === u.id && (
                                                        <div
                                                            ref={actionMenuRef}
                                                            className="absolute right-6 top-full mt-1 w-48 bg-[#161d2f] border border-slate-700 rounded-2xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 text-left"
                                                        >
                                                            <button
                                                                onClick={() => handleToggleActive(u.id, u.is_active)}
                                                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-2"
                                                            >
                                                                <span>{u.is_active ? '⏸️' : '▶️'}</span>
                                                                {u.is_active ? 'Deactivate User' : 'Activate User'}
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setPasswordModalUser(u);
                                                                    setOpenActionMenuId(null);
                                                                    setNewPasswordInput('');
                                                                    setModalMessage(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-2"
                                                            >
                                                                <span>🔑</span> Change Password
                                                            </button>

                                                            <div className="h-px bg-slate-800 my-1"></div>

                                                            <button
                                                                onClick={() => handleDeleteUser(u.id, u.email)}
                                                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                                                            >
                                                                <span>🗑️</span> Delete Account
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* 5. Change Password Modal Popup */}
            {passwordModalUser && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">Change User Password</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Account: {passwordModalUser.email}</p>
                            </div>
                            <button
                                onClick={() => setPasswordModalUser(null)}
                                className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {modalMessage && (
                            <div className={`p-3 rounded-2xl text-xs font-medium border ${
                                modalMessage.type === 'success'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            }`}>
                                {modalMessage.text}
                            </div>
                        )}

                        <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength="6"
                                    placeholder="Enter new password (min 6 chars)..."
                                    value={newPasswordInput}
                                    onChange={(e) => setNewPasswordInput(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPasswordModalUser(null)}
                                    className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalSubmitting}
                                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                                >
                                    {modalSubmitting ? (
                                        <>
                                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Updating...
                                        </>
                                    ) : (
                                        'Save Password'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageUsers;