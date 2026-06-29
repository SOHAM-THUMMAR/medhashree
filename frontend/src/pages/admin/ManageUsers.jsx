import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, authFetch } from '../../config/api';
import { useSearch } from '../../context/SearchContext';

function ManageUsers() {
    const navigate = useNavigate();
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);
    const [users, setUsers] = useState([]);
    const { debouncedQuery } = useSearch();

    const filteredUsers = debouncedQuery
        ? users.filter(u => u.username.toLowerCase().includes(debouncedQuery) || u.email.toLowerCase().includes(debouncedQuery))
        : users;

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdownId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await authFetch(`${API_BASE}/admin/users`);
                const data = await res.json();
                if (data.success && data.data.length > 0) {
                    setUsers(data.data.map((u) => ({
                        id: u.user_id,
                        username: `@${u.username}`,
                        email: u.email,
                        points: (u.total_points || 0).toLocaleString(),
                        role: u.role,
                        is_active: u.is_active
                    })));
                } else {
                    setUsers([]);
                }
            } catch (err) {
                console.error('Failed to fetch users:', err);
                setUsers([]);
            }
        };
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            const res = await authFetch(`${API_BASE}/admin/users/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole })
            });
            const data = await res.json();
            if (data.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            }
        } catch (err) {
            console.error('Failed to update role:', err);
        }
    };

    const handleToggleActive = async (userId, isActive) => {
        try {
            const res = await authFetch(`${API_BASE}/admin/users/${userId}/active`, {
                method: 'PUT',
                body: JSON.stringify({ is_active: isActive })
            });
            const data = await res.json();
            if (data.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, is_active: isActive } : u));
            }
        } catch (err) {
            console.error('Failed to toggle active:', err);
        }
        setOpenDropdownId(null);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this user?')) return;
        try {
            const res = await authFetch(`${API_BASE}/admin/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setUsers(users.filter(u => u.id !== userId));
            }
        } catch (err) {
            console.error('Failed to delete user:', err);
        }
        setOpenDropdownId(null);
    };

    return (
        <div className="max-w-[1200px] mx-auto text-black dark:text-white pb-12 pt-6 px-4 lg:px-0">

            {/* Banner */}
            <div className="w-full bg-gradient-to-r from-indigo-500/90 via-primary-darker to-brand-dark/50 dark:to-[#090e17] rounded-2xl py-12 px-10 mb-10 shadow-lg relative overflow-hidden">
                <h1 className="font-bold text-3xl md:text-[34px] text-white mb-8 tracking-wide relative z-10">
                    One Centralized Panel for Management
                </h1>
                <div className="flex flex-wrap gap-4 relative z-10">
                    <button onClick={() => navigate('/admin/users')} className="px-6 py-1.5 rounded-full border-2 border-primary-light bg-indigo-500 text-white font-semibold text-sm shadow-md">mange users</button>
                    <button onClick={() => navigate('/admin/content')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">manage Q's</button>
                    <button onClick={() => navigate('/admin/tournaments')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">manage tournaments</button>
                    <button onClick={() => navigate('/admin/reports')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">Reports</button>
                </div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
            </div>

            {/* Table */}
            <div>
                <h2 className="text-lg font-bold mb-4 tracking-wider uppercase text-gray-800 dark:text-white">User Management</h2>
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="border-b border-gray-300 dark:border-gray-700 text-gray-500 dark:text-[#a1a1aa] text-[13px] font-bold tracking-wider uppercase">
                                <th className="py-3 px-2 w-[80px]">Sr . no</th>
                                <th className="py-3 px-4 w-[200px]">Username</th>
                                <th className="py-3 px-4 w-[220px]">Email</th>
                                <th className="py-3 px-4 w-[160px]">Total Points</th>
                                <th className="py-3 px-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user, idx) => (
                                <tr key={user.id} className="border-b border-gray-200 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-2 font-bold text-[15px] text-gray-700 dark:text-gray-300">{idx + 1}</td>
                                    <td className="py-4 px-4 font-semibold text-[15px]">{user.username}</td>
                                    <td className="py-4 px-4 font-medium text-[15px] text-gray-600 dark:text-gray-400">{user.email}</td>
                                    <td className="py-4 px-4 font-semibold text-[15px] text-gray-700 dark:text-gray-300">{user.points}</td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3 relative">
                                            <button onClick={() => handleRoleChange(user.id, 'instructor')}
                                                className="px-4 py-1.5 rounded-full border-2 border-indigo-500 bg-indigo-500/20 dark:bg-primary text-indigo-500 dark:text-white font-bold text-[12px] hover:bg-indigo-500 hover:text-white transition-colors tracking-wide">
                                                upgrade to instructor
                                            </button>
                                            <button onClick={() => handleRoleChange(user.id, 'student')}
                                                className="px-4 py-1.5 rounded-full border-2 border-gray-800 dark:border-gray-300 text-gray-800 dark:text-white font-bold text-[12px] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors tracking-wide">
                                                downgrade to student
                                            </button>
                                            <div className="relative" ref={openDropdownId === user.id ? dropdownRef : null}>
                                                <button onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-indigo-500 bg-indigo-500/20 dark:bg-primary text-indigo-500 dark:text-white font-bold hover:bg-indigo-500 hover:text-white transition-colors">
                                                    +
                                                </button>
                                                {openDropdownId === user.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e2333] border-2 border-white rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col p-2 gap-2">
                                                        <button onClick={() => handleToggleActive(user.id, !user.is_active)}
                                                            className="w-full text-center px-4 py-2 border border-white text-white font-bold text-[13px] bg-primary-darker hover:bg-primary-dark transition-colors rounded-[4px]">
                                                            {user.is_active ? 'Inactive user' : 'Activate user'}
                                                        </button>
                                                        <button onClick={() => handleDeleteUser(user.id)}
                                                            className="w-full text-center px-4 py-2 border border-white text-white font-bold text-[13px] bg-primary-darker hover:bg-primary-dark transition-colors rounded-[4px]">
                                                            Remove user
                                                        </button>
                                                        <button onClick={() => setOpenDropdownId(null)}
                                                            className="w-full text-center px-4 py-2 border border-white text-white font-bold text-[13px] bg-primary-darker hover:bg-primary-dark transition-colors rounded-[4px]">
                                                            Change password
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ManageUsers;