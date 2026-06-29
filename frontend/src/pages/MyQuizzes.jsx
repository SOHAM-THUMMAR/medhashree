import { useState, useEffect } from 'react';
import { API_BASE, authFetch } from '../config/api';

function MyQuizzes() {
    const [activeTab, setActiveTab] = useState('All Quizzes');
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    const tabs = ['All Quizzes', 'Active', 'Completed'];

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const res = await authFetch(`${API_BASE}/quizzes/my`);
                const data = await res.json();
                if (data.success && data.data.length > 0) {
                    setQuizzes(data.data.map(q => ({
                        id: q.file_id,
                        title: q.file_name || `${q.subject || 'Quiz'} - ${q.topic || 'General'}`,
                        category: q.subject || 'General',
                        image: null,
                        questions: q.question_count,
                        score: '-',
                        date: new Date(q.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        status: q.status === 'Published' ? 'Active' : q.status === 'Draft' ? 'Active' : 'Completed',
                    })));
                }
            } catch (err) {
                console.error('Failed to fetch quizzes:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuizzes();
    }, []);

    const filteredQuizzes = quizzes.filter((q) => {
        const matchesTab = activeTab === 'All Quizzes' || q.status === activeTab;
        const matchesSearch = !searchQuery || q.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div className="max-w-[1200px] mx-auto text-gray-900 dark:text-white pt-6 pb-20 px-4 md:px-6">

            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-1">My Quizzes</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Manage and track all quizzes</p>
            </div>

            {/* Search + Filters Row */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
                <div className="flex-1 relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" placeholder="Search your quizzes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-brand-surface text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-white/10 rounded-xl h-11 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" />
                </div>
                <div className="flex items-center bg-gray-100 dark:bg-brand-surfaceAlt border border-gray-200/80 dark:border-white/5 rounded-xl p-1 shadow-inner h-11 shrink-0">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-brand-surface text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-750 dark:hover:text-white'}`} title="Grid view">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zM2.5 2a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h3a.5.5 0 00.5-.5v-3a.5.5 0 00-.5-.5h-3zm6.5.5A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm1.5-.5a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h3a.5.5 0 00.5-.5v-3a.5.5 0 00-.5-.5h-3zM1 10.5A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm1.5-.5a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h3a.5.5 0 00.5-.5v-3a.5.5 0 00-.5-.5h-3zm6.5.5A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3zm1.5-.5a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h3a.5.5 0 00.5-.5v-3a.5.5 0 00-.5-.5h-3z"/></svg>
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-brand-surface text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-750 dark:hover:text-white'}`} title="List view">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z"/></svg>
                    </button>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex mb-8">
                <div className="bg-gray-100 dark:bg-brand-surfaceAlt border border-gray-200/55 dark:border-white/5 rounded-full p-1.5 flex shadow-inner">
                    {tabs.map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${activeTab === tab ? 'bg-white dark:bg-brand-surface text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400 font-medium">Loading quizzes...</div>
            ) : (
                <>
                    {/* Grid View */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {filteredQuizzes.map((quiz) => (
                                <div key={quiz.id} className="bg-white dark:bg-brand-surface border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 shadow-sm flex flex-col">
                                    <div className="relative h-[150px] overflow-hidden">
                                        {quiz.image ? (
                                            <img src={quiz.image} alt={quiz.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center">
                                                <span className="text-white/40 text-4xl font-bold">{(quiz.category || 'Q').charAt(0)}</span>
                                            </div>
                                        )}
                                        <span className={`absolute top-3 right-3 ${quiz.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'} text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>
                                            {quiz.status}
                                        </span>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 mb-1 uppercase tracking-wider">{quiz.category}</span>
                                        <h3 className="text-gray-800 dark:text-white font-bold text-sm mb-3 leading-tight flex-1">{quiz.title}</h3>
                                        <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-white/5 pt-3">
                                            <span>{quiz.questions} Qs</span>
                                            <span>{quiz.score}</span>
                                            <span>{quiz.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* List View */}
                    {viewMode === 'list' && (
                        <div className="flex flex-col gap-4">
                            {filteredQuizzes.map((quiz) => (
                                <div key={quiz.id} className="bg-white dark:bg-brand-surface border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:bg-gray-50 dark:hover:bg-brand-surfaceAlt transition-all duration-300 shadow-sm flex flex-col md:flex-row">
                                    <div className="w-full md:w-[200px] h-[140px] md:h-auto overflow-hidden shrink-0 relative">
                                        {quiz.image ? (
                                            <img src={quiz.image} alt={quiz.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full min-h-[100px] bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center">
                                                <span className="text-white/40 text-4xl font-bold">{(quiz.category || 'Q').charAt(0)}</span>
                                            </div>
                                        )}
                                        <span className={`absolute top-3 right-3 ${quiz.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'} text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>
                                            {quiz.status}
                                        </span>
                                    </div>
                                    <div className="flex-1 p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="flex-1">
                                            <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">{quiz.category}</span>
                                            <h3 className="text-gray-800 dark:text-white font-bold text-sm mt-1">{quiz.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-6 text-[11px] text-gray-500 dark:text-gray-400 shrink-0">
                                            <span>{quiz.questions} Qs</span>
                                            <span>{quiz.score}</span>
                                            <span>{quiz.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {filteredQuizzes.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-gray-500 dark:text-gray-400 text-lg">No quizzes found.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default MyQuizzes;