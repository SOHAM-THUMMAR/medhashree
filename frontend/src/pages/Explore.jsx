import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, authFetch } from '../config/api';
import SEOHead from '../components/SEOHead';

function Explore() {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [startingQuizId, setStartingQuizId] = useState(null);

    // Fetch Explore Quizzes (Fixed Quizzes)
    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                setLoading(true);
                const res = await apiFetch('/fixed-quizzes');
                const data = await res.json();
                if (data.success) {
                    setQuizzes(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch explore quizzes:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuizzes();
    }, []);

    // Handle Start Solo Quiz Session
    const handleStartQuiz = async (quiz) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Please log in to play this explore quiz!");
            navigate('/login');
            return;
        }

        try {
            setStartingQuizId(quiz.quiz_id);
            const res = await authFetch(`/fixed-quizzes/${quiz.quiz_id}/play`, {
                method: 'POST'
            });
            const data = await res.json();

            if (data.success) {
                // Navigate directly to the solo play active session page
                navigate(`/play/${data.data.session.session_id}`);
            } else {
                alert(data.message || "Failed to start quiz session. Make sure questions exist for this path/subject!");
            }
        } catch (err) {
            console.error('Play Fixed Quiz Error:', err);
            alert("An error occurred while launching the quiz session.");
        } finally {
            setStartingQuizId(null);
        }
    };

    // Filter quizzes in real-time
    const filteredQuizzes = quizzes.filter(q => 
        q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.micro_topic_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-24 text-black dark:text-white text-left">
            <SEOHead title="Explore Quizzes" description="Explore dynamic curated quizzes and mock tests on Medhashree across multiple topics like React 19, JavaScript, Python, JEE, and NEET." />
            
            {/* Top Premium Hero Section */}
            <div className="w-full bg-gradient-to-r from-indigo-700 via-primary to-[#060b18] rounded-[2rem] py-12 px-6 sm:px-12 mb-10 shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-[45%] h-[150%] bg-[#8b5cf6]/20 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute -bottom-[20%] -left-[10%] w-[35%] h-[100%] bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 max-w-[800px]">
                    <span className="flex items-center gap-2 bg-white/10 text-white border border-white/10 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-flex mb-4 backdrop-blur-md">
                        <svg className="w-3.5 h-3.5 text-white shrink-0 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                        </svg>
                        Active Arenas
                    </span>
                    <h1 className="font-extrabold text-3xl sm:text-[40px] leading-tight text-white mb-4 tracking-tight">
                        Explore Quizzes: Dynamic Curated Challenges!
                    </h1>
                    <p className="text-gray-200 text-sm sm:text-[15px] font-medium leading-relaxed mb-8 max-w-[650px]">
                        Unlock database questions in real-time. Choose a quiz card below, styled with custom paths, select your filters, and start playing active, audited sessions immediately.
                    </p>
                    
                    {/* Live Real-time Card Search */}
                    <div className="relative max-w-[500px]">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span>
                        <input 
                            type="text" 
                            placeholder="Search quizzes by title, path, subject, or topic..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white/10 dark:bg-black/20 border border-white/15 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-gray-300 dark:placeholder-gray-400 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all font-medium backdrop-blur-md"
                        />
                    </div>
                </div>
            </div>

            {/* Quizzes Layout Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-xs">Loading Fixed Quizzes...</p>
                </div>
            ) : filteredQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredQuizzes.map((quiz) => (
                        <div 
                            key={quiz.quiz_id}
                            onClick={() => handleStartQuiz(quiz)}
                            style={{
                                background: `linear-gradient(135deg, ${quiz.gradient_from}, ${quiz.gradient_to})`,
                                borderColor: quiz.border_color,
                                borderWidth: '1px'
                            }}
                            className="group relative cursor-pointer rounded-2xl p-5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full min-h-[170px] text-white overflow-hidden text-left"
                        >
                            {/* Gloss reflect filters */}
                            <div className="absolute inset-0 bg-black/5 dark:bg-black/10 transition-colors group-hover:bg-transparent"></div>
                            <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="bg-white/15 text-white font-mono text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-white/10 backdrop-blur-sm">
                                        {quiz.category_name || 'General'}
                                    </span>
                                    <span className="text-[11px] text-white/80 font-medium">
                                        {quiz.question_count} Questions
                                    </span>
                                </div>

                                <h3 className="font-bold text-white text-sm line-clamp-2 leading-relaxed mb-4 group-hover:opacity-90 transition-opacity text-left">
                                    {quiz.title}
                                </h3>
                            </div>

                            <div className="relative z-10 flex items-center justify-between text-xs text-white/80 pt-3 border-t border-white/15 mt-auto">
                                <span className="font-mono text-[9px] truncate max-w-[60%]" title={`${quiz.subject_name || ''} ${quiz.topic_name ? `➔ ${quiz.topic_name}` : ''}`}>
                                    {quiz.subject_name || 'General'} {quiz.topic_name ? `➔ ${quiz.topic_name}` : ''}
                                </span>
                                <span className="font-extrabold text-white flex items-center gap-0.5 group-hover:gap-1.5 transition-all whitespace-nowrap">
                                    {startingQuizId === quiz.quiz_id ? 'Starting...' : 'Play Quiz'} <span className="text-[14px]">&rarr;</span>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-brand-surfaceAlt rounded-3xl border border-gray-150 dark:border-white/5 shadow-sm max-w-[600px] mx-auto">
                    <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-white/20 mb-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">No explore quizzes found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm px-6">
                        {searchQuery 
                            ? `We couldn't find any quiz cards matching "${searchQuery}". Try searching for another topic or path.`
                            : "There are currently no active fixed quizzes created by the administrator. Check back soon or contact support!"}
                    </p>
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery("")}
                            className="mt-6 text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider transition"
                        >
                            Reset Search
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default Explore;