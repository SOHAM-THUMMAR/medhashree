import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../config/api';
import AdminNavBanner from '../../components/admin/AdminNavBanner';

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
        <div className="min-h-screen bg-[#090d16] text-white p-4 lg:p-8 font-sans">
            <div className="max-w-[1320px] mx-auto space-y-8">
                {/* 1. Unified Admin Navigation Banner */}
                <AdminNavBanner 
                    title="Platform Operational Overview" 
                    subtitle="Real-time control panel, system metrics, security logs, and instant shortcuts" 
                />

                {/* 2. Top Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-[#111726]/80 border border-emerald-500/30 rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all group">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Online Users</span>
                            <div className="text-2xl lg:text-3xl font-extrabold text-emerald-300">{stats.onlineUsers.toLocaleString()}</div>
                            <div className="text-[11px] text-gray-400">Active Concurrent</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                        </div>
                    </div>

                    <div className="bg-[#111726]/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all group">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Users</span>
                            <div className="text-2xl lg:text-3xl font-extrabold text-white">{stats.totalUsers.toLocaleString()}</div>
                            <div className="text-[11px] text-gray-400">Registered Accounts</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            👥
                        </div>
                    </div>

                    <div className="bg-[#111726]/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all group">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Total Quizzes</span>
                            <div className="text-2xl lg:text-3xl font-extrabold text-purple-300">{stats.totalQuizzes.toLocaleString()}</div>
                            <div className="text-[11px] text-gray-400">Active Sets</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                            📝
                        </div>
                    </div>

                    <div className="bg-[#111726]/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all group">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Tournaments</span>
                            <div className="text-2xl lg:text-3xl font-extrabold text-amber-300">{stats.activeTournaments}</div>
                            <div className="text-[11px] text-gray-400">Live Arenas</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            🏆
                        </div>
                    </div>

                    <div className="bg-[#111726]/80 border border-rose-500/20 rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all group">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Bug Reports</span>
                            <div className="text-2xl lg:text-3xl font-extrabold text-rose-400">{stats.pendingReports}</div>
                            <div className="text-[11px] text-gray-400">Pending Review</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                            🚨
                        </div>
                    </div>
                </div>

                {/* 3. Quick Actions & Recent Activity Grid */}
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#111726]/80 border border-slate-800 p-6 lg:p-8 rounded-3xl shadow-xl">
                        <h2 className="text-lg font-bold mb-6 text-slate-100 flex items-center gap-2">
                            ⚡ Quick Operational Actions
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <button
                                onClick={() => navigate('/admin/activity-logs')}
                                className="p-4 border border-indigo-500/40 bg-indigo-500/10 rounded-2xl hover:bg-indigo-500/20 transition-all flex flex-col items-center justify-center gap-2 text-center text-xs font-bold text-indigo-300 col-span-2 sm:col-span-1"
                            >
                                <span className="text-2xl">📋</span>
                                <span>Activity Logs & Audit</span>
                            </button>

                            <button
                                onClick={() => navigate('/admin/users')}
                                className="p-4 border border-slate-800 bg-slate-900/60 rounded-2xl hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center gap-2 text-center text-xs font-semibold text-slate-200"
                            >
                                <span className="text-2xl">👥</span>Manage Users
                            </button>
                            <button
                                onClick={() => navigate('/admin/content')}
                                className="p-4 border border-slate-800 bg-slate-900/60 rounded-2xl hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center gap-2 text-center text-xs font-semibold text-slate-200"
                            >
                                <span className="text-2xl">📝</span>Manage Questions
                            </button>
                            <button
                                onClick={() => navigate('/admin/self-study')}
                                className="p-4 border border-slate-800 bg-slate-900/60 rounded-2xl hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center gap-2 text-center text-xs font-semibold text-slate-200"
                            >
                                <span className="text-2xl">📂</span>Self Study
                            </button>
                            <button
                                onClick={() => navigate('/admin/tournaments')}
                                className="p-4 border border-slate-800 bg-slate-900/60 rounded-2xl hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center gap-2 text-center text-xs font-semibold text-slate-200"
                            >
                                <span className="text-2xl">🏆</span>Tournaments
                            </button>
                            <button
                                onClick={() => navigate('/admin/create-tournament')}
                                className="p-4 border border-purple-500/30 bg-purple-500/10 rounded-2xl hover:bg-purple-500/20 transition-all flex flex-col items-center justify-center gap-2 text-center text-xs font-bold text-purple-300"
                            >
                                <span className="text-2xl">👑</span>Create Tournament
                            </button>
                            <button
                                onClick={() => navigate('/create')}
                                className="p-4 border border-cyan-500/30 bg-cyan-500/10 rounded-2xl hover:bg-cyan-500/20 transition-all flex flex-col items-center justify-center gap-2 text-center text-xs font-bold text-cyan-300"
                            >
                                <span className="text-2xl">📤</span>Bulk Upload CSV
                            </button>
                            <button
                                onClick={() => navigate('/admin/upload-solved')}
                                className="p-4 border border-emerald-500/30 bg-emerald-500/10 rounded-2xl hover:bg-emerald-500/20 transition-all flex flex-col items-center justify-center gap-2 text-center text-xs font-bold text-emerald-300"
                            >
                                <span className="text-2xl">📄</span>Upload PYQ
                            </button>
                            <button
                                onClick={() => setShowNewsForm(!showNewsForm)}
                                className="p-4 border border-amber-500/30 bg-amber-500/10 rounded-2xl hover:bg-amber-500/20 transition-all flex flex-col items-center justify-center gap-2 text-center text-xs font-bold text-amber-300"
                            >
                                <span className="text-2xl">📰</span>Create News
                            </button>
                        </div>

                        {/* Create News Form */}
                        {showNewsForm && (
                            <div className="mt-6 border border-slate-800 rounded-2xl p-6 bg-slate-900/90 shadow-xl">
                                <h3 className="font-bold mb-4 text-base text-slate-100">Publish News / Platform Announcement</h3>
                                
                                {newsMessage && (
                                    <div className={`text-xs font-semibold mb-4 p-3 rounded-xl ${newsMessage.includes('success') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                                        {newsMessage}
                                    </div>
                                )}
                                
                                <div className="space-y-4 text-xs">
                                    <div>
                                        <label className="text-slate-400 font-semibold mb-1 block">Title</label>
                                        <input
                                            type="text"
                                            value={newsData.title}
                                            onChange={(e) => setNewsData({ ...newsData, title: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                                            placeholder="e.g. New Feature: Dark Mode"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-400 font-semibold mb-1 block">Description</label>
                                        <textarea
                                            value={newsData.description}
                                            onChange={(e) => setNewsData({ ...newsData, description: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[90px]"
                                            placeholder="Describe the update..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-400 font-semibold mb-1 block">Tag</label>
                                        <select
                                            value={newsData.tag}
                                            onChange={(e) => setNewsData({ ...newsData, tag: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="NEW FEATURE">NEW FEATURE</option>
                                            <option value="UI IMPROVEMENT">UI IMPROVEMENT</option>
                                            <option value="PERFORMANCE">PERFORMANCE</option>
                                            <option value="BUG FIX">BUG FIX</option>
                                            <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={handleCreateNews}
                                            disabled={creatingNews}
                                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition"
                                        >
                                            {creatingNews ? 'Publishing...' : 'Publish News'}
                                        </button>
                                        <button
                                            onClick={() => { setShowNewsForm(false); setNewsMessage(''); }}
                                            className="bg-slate-800 border border-slate-700 text-slate-300 font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-700 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-[#111726]/80 border border-slate-800 p-6 lg:p-8 rounded-3xl shadow-xl">
                        <h2 className="text-lg font-bold mb-6 text-slate-100 flex items-center gap-2">
                            🕒 Recent Activity Feed
                        </h2>
                        <div className="space-y-4">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 border-b border-slate-800/80 pb-3 last:border-0">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                            {(item.username || item.full_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-slate-200">
                                                <span className="font-bold text-indigo-300">
                                                    {item.username || item.full_name || 'User'}
                                                </span>{' '}
                                                {item.title || 'performed an action'}
                                            </p>
                                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                                                {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-slate-500 text-xs py-8">No recent activity</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;