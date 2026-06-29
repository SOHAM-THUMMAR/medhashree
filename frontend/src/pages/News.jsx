import { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { useSearch } from '../context/SearchContext';

const tagColors = {
    'NEW FEATURE': 'bg-indigo-500',
    'UI IMPROVEMENT': 'bg-primary',
    'PERFORMANCE': 'bg-[#059669]',
    'BUG FIX': 'bg-[#dc2626]',
    'ANNOUNCEMENT': 'bg-[#ca8a04]'
};

function News() {
    const [activeFilter, setActiveFilter] = useState('All Updates');
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const { debouncedQuery } = useSearch();

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                const queryParam = activeFilter !== 'All Updates' ? `?tag=${encodeURIComponent(activeFilter)}` : '';
                const res = await fetch(`${API_BASE}/news${queryParam}`);
                const data = await res.json();
                if (data.success) {
                    setUpdates(data.data.map(n => ({
                        id: n.news_id,
                        date: new Date(n.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                        tag: n.tag,
                        bgColor: tagColors[n.tag] || 'bg-indigo-500',
                        title: n.title,
                        description: n.description
                    })));
                } else {
                    setUpdates([]);
                }
            } catch (err) {
                console.error('Failed to fetch news:', err);
                setUpdates([]);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, [activeFilter]);

    const filters = ['All Updates', 'NEW FEATURE', 'PERFORMANCE', 'UI IMPROVEMENT', 'BUG FIX', 'ANNOUNCEMENT'];

    return (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 text-black dark:text-white pt-6 pb-20">

            {/* Top Banner */}
            <div className="w-full bg-gradient-to-r from-primary via-brand-indigoDark to-brand-dark rounded-3xl p-6 sm:p-10 mb-8 shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[120px] sm:min-h-[160px]">
                <h1 className="font-bold text-3xl md:text-[34px] text-white mb-3 tracking-wide drop-shadow-md">
                    What's New in Quiz Hub
                </h1>
                <p className="text-primary-light text-sm font-medium tracking-wide">
                    Track the latest features, bug fixes, and improvements we've built for you
                </p>
            </div>

            {/* Filter Badges */}
            <div className="flex flex-wrap gap-2.5 items-center mb-8 px-1">
                {filters.map(filter => (
                    <span
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`rounded-full px-5 py-1.5 text-xs font-bold cursor-pointer transition-all duration-200 tracking-wide border ${
                            activeFilter === filter
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                                : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 bg-white dark:bg-brand-surface hover:bg-gray-50 dark:hover:bg-brand-surfaceAlt'
                        }`}
                    >
                        {filter}
                    </span>
                ))}
            </div>

            {/* Updates List */}
            <div className="space-y-6 px-1">
                {loading ? (
                    <div className="text-center text-gray-400 py-12">Loading updates...</div>
                ) : updates.length === 0 ? (
                    <div className="text-center text-gray-400 py-12 border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-brand-surface shadow-sm">
                        <p className="text-lg mb-2">No updates available</p>
                        <p className="text-sm text-gray-500">Check back later for new announcements</p>
                    </div>
                ) : (
                    updates.filter(u => !debouncedQuery || u.title?.toLowerCase().includes(debouncedQuery)).map((update, idx) => (
                        <div
                            key={update.id || idx}
                            className="bg-white dark:bg-brand-surface border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:border-indigo-500/20 dark:hover:border-white/20 duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400 tracking-wide">
                                    Date : {update.date}
                                </span>
                                <span className={`${update.bgColor} text-white text-[11px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-sm`}>
                                    {update.tag}
                                </span>
                            </div>
                            <h2 className="text-[19px] font-bold text-gray-900 dark:text-white mb-3 tracking-wide">
                                {update.title}
                            </h2>
                            <p className="text-[13px] leading-relaxed text-gray-600 dark:text-gray-400 font-medium">
                                {update.description}
                            </p>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
}

export default News;