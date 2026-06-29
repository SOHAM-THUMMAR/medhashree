import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';

function Profile() {
    const [activeTab, setActiveTab] = useState('Activity');
    
    // Pre-fill from localStorage immediately (avoids flash of login prompt)
    const storedUser = localStorage.getItem('user');
    const localUser = storedUser ? JSON.parse(storedUser) : null;

    const [user, setUser] = useState(localUser);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(!!localUser);

    useEffect(() => {
        if (!localUser) return;

        const userId = localUser.user_id;

        const fetchUserData = async () => {
            try {
                const profileRes = await fetch(`${API_BASE}/users/${userId}`);
                const profileData = await profileRes.json();
                
                const statsRes = await fetch(`${API_BASE}/users/stats/${userId}`);
                const statsData = await statsRes.json();

                if (profileData.success) setUser({ ...localUser, ...profileData.data });
                if (statsData.success) setStats(statsData.data);
            } catch (err) {
                console.error("Failed to fetch profile data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Get the first letter of the user's name for the avatar
    const getInitial = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };

    if (loading) {
        return <div className="text-gray-900 dark:text-white text-center mt-20 font-medium">Loading profile...</div>;
    }

    if (!user) {
        return <div className="text-gray-900 dark:text-white text-center mt-20 font-medium">Please log in to view your profile.</div>;
    }

    return (
        <div className="max-w-[1200px] mx-auto text-gray-900 dark:text-white pb-20 pt-6 px-4 md:px-6">

            {/* Top User Banner */}
            <div className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 rounded-3xl p-8 mb-10 shadow-xl relative overflow-hidden border border-indigo-500/10 flex items-center md:items-start gap-6 flex-col md:flex-row">
                {/* Decorative glows */}
                <div className="absolute top-0 right-0 w-[60%] h-full bg-white/10 blur-[120px] rounded-full pointer-events-none"></div>

                {/* Avatar — First Letter of Name */}
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center shrink-0 border-4 border-white/20 shadow-lg relative z-10">
                    <span className="text-white text-4xl font-bold select-none">
                         {getInitial(user.full_name)}
                    </span>
                </div>

                {/* User Info */}
                <div className="flex-1 relative z-10 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                        <h1 className="text-2xl font-bold text-white tracking-wide">{user.full_name}</h1>
                        <span className="border border-white/25 text-white/90 px-3 py-0.5 rounded-full text-xs font-semibold tracking-wider bg-white/10 uppercase">
                            {user.role}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-indigo-200/90 font-medium mb-4">
                        <span>@{user.username}</span>
                        <span className="hidden sm:inline text-indigo-400">•</span>
                        <span>{user.email}</span>
                        <span className="hidden sm:inline text-indigo-400">•</span>
                        <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <div className="inline-block border border-white/20 rounded-full px-4 py-1 bg-white/10 shadow-inner">
                            <span className="font-bold text-white text-sm">{user.total_points || 0}</span>
                            <span className="text-indigo-100 text-xs ml-1 font-medium">Total Points</span>
                        </div>
                        {user.global_rank && (
                            <div className="inline-block border border-yellow-500/30 rounded-full px-4 py-1 bg-yellow-500/10">
                                <span className="font-bold text-yellow-300 text-sm">Rank #{user.global_rank}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Left Column: Activity */}
                <div className="flex-[3]">

                    {/* Activity Tabs */}
                    <div className="bg-gray-100 dark:bg-brand-surfaceAlt rounded-full p-1.5 mb-6 flex w-full max-w-md border border-gray-200/50 dark:border-white/5 shadow-inner">
                        <button
                            className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${activeTab === 'Activity' ? 'bg-white dark:bg-brand-surface text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            onClick={() => setActiveTab('Activity')}
                        >
                            Activity
                        </button>
                        <button
                            className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${activeTab === 'Quizzes Taken' ? 'bg-white dark:bg-brand-surface text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            onClick={() => setActiveTab('Quizzes Taken')}
                        >
                            Quizzes Taken
                        </button>
                    </div>

                    {/* Activity List Container */}
                    <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-brand-surface">
                        {user.activity_feed && user.activity_feed.length > 0 ? (
                            user.activity_feed.map((item, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-5 p-5 ${index !== user.activity_feed.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''} hover:bg-gray-50 dark:hover:bg-white/5 transition-colors`}
                                >
                                    <div className="mt-1">
                                        <span className="text-2xl drop-shadow-md">
                                            {item.activity_type === 'quiz_completed' ? '🏆' : item.activity_type === 'battle_won' ? '⚔️' : '🔥'}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-gray-800 dark:text-gray-200 font-semibold mb-1 tracking-wide text-[15px]">
                                            {item.description}
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                                            {new Date(item.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                No activity recorded yet. Take a quiz to get started!
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column: Stats & Performance */}
                <div className="flex-[2]">
                    <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-7 bg-white dark:bg-brand-surface shadow-sm h-full">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-8 tracking-wide border-b border-gray-100 dark:border-white/5 pb-4">Stats & Performance</h2>

                        {/* Top Stats Grid */}
                        <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                            {/* Win Rate */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                    </svg>
                                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Win Rate (Battles)</span>
                                </div>
                                <div className="text-gray-900 dark:text-white font-bold text-base">{stats?.win_rate || 0} %</div>
                            </div>

                            {/* Total Battles */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-indigo-500 dark:text-indigo-400 text-xs">⚔️</span>
                                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Total Battles</span>
                                </div>
                                <div className="text-gray-900 dark:text-white font-bold text-base">{stats?.total_battles || 0}</div>
                            </div>

                            {/* Wins */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-indigo-500 dark:text-indigo-400 text-xs">🏆</span>
                                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Wins</span>
                                </div>
                                <div className="text-gray-900 dark:text-white font-bold text-base">{stats?.wins || 0}</div>
                            </div>

                            {/* Total Points */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Total Points</span>
                                </div>
                                <div className="text-gray-900 dark:text-white font-bold text-base">{user.total_points || 0}</div>
                            </div>

                            {/* Role */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-indigo-500 dark:text-indigo-400 text-xs font-bold">👤</span>
                                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Role</span>
                                </div>
                                <div className="text-gray-900 dark:text-white font-bold text-base capitalize">{user.role}</div>
                            </div>

                            {/* Member Since */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Member Since</span>
                                </div>
                                <div className="text-gray-900 dark:text-white font-bold text-base">
                                    {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default Profile;