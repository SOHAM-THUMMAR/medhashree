import { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../config/api';
import { useSearch } from '../context/SearchContext';

function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const { debouncedQuery } = useSearch();

    const filteredData = debouncedQuery
        ? leaderboardData.filter(u => u.user.toLowerCase().includes(debouncedQuery))
        : leaderboardData;

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch(`${API_BASE}/leaderboard`);
                const data = await res.json();
                if (data.success) {
                    setLeaderboardData(data.data.map(u => ({
                        rank: u.rank,
                        user: `@${u.username}`,
                        category: u.best_category || 'General',
                        quizzes: u.total_quizzes || 0,
                        points: (u.total_points || 0).toLocaleString()
                    })));
                }

                // Fetch user rank
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    const rankRes = await fetch(`${API_BASE}/leaderboard/rank/${user.user_id}`);
                    const rankData = await rankRes.json();
                    if (rankData.success) setUserRank(rankData.data.rank);
                }
            } catch (err) {
                console.error('Failed to fetch leaderboard:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const totalQuizzes = useMemo(() => {
        return leaderboardData.reduce((acc, user) => acc + (parseInt(user.quizzes) || 0), 0);
    }, [leaderboardData]);

    const activeLearnerCount = leaderboardData.length;

    const topScore = useMemo(() => {
        return leaderboardData[0]?.points || "0";
    }, [leaderboardData]);

    const topCategory = useMemo(() => {
        if (leaderboardData.length === 0) return 'N/A';
        const counts = {};
        leaderboardData.forEach(u => {
            if (u.category && u.category !== 'General') {
                counts[u.category] = (counts[u.category] || 0) + 1;
            }
        });
        const categories = Object.keys(counts);
        if (categories.length === 0) return 'General';
        return categories.reduce((a, b) => counts[a] > counts[b] ? a : b);
    }, [leaderboardData]);

    return (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 text-black dark:text-white pt-6 pb-20">

            {/* Top Banner */}
            <div className="w-full bg-gradient-to-r from-primary via-brand-indigoDark to-brand-dark rounded-3xl p-10 mb-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8 min-h-[160px]">
                <div className="relative z-10 flex flex-col justify-center">
                    <h1 className="font-bold text-3xl md:text-[34px] text-white mb-3 tracking-wide drop-shadow-md">
                        This Week's Hall of Fame
                    </h1>
                    <p className="text-primary-light text-sm font-medium tracking-wide mb-6">
                        See where you stand against the best students in the community
                    </p>
                    <div>
                        <div className="inline-block border border-primary-light/80 text-[#c7d2fe] rounded-full px-6 py-1.5 text-xs font-semibold">
                            Your Rank : {userRank ? `#${userRank}` : 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Stats Box inside Banner */}
                <div className="relative z-10 flex flex-col gap-3 md:items-end">
                    <div className="border border-primary-light/80 text-[#c7d2fe] rounded-full px-5 py-1 text-[11px] font-semibold mb-1 w-max">
                        This Week's Report :
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-3 justify-end">
                        <div className="border border-primary-light/80 text-white rounded-full px-5 py-1 text-[11px] font-medium whitespace-nowrap">
                            {totalQuizzes.toLocaleString()} Quizzes Played
                        </div>
                        <div className="border border-primary-light/80 text-white rounded-full px-5 py-1 text-[11px] font-medium whitespace-nowrap">
                            Top Category : {topCategory}
                        </div>
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-3 justify-end">
                        <div className="border border-primary-light/80 text-white rounded-full px-5 py-1 text-[11px] font-medium whitespace-nowrap">
                            {activeLearnerCount}+ Active Learners
                        </div>
                        <div className="border border-primary-light/80 text-white rounded-full px-5 py-1 text-[11px] font-medium whitespace-nowrap text-center">
                            Highest Score : {topScore}
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard Table Section */}
            <div className="w-full mt-6">
                <h2 className="text-[17px] font-bold mb-6 tracking-wide text-gray-800 dark:text-white">This Week's Leaderboard</h2>

                {loading ? (
                    <div className="text-center text-gray-400 py-12">Loading leaderboard...</div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center text-gray-400 py-12 border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-brand-surface shadow-sm">
                        <p className="text-lg mb-2">🏆</p>
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">No leaderboard data yet</p>
                        <p className="text-sm">Take some quizzes to appear on the leaderboard!</p>
                    </div>
                ) : (
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 text-[14px] font-bold tracking-wider">
                                <th className="py-4 pl-0 pr-4 w-20">RANK</th>
                                <th className="py-4 px-4 w-1/4 text-center">USER</th>
                                <th className="py-4 px-4 w-1/4 text-center">CATEGORY</th>
                                <th className="py-4 px-4 w-32 text-center">QUIZZES</th>
                                <th className="py-4 pl-4 pr-0 text-left w-32">POINTS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-gray-150 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-brand-surfaceAlt/30 transition-colors"
                                >
                                    <td className="py-5 pl-0 pr-4 text-[15px] font-bold text-gray-800 dark:text-gray-300">
                                        {item.rank}
                                    </td>
                                    <td className="py-5 px-4 text-[15px] font-medium text-gray-800 dark:text-gray-300 text-center">
                                        {item.user}
                                    </td>
                                    <td className="py-5 px-4 text-[15px] font-bold text-gray-700 dark:text-gray-400 text-center uppercase tracking-wide">
                                        {item.category}
                                    </td>
                                    <td className="py-5 px-4 text-[15px] font-medium text-gray-600 dark:text-gray-400 text-center">
                                        {item.quizzes}
                                    </td>
                                    <td className="py-5 pl-4 pr-0 text-[15px] font-bold text-gray-900 dark:text-gray-300 text-left">
                                        {item.points}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>

        </div>
    );
}

export default Leaderboard;