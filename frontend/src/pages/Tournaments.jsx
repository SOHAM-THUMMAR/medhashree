import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, authFetch } from '../config/api';
import { useSearch } from '../context/SearchContext';
import TournamentDetailsModal from '../components/TournamentDetailsModal';
import SEOHead from '../components/SEOHead';

function Tournaments() {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('All Self Study Paths');
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState(null);
    const { debouncedQuery } = useSearch();

    // Fetch categories for filter tabs
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE}/self-study`);
                const data = await res.json();
                if (data.success) {
                    setCategories(data.data.map(c => c.name));
                }
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchTournaments = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/tournaments`);
                const data = await res.json();
                if (data.success) {
                    setTournaments(data.data.map(t => ({
                        id: t.tournament_id,
                        title: t.name,
                        description: t.description || '',
                        dateRange: `${new Date(t.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(t.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
                        participants: `${(parseInt(t.participant_count) || 0).toLocaleString()} Participants`,
                        participantCount: parseInt(t.participant_count) || 0,
                        image: t.thumbnail_url || null,
                        category: t.category_name || t.subject || 'General',
                        badge: t.status === 'upcoming' ? 'Registration open' : t.status === 'active' ? 'Active' : t.status,
                        badgeColor: t.status === 'upcoming' ? 'bg-green-500' : t.status === 'active' ? 'bg-blue-500' : 'bg-gray-500',
                        rounds: t.rounds || 1,
                        totalQuestions: t.total_questions || 50,
                        startDate: t.start_date,
                        endDate: t.end_date,
                        registrationDeadline: t.registration_deadline,
                        status: t.status,
                        isClosed: new Date(t.registration_deadline || t.end_date) < new Date() || t.status === 'completed'
                    })));
                } else {
                    setTournaments([]);
                }
            } catch (err) {
                console.error('Failed to fetch tournaments:', err);
                setTournaments([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    const handleJoin = async (tournamentId) => {
        if (!localStorage.getItem('token')) {
            alert('Please login to join a tournament.');
            navigate('/login');
            return;
        }
        try {
            // Fix: use relative path — authFetch already prepends API_BASE
            const res = await authFetch(`/tournaments/${tournamentId}/join`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert('Joined tournament successfully!');
                // Refresh tournament data
                const updatedRes = await fetch(`${API_BASE}/tournaments`);
                const updatedData = await updatedRes.json();
                if (updatedData.success) {
                    setTournaments(prev => prev.map(t => {
                        const updated = updatedData.data.find(ut => ut.tournament_id === t.id);
                        if (updated) {
                            return { ...t, participantCount: parseInt(updated.participant_count) || 0, participants: `${(parseInt(updated.participant_count) || 0).toLocaleString()} Participants` };
                        }
                        return t;
                    }));
                }
            } else {
                alert(data.message || data.error || 'Failed to join');
            }
        } catch {
            alert('Cannot connect to server');
        }
    };

    const filters = ['All Self Study Paths', ...categories.slice(0, 4)];
    const filteredTournaments = (activeFilter === 'All Self Study Paths'
        ? tournaments
        : tournaments.filter(t => t.category.toLowerCase().includes(activeFilter.toLowerCase()))
    ).filter(t => !debouncedQuery || t.title?.toLowerCase().includes(debouncedQuery));

    // Get the featured tournament (first upcoming/active)
    const featured = tournaments.find(t => t.status === 'upcoming' || t.status === 'active') || tournaments[0];

    // Calculate registration deadline countdown
    const getDeadlineInfo = (deadline) => {
        if (!deadline) return { text: 'Open', percent: 50 };
        const now = new Date();
        const dl = new Date(deadline);
        const diff = dl - now;
        if (diff <= 0) return { text: 'Closed', percent: 100 };
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return { text: `${days} day${days > 1 ? 's' : ''}`, percent: Math.max(10, 100 - (days * 5)) };
    };

    return (
        <div className="max-w-[1200px] mx-auto text-black dark:text-white pt-6 pb-20 px-4 md:px-6">
            <SEOHead title="Quiz Tournaments" description="Join online mock test quiz tournaments for entrance exam prep (JEE, NEET, GATE, SSC CGL) and win points." />

            {/* Featured Tournament Banner */}
            {featured ? (
                <div className="w-full bg-gradient-to-r from-brand-indigoDark via-[#1a1640] to-brand-dark rounded-3xl p-8 md:p-10 mb-6 shadow-2xl relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-primary/15 blur-[100px] rounded-full pointer-events-none"></div>

                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 relative z-10 tracking-wide">
                        {featured.title}
                    </h1>
                    <p className="text-gray-300 text-sm max-w-xl mb-5 relative z-10 leading-relaxed font-light">
                        {featured.description || 'Compete with the best quiz enthusiasts in this premier tournament.'}
                    </p>

                    <div className="flex items-center gap-6 text-sm text-gray-400 mb-6 relative z-10">
                        <span className="text-purple-300 font-medium">{featured.dateRange}</span>
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                            </svg>
                            {featured.participants}
                        </span>
                    </div>

                    <button 
                        onClick={() => handleJoin(featured.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-indigo-600/10 relative z-10"
                    >
                        Join Tournament
                    </button>
                </div>
            ) : !loading && (
                <div className="w-full bg-gradient-to-r from-brand-indigoDark via-[#1a1640] to-brand-dark rounded-3xl p-8 md:p-10 mb-6 shadow-2xl border border-white/5 text-center">
                    <h1 className="text-3xl font-bold text-white mb-3">Tournaments</h1>
                    <p className="text-gray-400">No tournaments available yet. Check back soon!</p>
                </div>
            )}

            {/* Countdown / Stats Section */}
            {featured && (
                <div className="bg-white dark:bg-brand-surface border border-gray-200 dark:border-white/10 rounded-2xl p-6 md:p-8 mb-10 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-gray-900 dark:text-white font-bold text-lg">Registrations closes in</h3>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                            {getDeadlineInfo(featured.registrationDeadline || featured.endDate).text}
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-brand-surfaceAlt rounded-full h-2 mb-8 overflow-hidden">
                        <div className="bg-gradient-to-r from-primary to-[#7c3aed] h-2 rounded-full transition-all" 
                             style={{ width: `${getDeadlineInfo(featured.registrationDeadline || featured.endDate).percent}%` }}></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 dark:bg-brand-surfaceAlt border border-gray-200 dark:border-white/10 rounded-xl p-5 text-center">
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">{featured.rounds}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Rounds</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-brand-surfaceAlt border border-gray-200 dark:border-white/10 rounded-xl p-5 text-center">
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">{featured.participantCount}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Participants</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-brand-surfaceAlt border border-gray-200 dark:border-white/10 rounded-xl p-5 text-center">
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">{featured.totalQuestions}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Questions</div>
                        </div>
                    </div>
                </div>
            )}

            {/* All Tournaments */}
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">All Tournaments</h2>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2.5 mb-8">
                {filters.map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-6 py-2 rounded-full text-sm font-semibold transition-all border ${
                            activeFilter === filter
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                                : 'bg-white dark:bg-brand-surface text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-brand-surfaceAlt'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Tournament Cards Grid */}
            {loading ? (
                <div className="text-center text-gray-400 py-12">Loading tournaments...</div>
            ) : filteredTournaments.length === 0 ? (
                <div className="text-center text-gray-400 py-12 border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-brand-surface shadow-sm">
                    <p className="text-lg mb-2">No tournaments found</p>
                    <p className="text-sm text-gray-500">Try a different self study path or check back later</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {filteredTournaments.map((t, idx) => (
                        <div
                            key={t.id || idx}
                            className="bg-white dark:bg-brand-surface border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-sm flex flex-col"
                        >
                            <div className="relative h-[140px] overflow-hidden">
                                {t.image ? (
                                    <img src={t.image} alt={t.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-700 to-purple-900 flex items-center justify-center">
                                        <span className="text-white/20 text-3xl font-bold">{(t.category || t.title || 'T').charAt(0)}</span>
                                    </div>
                                )}
                                <span className={`absolute top-3 right-3 ${t.badgeColor} text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>
                                    {t.badge}
                                </span>
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                                <h3 className="text-gray-900 dark:text-white font-bold text-sm mb-2 leading-tight">{t.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed mb-4 flex-1">{t.description}</p>
                                <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-4 pt-2 border-t border-gray-100 dark:border-white/5">
                                    <span>{t.dateRange}</span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                        </svg>
                                        {t.participants}
                                    </span>
                                </div>
                                <div className="flex gap-2 mt-auto">
                                    <button 
                                        onClick={() => setSelectedTournamentId(t.id)}
                                        className="flex-1 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-[11px] font-bold py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-brand-surfaceAlt transition-colors"
                                    >
                                        View Details
                                    </button>
                                    {t.isClosed ? (
                                        <button
                                            disabled
                                            className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-[11px] font-bold py-1.5 rounded-xl cursor-not-allowed shadow-none"
                                        >
                                            Closed
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => t.id && handleJoin(t.id)}
                                            className="flex-1 bg-indigo-600 text-white text-[11px] font-bold py-1.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/10"
                                        >
                                            Join Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedTournamentId && (
                <TournamentDetailsModal 
                    tournamentId={selectedTournamentId} 
                    onClose={() => setSelectedTournamentId(null)} 
                />
            )}
        </div>
    );
}

export default Tournaments;