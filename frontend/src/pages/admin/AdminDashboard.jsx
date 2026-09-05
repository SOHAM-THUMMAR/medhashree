import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../config/api';

function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalQuizzes: 0,
        activeTournaments: 0,
        pendingReports: 0,
        onlineUsers: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    
    // News creation state
    const [showNewsForm, setShowNewsForm] = useState(false);
    const [newsData, setNewsData] = useState({ title: '', description: '', tag: 'NEW FEATURE' });
    const [newsMessage, setNewsMessage] = useState('');
    const [creatingNews, setCreatingNews] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fix: use relative path — authFetch already prepends API_BASE
                const res = await authFetch('/admin/dashboard');
                const data = await res.json();
                if (data.success) {
                    setStats({
                        totalUsers: data.data.totalUsers || 0,
                        totalQuizzes: data.data.totalQuizzes || 0,
                        activeTournaments: data.data.activeTournaments || 0,
                        pendingReports: data.data.pendingReports || 0,
                        onlineUsers: data.data.onlineUsers || 0
                    });
                    setRecentActivity(data.data.recentActivity || []);
                }
            } catch (err) {
                console.error('Failed to fetch admin dashboard:', err);
            }
        };
        fetchStats();
    }, []);

    const handleCreateNews = async () => {
        if (!newsData.title.trim() || !newsData.description.trim()) {
            setNewsMessage('Title and description are required');
            return;
        }
        setCreatingNews(true);
        setNewsMessage('');
        try {
            const res = await authFetch('/news', {
                method: 'POST',
                body: JSON.stringify(newsData)
            });
            const data = await res.json();
            if (data.success) {
                setNewsMessage('News published successfully!');
                setNewsData({ title: '', description: '', tag: 'NEW FEATURE' });
                setTimeout(() => {
                    setShowNewsForm(false);
                    setNewsMessage('');
                }, 2000);
            } else {
                setNewsMessage(data.message || 'Failed to create news');
            }
        } catch {
            setNewsMessage('Failed to connect to server');
        } finally {
            setCreatingNews(false);
        }
    };

    return (
        <div className="max-w-[1400px]">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-indigo-500">Admin Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">Overview of Medhashree platform metrics & security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white dark:bg-brand-surfaceAlt p-6 rounded-2xl shadow-sm border border-emerald-500/30">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span> Online Now
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1 text-emerald-400">{stats.onlineUsers.toLocaleString()}</div>
                    <div className="text-gray-500 text-sm">Active Concurrent Users</div>
                </div>

                <div className="bg-white dark:bg-brand-surfaceAlt p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">Users</div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.totalUsers.toLocaleString()}</div>
                    <div className="text-gray-500 text-sm">Total Registered Users</div>
                </div>

                <div className="bg-white dark:bg-brand-surfaceAlt p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">Quizzes</div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.totalQuizzes.toLocaleString()}</div>
                    <div className="text-gray-500 text-sm">Total Quizzes Created</div>
                </div>

                <div className="bg-white dark:bg-brand-surfaceAlt p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg">Tournaments</div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.activeTournaments}</div>
                    <div className="text-gray-500 text-sm">Active Tournaments</div>
                </div>

                <div className="bg-white dark:bg-brand-surfaceAlt p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">Reports</div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.pendingReports}</div>
                    <div className="text-gray-500 text-sm">Pending Bug Reports</div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-brand-surfaceAlt p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => navigate('/admin/activity-logs')}
                            className="p-4 border border-indigo-500/40 bg-indigo-500/10 rounded-xl hover:bg-indigo-500/20 transition-colors flex flex-col items-center justify-center gap-2 text-center text-sm font-bold text-indigo-400 col-span-2 md:col-span-1"
                        >
                            <span className="text-2xl">📋</span>
                            <span>Activity Logs & Alerts</span>
                        </button>

                        <button
                            onClick={() => navigate('/admin/users')}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252e3f] transition-colors flex flex-col items-center justify-center gap-2 text-center text-sm font-medium"
                        >
                            <span className="text-2xl">👥</span>Manage Users
                        </button>
                        <button
                            onClick={() => navigate('/admin/content')}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252e3f] transition-colors flex flex-col items-center justify-center gap-2 text-center text-sm font-medium"
                        >
                            <span className="text-2xl">📝</span>Manage Questions
                        </button>
                        <button
                            onClick={() => navigate('/admin/self-study')}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252e3f] transition-colors flex flex-col items-center justify-center gap-2 text-center text-sm font-medium"
                        >
                            <span className="text-2xl">📂</span>Self Study
                        </button>
                        <button
                            onClick={() => navigate('/admin/tournaments')}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252e3f] transition-colors flex flex-col items-center justify-center gap-2 text-center text-sm font-medium"
                        >
                            <span className="text-2xl">🏆</span>Tournaments
                        </button>
                        <button
                            onClick={() => navigate('/admin/create-tournament')}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252e3f] transition-colors flex flex-col items-center justify-center gap-2 text-center text-sm font-medium text-[#c084fc] border-purple-500/30"
                        >
                            <span className="text-2xl">👑</span>Create Tournament
                        </button>
                        <button
                            onClick={() => navigate('/create')}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-blue-50 dark:bg-indigo-500/10 border-blue-200 dark:border-indigo-500/30 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center gap-2 text-center text-sm font-medium text-indigo-500"
                        >
                            <span className="text-2xl">📤</span>Bulk Upload CSV
                        </button>
                        <button
                            onClick={() => navigate('/admin/upload-solved')}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252e3f] transition-colors flex flex-col items-center justify-center gap-2 text-center text-sm font-medium text-emerald-500 border-emerald-500/30"
                        >
                            <span className="text-2xl">📄</span>Upload PYQ
                        </button>
                        <button
                            onClick={() => navigate('/admin/content?tab=fixed&action=new')}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252e3f] transition-colors flex flex-col items-center justify-center gap-2 text-center text-sm font-medium text-fuchsia-500 border-fuchsia-500/30"
                        >
                            <span className="text-2xl">🎯</span>Setup Explore Quiz
                        </button>
                        <button
                            onClick={() => setShowNewsForm(!showNewsForm)}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/30 hover:bg-green-100 transition-colors flex flex-col items-center justify-center gap-2 text-center text-sm font-medium text-green-600 dark:text-green-400"
                        >
                            <span className="text-2xl">📰</span>Create News
                        </button>
                        <button
                            onClick={() => navigate('/admin/reports')}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252e3f] transition-colors flex flex-col items-center justify-center gap-2 text-center text-sm font-medium"
                        >
                            <span className="text-2xl">🐛</span>Bug Reports
                        </button>
                        <button
                            onClick={() => navigate('/admin/settings')}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252e3f] transition-colors flex flex-col items-center justify-center gap-2 text-center text-sm font-medium"
                        >
                            <span className="text-2xl">⚙️</span>Site Settings
                        </button>
                    </div>

                    {/* Create News Form */}
                    {showNewsForm && (
                        <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-[#111827]">
                            <h3 className="font-bold mb-4 text-lg">Create News / Announcement</h3>
                            
                            {newsMessage && (
                                <div className={`text-sm font-semibold mb-4 p-2 rounded ${newsMessage.includes('success') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {newsMessage}
                                </div>
                            )}
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold mb-1 block">Title</label>
                                    <input
                                        type="text"
                                        value={newsData.title}
                                        onChange={(e) => setNewsData({ ...newsData, title: e.target.value })}
                                        className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. New Feature: Dark Mode"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold mb-1 block">Description</label>
                                    <textarea
                                        value={newsData.description}
                                        onChange={(e) => setNewsData({ ...newsData, description: e.target.value })}
                                        className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                                        placeholder="Describe the update..."
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold mb-1 block">Tag</label>
                                    <select
                                        value={newsData.tag}
                                        onChange={(e) => setNewsData({ ...newsData, tag: e.target.value })}
                                        className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="NEW FEATURE">NEW FEATURE</option>
                                        <option value="UI IMPROVEMENT">UI IMPROVEMENT</option>
                                        <option value="PERFORMANCE">PERFORMANCE</option>
                                        <option value="BUG FIX">BUG FIX</option>
                                        <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                                    </select>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCreateNews}
                                        disabled={creatingNews}
                                        className="bg-indigo-500 hover:bg-primary disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
                                    >
                                        {creatingNews ? 'Publishing...' : 'Publish News'}
                                    </button>
                                    <button
                                        onClick={() => { setShowNewsForm(false); setNewsMessage(''); }}
                                        className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-brand-surfaceAlt p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
                    <div className="space-y-4">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((item, i) => (
                                <div key={i} className="flex gap-4 border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-primary-dark shrink-0 flex items-center justify-center text-white font-bold text-sm">
                                        {(item.username || item.full_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm">
                                            <span className="font-semibold text-black dark:text-white">
                                                {item.username || item.full_name || 'User'}
                                            </span>{' '}
                                            {item.title || 'performed an action'}
                                        </p>
                                        <span className="text-xs text-gray-500">
                                            {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 text-sm py-6">No recent activity</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;