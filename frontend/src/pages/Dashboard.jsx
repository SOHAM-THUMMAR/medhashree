import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';
import SEOHead from '../components/SEOHead';

function Dashboard() {
    const [stats, setStats] = useState({
        total_quizzes_taken: 0,
        total_score_earned: 0,
        highest_score: 0,
        completed_quizzes: 0,
        global_rank: null,
        current_streak: 0,
        highest_streak: 0,
        subjectActivity: [],
        highestScores: [],
        contestScores: [],
        dailyActivity: [],
        bestSubjects: []
    });
    const [user, setUser] = useState({ full_name: 'Guest' });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            const fetchDashboardData = async () => {
                try {
                    const [dashboardRes, rankRes] = await Promise.all([
                        fetch(`${API_BASE}/users/dashboard/${parsedUser.user_id}`),
                        fetch(`${API_BASE}/leaderboard/rank/${parsedUser.user_id}`)
                    ]);
                    
                    const data = await dashboardRes.json();
                    const rankData = await rankRes.json();
                    
                    if (data.success) {
                        const newStats = { ...data.data };
                        if (rankData.success && rankData.data) {
                            newStats.global_rank = rankData.data.rank;
                        }
                        setStats(newStats);
                    }
                } catch (err) {
                    console.error("Failed to fetch dashboard data", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchDashboardData();
        } else {
            setLoading(false);
        }
    }, []);

    // Helper to generate the last 70 days divided into 10 columns (weeks) x 7 rows (days)
    const generateCalendarGrid = (dailyActivity = []) => {
        const gridDays = [];
        const today = new Date();
        
        // Loop backwards for 70 days to populate dates chronologically (oldest to newest)
        for (let i = 69; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            
            const activity = dailyActivity.find(a => a.date === dateStr);
            const count = activity ? parseInt(activity.count || 0) : 0;
            
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const readableDate = d.toLocaleDateString('en-US', options);
            
            gridDays.push({
                date: dateStr,
                readableDate,
                count
            });
        }
        
        // Chunk into 10 columns of 7 days
        const weeks = [];
        for (let w = 0; w < 10; w++) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                const index = w * 7 + d;
                if (index < gridDays.length) {
                    week.push(gridDays[index]);
                }
            }
            weeks.push(week);
        }
        return weeks;
    };

    const weeks = generateCalendarGrid(stats.dailyActivity);

    // Dynamic date parsing for today's marker
    const todayObj = new Date();
    const todayYYYY = todayObj.getFullYear();
    const todayMM = String(todayObj.getMonth() + 1).padStart(2, '0');
    const todayDD = String(todayObj.getDate()).padStart(2, '0');
    const todayStr = `${todayYYYY}-${todayMM}-${todayDD}`;

    // Dynamic chart data from DB
    const subjectActivity = stats.subjectActivity || [];
    const chartColors = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'];

    // Calculate chart percentages
    const totalQuizzes = subjectActivity.reduce((sum, s) => sum + parseInt(s.quiz_count || 0), 0) || 1;
    const chartSegments = subjectActivity.map((s, i) => ({
        name: s.subject_name || 'Unknown',
        quizzes: parseInt(s.quiz_count || 0),
        color: chartColors[i % chartColors.length],
        percent: Math.round((parseInt(s.quiz_count || 0) / totalQuizzes) * 100)
    }));

    // Build conic-gradient for custom CSS Donut Chart
    let conicGradient = 'conic-gradient(from 0deg, #e2e8f0 0% 100%)';
    if (navigator.userAgent && navigator.userAgent.includes('dark')) {
        conicGradient = 'conic-gradient(from 0deg, #1e293b 0% 100%)';
    }
    if (chartSegments.length > 0) {
        let gradientParts = [];
        let cumulative = 0;
        chartSegments.forEach((s) => {
            gradientParts.push(`${s.color} ${cumulative}% ${cumulative + s.percent}%`);
            cumulative += s.percent;
        });
        if (cumulative < 100) {
            gradientParts.push(`rgb(var(--brand-dark)) ${cumulative}% 100%`);
        }
        conicGradient = `conic-gradient(from 0deg, ${gradientParts.join(', ')})`;
    }

    const highestScores = stats.highestScores || [];
    const contestScores = stats.contestScores || [];

    return (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-6 pb-20 text-black dark:text-white">
            <SEOHead title="Dashboard" description="View your personalized quiz dashboard, stats, daily streak, and progress on Medhashree." />
            <style>{`
                @keyframes pulse-flame {
                    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(239,68,68,0.4)); }
                    50% { transform: scale(1.08); filter: drop-shadow(0 0 16px rgba(249,115,22,0.7)); }
                }
                .animate-flame {
                    animation: pulse-flame 2s infinite ease-in-out;
                    transform-origin: center;
                }
                .scrollbar-thin::-webkit-scrollbar {
                    height: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.2);
                    border-radius: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.4);
                }
            `}</style>

            {/* Welcome Banner */}
            <div className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-[#0a0e18] rounded-2xl p-8 md:p-10 mb-8 shadow-xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 relative z-10">Welcome Back, {user.full_name}</h1>
                <p className="text-indigo-200 text-sm mb-6 relative z-10">Here is your comprehensive study breakdown</p>

                <div className="flex flex-wrap gap-3 relative z-10">
                    <span className="flex items-center gap-2 border border-white/30 bg-white/10 rounded-xl px-4 py-1.5 text-sm font-semibold backdrop-blur-sm text-white">
                        <svg className="w-4 h-4 text-indigo-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        Total Quizzes: {stats.total_quizzes_taken}
                    </span>
                    <span className="flex items-center gap-2 border border-white/30 bg-white/10 rounded-xl px-4 py-1.5 text-sm font-semibold backdrop-blur-sm text-white">
                        <svg className="w-4 h-4 text-indigo-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 20V10M12 20V4M6 20v-6" />
                        </svg>
                        Global Rank: #{stats.global_rank || 'N/A'}
                    </span>
                    <span className="flex items-center gap-2 border border-white/30 bg-white/10 rounded-xl px-4 py-1.5 text-sm font-semibold backdrop-blur-sm text-white">
                        <svg className="w-4 h-4 text-indigo-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7s0 6 8 10z" />
                        </svg>
                        Current Points: {stats.total_score_earned}
                    </span>
                </div>
            </div>

            {/* Solved Papers Quick Access Banner */}
            <div 
                onClick={() => navigate('/solved-papers')}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-700 to-black hover:opacity-95 cursor-pointer rounded-2xl p-6 sm:p-8 mb-8 shadow-md border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left transition-all duration-200"
            >
                <div>
                    <span className="bg-white/15 border border-white/25 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                        PREVIOUS YEAR SOLVED PAPERS ARCHIVE
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-3 leading-snug">
                        Explore Verified Solved Papers
                    </h2>
                    <p className="text-emerald-100 text-xs mt-1 max-w-xl font-light">
                        Study step-by-step logic, micro-hints, and detailed mathematical explanations compiled by experts.
                    </p>
                </div>
                <button className="bg-white text-emerald-800 font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 hover:gap-3 transition-all shrink-0">
                    Explore PYQs 
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>
            </div>

            {/* Top Row: Streaks & Consistency Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Streaks Panel */}
                <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-gray-50 dark:bg-brand-surfaceAlt shadow-sm dark:shadow-none flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Practice Streaks</h3>
                        
                        <div className="flex flex-col gap-4">
                            {/* Current Streak */}
                            <div className="bg-white dark:bg-brand-surface border border-gray-200 dark:border-white/10 shadow-sm rounded-xl p-4 flex items-center gap-4">
                                <div className="relative w-12 h-12 flex items-center justify-center bg-orange-500/10 dark:bg-orange-500/20 rounded-xl">
                                    <svg className="w-8 h-8 animate-flame shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                                                <stop offset="0%" stopColor="#ef4444" />
                                                <stop offset="60%" stopColor="#f97316" />
                                                <stop offset="100%" stopColor="#fbbf24" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M12 2C12 2 17 6.5 17 11.5C17 14.5386 14.5386 17 11.5 17C8.46142 17 6 14.5386 6 11.5C6 7.5 10 3 10 3C10 3 9 6 9 8.5C9 10.5 10 11.5 11 11.5C12 11.5 12 2 12 2Z" fill="url(#flameGrad)" stroke="none" />
                                        <path d="M12 6C12 6 14.5 9 14.5 12C14.5 13.6569 13.1569 15 11.5 15C9.84315 15 8.5 13.6569 8.5 12C8.5 9.5 10.5 7.5 10.5 7.5C10.5 7.5 10 9 10 10.5C10 11.5 10.5 12 11 12C11.5 12 12 6 12 6Z" fill="#ffedd5" opacity="0.8" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Current Streak</div>
                                    <div className="text-gray-900 dark:text-white text-2xl font-black">{stats.current_streak} {stats.current_streak === 1 ? 'Day' : 'Days'}</div>
                                </div>
                            </div>

                            {/* Highest Streak */}
                            <div className="bg-white dark:bg-brand-surface border border-gray-200 dark:border-white/10 shadow-sm rounded-xl p-4 flex items-center gap-4">
                                <div className="relative w-12 h-12 flex items-center justify-center bg-yellow-500/10 dark:bg-yellow-500/20 rounded-xl">
                                    <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="trophyGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#d97706" />
                                                <stop offset="50%" stopColor="#eab308" />
                                                <stop offset="100%" stopColor="#fef08a" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M6 9H4.5A2.5 2.5 0 012 6.5V6a2 2 0 012-2h2v5zm12 0h1.5A2.5 2.5 0 0022 6.5V6a2 2 0 00-2-2h-2v5z" fill="url(#trophyGrad)" opacity="0.6" />
                                        <path d="M18 2H6v10c0 3.3137 2.6863 6 6 6s6-2.6863 6-6V2z" fill="url(#trophyGrad)" />
                                        <path d="M12 18v3m-4 0h8" stroke="url(#trophyGrad)" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Highest Streak</div>
                                    <div className="text-gray-900 dark:text-white text-2xl font-black">{stats.highest_streak} {stats.highest_streak === 1 ? 'Day' : 'Days'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-4 font-light leading-snug">
                        Keep practicing daily to secure your rank and continue expanding your consistency.
                    </p>
                </div>

                {/* Consistency Heatmap Grid */}
                <div className="lg:col-span-2 border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-gray-50 dark:bg-brand-surfaceAlt shadow-sm dark:shadow-none flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Consistency Grid</h3>
                            <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold">Last 10 Weeks (70 Days)</span>
                        </div>

                        {loading ? (
                            <div className="text-gray-400 text-sm">Loading activity data...</div>
                        ) : (
                            <div className="w-full overflow-x-auto scrollbar-thin pb-4">
                                {weeks.length > 0 ? (
                                    <div className="flex gap-1.5 justify-between min-w-[320px]">
                                        {weeks.map((week, wIdx) => (
                                            <div key={wIdx} className="flex flex-col gap-1.5 shrink-0">
                                                {week.map((day) => {
                                                    const isToday = day.date === todayStr;
                                                    let colorClass = 'bg-slate-200 dark:bg-white/5 border border-transparent dark:border-white/5 hover:border-slate-400 dark:hover:border-white/20';
                                                    if (day.count === 1) {
                                                        colorClass = 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/10 hover:border-indigo-400';
                                                    } else if (day.count === 2) {
                                                        colorClass = 'bg-indigo-500/50 text-indigo-200 border border-indigo-500/30 hover:border-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.2)]';
                                                    } else if (day.count >= 3) {
                                                        colorClass = 'bg-indigo-500 text-white border border-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.6)] hover:scale-[1.1] transition-transform duration-100';
                                                    }
                                                    
                                                    return (
                                                        <div
                                                            key={day.date}
                                                            className={`w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-md transition-all duration-200 relative group cursor-pointer ${colorClass} ${
                                                                isToday ? 'ring-2 ring-indigo-500/80 ring-offset-2 ring-offset-white dark:ring-offset-brand-dark' : ''
                                                            }`}
                                                        >
                                                            {/* Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block z-50 pointer-events-none">
                                                                <div className="bg-white dark:bg-brand-surface border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap backdrop-blur-md">
                                                                    <span className="block text-indigo-600 dark:text-indigo-400 text-center font-bold">
                                                                        {day.count} {day.count === 1 ? 'Quiz' : 'Quizzes'} Completed
                                                                    </span>
                                                                    <span className="block text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">
                                                                        {day.readableDate}
                                                                    </span>
                                                                </div>
                                                                <div className="w-2 h-2 bg-white dark:bg-brand-surface border-r border-b border-gray-200 dark:border-white/10 rotate-45 left-1/2 -translate-x-1/2 -mt-1.5 absolute"></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-xs">No activity record found.</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 mt-2 sm:mt-0 font-medium">
                        <span>Chronological Progress &rarr;</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-gray-400 dark:text-gray-500">Less</span>
                            <span className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-white/5 border border-transparent dark:border-white/5"></span>
                            <span className="w-3.5 h-3.5 rounded bg-indigo-500/20 border border-indigo-500/10"></span>
                            <span className="w-3.5 h-3.5 rounded bg-indigo-500/50 border border-indigo-500/30"></span>
                            <span className="w-3.5 h-3.5 rounded bg-indigo-500 border border-indigo-300"></span>
                            <span className="text-gray-400 dark:text-gray-500">More</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* Left: Donut Chart & Best Subjects */}
                <div className="flex-[3] flex flex-col gap-8">
                    {/* Donut Chart Block */}
                    <div>
                        <h2 className="text-lg font-bold mb-6">Quiz Activity by Subject</h2>

                        {loading ? (
                            <div className="text-gray-400 text-sm">Loading chart data...</div>
                        ) : chartSegments.length === 0 ? (
                            <div className="text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center bg-gray-50 dark:bg-brand-surfaceAlt">
                                <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-white/20 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="20" x2="18" y2="10" />
                                    <line x1="12" y1="20" x2="12" y2="4" />
                                    <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">No quiz activity yet</p>
                                <p className="text-xs">Take some quizzes to see your subject breakdown here.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row items-center gap-8 border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-gray-50 dark:bg-brand-surfaceAlt">
                                {/* Donut Chart (CSS) */}
                                <div className="relative shrink-0">
                                    <div
                                        className="w-[220px] h-[220px] rounded-full relative shadow-sm dark:shadow-none transition-transform duration-200 hover:scale-[1.02]"
                                        style={{ background: conicGradient }}
                                    >
                                        <div className="absolute inset-[40px] bg-white dark:bg-brand-surface rounded-full shadow-sm dark:shadow-none flex flex-col items-center justify-center">
                                            <span className="text-gray-955 dark:text-white text-3xl font-black">{totalQuizzes}</span>
                                            <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">Total Taken</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="flex flex-col gap-3 w-full">
                                    {chartSegments.map((s) => (
                                        <div key={s.name} className="flex items-center justify-between border-b border-gray-200/50 dark:border-white/5 pb-2 last:border-b-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                                                    style={{ backgroundColor: s.color }}
                                                ></span>
                                                <span className="text-gray-800 dark:text-white text-sm font-semibold">{s.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-gray-900 dark:text-white text-sm font-bold">{s.quizzes} Quizzes</span>
                                                <span className="text-gray-400 text-xs ml-2">({s.percent}%)</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Top Performing Subjects (You are good at these!) */}
                    <div>
                        <h2 className="text-lg font-bold mb-4">Top Performing Subjects</h2>
                        {stats.bestSubjects && stats.bestSubjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {stats.bestSubjects.map((sub, idx) => {
                                    // Harmonic color accents based on index
                                    const colorGradients = [
                                        'from-indigo-500/10 to-indigo-600/5 dark:from-indigo-500/20 dark:to-indigo-500/5 border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
                                        'from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                                        'from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300'
                                    ];
                                    const gradClass = colorGradients[idx % colorGradients.length];

                                    return (
                                        <div 
                                            key={sub.subject_name}
                                            className={`bg-gradient-to-br ${gradClass} border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:scale-[1.02] transition-transform duration-200`}
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] uppercase tracking-widest font-black opacity-80">Rank #{idx + 1}</span>
                                                    <svg className="w-4 h-4 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                    </svg>
                                                </div>
                                                <h4 className="text-base font-extrabold truncate">{sub.subject_name}</h4>
                                                <p className="text-xs opacity-75 mt-1">{sub.completed_count} {sub.completed_count === 1 ? 'Quiz' : 'Quizzes'} completed</p>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-current/10 flex items-baseline gap-2">
                                                <span className="text-2xl font-black">{sub.avg_score_percent}%</span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Avg Score</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center bg-gray-50 dark:bg-brand-surfaceAlt font-medium">
                                Take a few subject-specific quizzes to calculate your strengths here.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex-[2] flex flex-col gap-6">

                    {/* Highest Score Highlight */}
                    <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-gray-50 dark:bg-brand-surfaceAlt shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-5 h-5 text-yellow-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="7" />
                                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                            </svg>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Highest Score Highlight</h3>
                        </div>
                        {highestScores.length > 0 ? (
                            <>
                                <p className="text-green-600 dark:text-green-400 font-extrabold text-sm mb-4">
                                    {highestScores[0]?.category_name || 'Quiz'} ({highestScores[0]?.score_percent || 0}%)
                                </p>
                                <div className="flex flex-col gap-3">
                                    {highestScores.map((card, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white dark:bg-brand-surface border border-gray-200 dark:border-white/10 shadow-sm rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform duration-200"
                                        >
                                            <svg className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="8" r="7" />
                                                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                                            </svg>
                                            <div className="overflow-hidden">
                                                <div className="text-gray-900 dark:text-white text-sm font-bold truncate pr-1" style={{ maxWidth: '170px' }}>{card.file_name || card.category_name || 'Quiz'}</div>
                                                <div className="text-gray-500 dark:text-gray-400 text-xs">Score: {card.correct_answers}/{card.total_questions}</div>
                                                <div className="text-indigo-600 dark:text-indigo-400 text-xs font-bold mt-0.5">{card.score_percent}%</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3">Complete quizzes to see your best scores here.</p>
                        )}
                    </div>

                    {/* Contests Score Highlight */}
                    <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-gray-50 dark:bg-brand-surfaceAlt shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-5 h-5 text-yellow-500 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="trophyGradSmall" x1="0%" y1="100%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#d97706" />
                                        <stop offset="50%" stopColor="#eab308" />
                                        <stop offset="100%" stopColor="#fef08a" />
                                    </linearGradient>
                                </defs>
                                <path d="M6 9H4.5A2.5 2.5 0 012 6.5V6a2 2 0 012-2h2v5zm12 0h1.5A2.5 2.5 0 0022 6.5V6a2 2 0 00-2-2h-2v5z" fill="url(#trophyGradSmall)" opacity="0.6" />
                                <path d="M18 2H6v10c0 3.3137 2.6863 6 6 6s6-2.6863 6-6V2z" fill="url(#trophyGradSmall)" />
                                <path d="M12 18v3m-4 0h8" stroke="url(#trophyGradSmall)" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Contests Score Highlight</h3>
                        </div>
                        {contestScores.length > 0 ? (
                            <>
                                <p className="text-green-600 dark:text-green-400 font-extrabold text-sm mb-4">
                                    {contestScores[0]?.name}: {contestScores[0]?.score || 0} points
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    {contestScores.map((card, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white dark:bg-brand-surface border border-gray-200 dark:border-white/10 shadow-sm rounded-xl p-3 text-center hover:scale-[1.03] transition-transform duration-200"
                                        >
                                            <div className="flex items-center justify-center gap-1 mb-1.5">
                                                <span className="text-gray-900 dark:text-white text-[10px] font-bold truncate" style={{ maxWidth: '40px' }}>{card.name}</span>
                                                <svg className="w-3.5 h-3.5 text-yellow-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="8" r="7" />
                                                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                                                </svg>
                                            </div>
                                            <div className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold">Score: {card.score || 0}</div>
                                            <div className="text-indigo-600 dark:text-indigo-400 text-[9px] font-bold mt-0.5">Rank {card.rank ? `#${card.rank}` : 'N/A'}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3">Join tournaments to see your contest scores here.</p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Dashboard;