import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, authFetch, API_BASE } from '../config/api';
import { io } from 'socket.io-client';

function QuizBattle() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('1v1');

    const [categories, setCategories] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [topics, setTopics] = useState([]);
    const [microTopics, setMicroTopics] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [selectedMicroTopic, setSelectedMicroTopic] = useState('');
    
    const [questionCount, setQuestionCount] = useState('10');
    const [timePerQuestion, setTimePerQuestion] = useState('60');
    const [difficulty, setDifficulty] = useState('Medium');
    
    const [loading, setLoading] = useState(false);

    // Matchmaking state
    const [searching, setSearching] = useState(false);
    const [searchTimeLeft, setSearchTimeLeft] = useState(300); // 5 minutes in seconds
    const countdownRef = useRef(null);
    const socketRef = useRef(null);

    // Match found popup state
    const [matchFound, setMatchFound] = useState(false);
    const [matchData, setMatchData] = useState(null);

    // Initial load: Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await apiFetch('/categories');
                const data = await res.json();
                if (data.success) setCategories(data.data);
            } catch (err) { console.error(err); }
        };
        fetchCategories();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // Change Category
    const handleCategoryChange = async (e) => {
        const catId = e.target.value;
        setSelectedCategory(catId);
        setSelectedSubject('');
        setSelectedTopic('');
        setSelectedMicroTopic('');
        setSubjects([]);
        setTopics([]);
        setMicroTopics([]);
        
        if (catId) {
            try {
                const res = await apiFetch(`/categories/${catId}/subjects`);
                const data = await res.json();
                if (data.success) setSubjects(data.data);
            } catch (err) { console.error(err); }
        }
    };

    // Change Subject
    const handleSubjectChange = async (e) => {
        const subId = e.target.value;
        setSelectedSubject(subId);
        setSelectedTopic('');
        setSelectedMicroTopic('');
        setTopics([]);
        setMicroTopics([]);
        
        if (subId) {
            try {
                const res = await apiFetch(`/subjects/${subId}/topics`);
                const data = await res.json();
                if (data.success) setTopics(data.data);
            } catch (err) { console.error(err); }
        }
    };

    // Change Topic
    const handleTopicChange = async (e) => {
        const topId = e.target.value;
        setSelectedTopic(topId);
        setSelectedMicroTopic('');
        setMicroTopics([]);
        
        if (topId) {
            try {
                const res = await apiFetch(`/topics/${topId}/micro-topics`);
                const data = await res.json();
                if (data.success) setMicroTopics(data.data);
            } catch (err) { console.error(err); }
        }
    };

    // Cancel matchmaking
    const cancelSearch = () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        if (socketRef.current) {
            socketRef.current.emit('battle:cancel-search');
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setSearching(false);
        setSearchTimeLeft(300);
    };

    // Handle session creation
    const handleStart = async () => {
        if (!localStorage.getItem('token')) {
            alert('Please login to start a quiz battle.');
            navigate('/login');
            return;
        }

        if (!selectedCategory && categories.length > 0) {
            alert('Please select an Exam/Category to continue.');
            return;
        }

        // Prevent double-clicks
        if (searching || loading) return;

        setLoading(true);
        try {
            if (activeTab === '1v1') {
                // ─── SOCKET.IO MATCHMAKING ────────────────────────────

                // Clean up any existing socket first
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }

                const token = localStorage.getItem('token');
                const socketUrl = API_BASE.replace('/api', '');
                
                // Show searching UI IMMEDIATELY
                setSearching(true);
                setSearchTimeLeft(300);
                setLoading(false);

                // Start countdown timer right away
                countdownRef.current = setInterval(() => {
                    setSearchTimeLeft(prev => {
                        if (prev <= 1) {
                            cancelSearch();
                            alert('No opponent found within 5 minutes. Please try again.');
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                const socket = io(socketUrl, {
                    auth: { token },
                    transports: ['websocket', 'polling']
                });

                socketRef.current = socket;

                socket.on('connect', () => {
                    console.log('[Socket] Connected:', socket.id);
                    // Send matchmaking request
                    socket.emit('battle:find-match', {
                        category_id: selectedCategory || null,
                        subject_id: selectedSubject || null,
                        question_count: questionCount
                    });
                });

                socket.on('battle:searching', (data) => {
                    console.log('[Socket] In queue:', data);
                    // Already showing searching UI, just confirm
                });

                socket.on('battle:matched', (data) => {
                    console.log('[Socket] Matched!', data);
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    setSearching(false);
                    
                    // Show "Match Found!" popup
                    setMatchData({
                        session_id: data.session_id,
                        opponent_name: data.opponent_name || 'Opponent',
                        question_count: data.question_count
                    });
                    setMatchFound(true);

                    // Navigate after 3 seconds
                    setTimeout(() => {
                        setMatchFound(false);
                        navigate(`/play/${data.session_id}`);
                    }, 3000);

                    // Disconnect socket after matching
                    socket.disconnect();
                    socketRef.current = null;
                });

                socket.on('battle:timeout', () => {
                    cancelSearch();
                    alert('No opponent found within 5 minutes. Please try again.');
                });

                socket.on('battle:error', (data) => {
                    cancelSearch();
                    alert(data.message || 'Matchmaking error. Please try again.');
                });

                socket.on('connect_error', (err) => {
                    console.error('[Socket] Connection error:', err.message);
                    cancelSearch();
                    // Fallback to HTTP matchmaking
                    handleHttpFallback();
                });

                return; // Don't hit the finally block's setLoading(false)

            } else {
                // Solo mode — same as before
                const response = await authFetch('/battle/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        quiz_type: 'solo',
                        category_id: selectedCategory || null,
                        subject_id: selectedSubject || null,
                        topic_id: selectedTopic || null,
                        micro_topic_id: selectedMicroTopic || null,
                        difficulty: difficulty,
                        question_count: questionCount,
                        time_per_question: timePerQuestion
                    })
                });

                const data = await response.json();
                if (data.success && data.data?.session?.session_id) {
                    navigate(`/play/${data.data.session.session_id}`);
                } else {
                    alert(data.message || 'Failed to start quiz. Make sure there are questions available for this selection.');
                }
            }
        } catch (err) {
            console.error(err);
            alert('Error creating quiz session.');
        } finally {
            setLoading(false);
        }
    };

    // HTTP fallback for when socket connection fails
    const handleHttpFallback = async () => {
        try {
            const response = await authFetch('/battle/find-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category_id: selectedCategory || null,
                    subject_id: selectedSubject || null,
                    question_count: questionCount,
                    time_per_question: 60
                })
            });

            const data = await response.json();
            if (data.success) {
                if (data.data.matched) {
                    navigate(`/play/${data.data.session.session_id}`);
                } else {
                    // Start polling
                    setSearching(true);
                    setSearchTimeLeft(300);
                    const sessionId = data.data.session.session_id;

                    countdownRef.current = setInterval(async () => {
                        setSearchTimeLeft(prev => {
                            if (prev <= 1) {
                                cancelSearch();
                                alert('No opponent found. Please try again.');
                                return 0;
                            }
                            return prev - 1;
                        });

                        try {
                            const statusRes = await authFetch(`/battle/${sessionId}/status`);
                            const statusData = await statusRes.json();
                            if (statusData.success && statusData.data.matched) {
                                cancelSearch();
                                navigate(`/play/${sessionId}`);
                            } else if (statusData.data?.status === 'cancelled') {
                                cancelSearch();
                                alert('No opponent found. Please try again.');
                            }
                        } catch (e) {
                            console.error('Poll error:', e);
                        }
                    }, 3000);
                }
            } else {
                alert(data.message || 'Failed to find match.');
                setSearching(false);
            }
        } catch (err) {
            console.error(err);
            alert('Error finding match.');
            setSearching(false);
        }
    };

    const selectStyle = {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Match Found popup
    if (matchFound && matchData) {
        return (
            <div className="max-w-[1100px] mx-auto text-black dark:text-white pt-6 pb-20 px-4">
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="bg-[#111827] border-2 border-green-500/50 rounded-2xl p-12 max-w-lg w-full text-center shadow-2xl shadow-green-500/20 animate-pulse">
                        {/* Swords icon */}
                        <div className="text-7xl mb-6">⚔️</div>
                        
                        <h2 className="text-3xl font-black text-green-400 mb-3">Match Found!</h2>
                        <p className="text-gray-300 mb-6 text-lg">
                            You're battling against <span className="text-white font-bold">{matchData.opponent_name}</span>
                        </p>
                        
                        <div className="bg-[#1a1d2e] rounded-lg p-4 mb-6">
                            <p className="text-gray-400 text-sm">📝 {matchData.question_count} Questions • ⏱ 60s each</p>
                        </div>

                        <p className="text-primary-light text-sm font-semibold">Starting quiz in a moment...</p>

                        {/* Loading bar animation */}
                        <div className="w-full bg-[#1a1d2e] rounded-full h-2 mt-6 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full"
                                style={{ 
                                    animation: 'fillBar 3s ease-in-out forwards'
                                }}
                            ></div>
                        </div>
                        <style>{`
                            @keyframes fillBar {
                                from { width: 0%; }
                                to { width: 100%; }
                            }
                        `}</style>
                    </div>
                </div>
            </div>
        );
    }

    // Searching overlay for 1v1
    if (searching) {
        return (
            <div className="max-w-[1100px] mx-auto text-black dark:text-white pt-6 pb-20 px-4">
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="bg-[#111827] border border-indigo-500/50 rounded-2xl p-12 max-w-lg w-full text-center shadow-2xl shadow-indigo-500/20">
                        {/* Animated spinner */}
                        <div className="w-20 h-20 mx-auto mb-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        
                        <h2 className="text-2xl font-bold mb-3">Searching for Opponent...</h2>
                        <p className="text-gray-400 mb-6 text-sm">Matching you with a player in the same category & subject</p>
                        
                        <div className="text-indigo-500 text-4xl font-black mb-8">
                            {formatTime(searchTimeLeft)}
                        </div>
                        
                        <div className="w-full bg-[#1a1d2e] rounded-full h-2 mb-8">
                            <div
                                className="bg-gradient-to-r from-primary to-[#7c3aed] h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${(searchTimeLeft / 300) * 100}%` }}
                            ></div>
                        </div>

                        <button
                            onClick={cancelSearch}
                            className="w-full bg-[#1a1d2e] border border-gray-600 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                        >
                            Cancel Search
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1100px] mx-auto text-black dark:text-white pt-6 pb-20 px-4">
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold tracking-wide mb-2">Quiz Battle</h1>
                <p className="text-gray-400 text-sm font-medium">
                    Challenge friends or random players to real-time quiz battles
                </p>
            </div>

            <div className="flex justify-center mb-8">
                <div className="bg-[#1a1d2e] border border-gray-600/50 rounded-full p-1 flex w-fit">
                    <button
                        onClick={() => setActiveTab('1v1')}
                        className={`px-8 py-2 rounded-full text-sm font-semibold transition-all ${
                            activeTab === '1v1' ? 'bg-[#475569] text-white shadow-md' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        1v1 Battle
                    </button>
                    <button
                        onClick={() => setActiveTab('solo')}
                        className={`px-8 py-2 rounded-full text-sm font-semibold transition-all ${
                            activeTab === 'solo' ? 'bg-[#475569] text-white shadow-md' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Solo (practice on your own)
                    </button>
                </div>
            </div>

            <div className="border border-gray-600/60 rounded-2xl p-8 md:p-12 bg-brand-dark/30 max-w-[800px] mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold mb-2">
                        {activeTab === '1v1' ? '1v1 Battle' : 'Play SOLO'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {activeTab === '1v1'
                            ? 'Get matched with a random player for a head-to-head quiz battle.'
                            : 'Sharpen your axe alone in your own battle ground.'}
                    </p>
                    {activeTab === '1v1' && (
                        <p className="text-primary-light text-xs mt-2 font-medium">⏱ Timer: 60 seconds per question (fixed for battles)</p>
                    )}
                </div>

                {activeTab === '1v1' ? (
                    /* ─── 1v1 MODE: Only Category, Subject, Question Count ─── */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        <div className="flex flex-col gap-6">
                            {/* Exam / Category */}
                            <div>
                                <label className="text-gray-800 dark:text-white text-sm font-bold mb-2 block">Exam / Category</label>
                                <select
                                    className="w-full bg-[#475569]/10 dark:bg-[#475569]/60 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-500/50 rounded-lg h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
                                    style={selectStyle}
                                    value={selectedCategory}
                                    onChange={handleCategoryChange}
                                >
                                    <option value="">Select Exam</option>
                                    {categories.map(cat => (
                                        <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="text-gray-800 dark:text-white text-sm font-bold mb-2 block">Subject</label>
                                <select
                                    className="w-full bg-[#475569]/10 dark:bg-[#475569]/60 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-500/50 rounded-lg h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
                                    style={selectStyle}
                                    value={selectedSubject}
                                    onChange={handleSubjectChange}
                                    disabled={!selectedCategory || subjects.length === 0}
                                >
                                    <option value="">{subjects.length > 0 ? 'Select Subject' : 'No Subjects Available'}</option>
                                    {subjects.map(sub => (
                                        <option key={sub.subject_id} value={sub.subject_id}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            {/* Number of Questions */}
                            <div>
                                <label className="text-gray-800 dark:text-white text-sm font-bold mb-2 block">Number of Questions</label>
                                <select
                                    className="w-full bg-[#475569]/10 dark:bg-[#475569]/60 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-500/50 rounded-lg h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
                                    style={selectStyle}
                                    value={questionCount}
                                    onChange={e => setQuestionCount(e.target.value)}
                                >
                                    <option value="10">10 questions</option>
                                    <option value="20">20 questions</option>
                                    <option value="30">30 questions</option>
                                </select>
                            </div>

                            {/* Info box */}
                            <div className="bg-[#1a1d2e]/80 border border-indigo-500/20 rounded-lg p-4">
                                <p className="text-primary-light text-xs font-semibold mb-2">⚡ Battle Rules</p>
                                <ul className="text-gray-400 text-xs space-y-1">
                                    <li>• 60 seconds per question</li>
                                    <li>• Random questions from selected subject</li>
                                    <li>• All difficulties mixed</li>
                                    <li>• Both players get the same questions</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ─── SOLO MODE: Full filter options ─── */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        <div className="flex flex-col gap-6">
                            {/* Exam / Category */}
                            <div>
                                <label className="text-gray-800 dark:text-white text-sm font-bold mb-2 block">Exam / Category</label>
                                <select
                                    className="w-full bg-[#475569]/10 dark:bg-[#475569]/60 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-500/50 rounded-lg h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
                                    style={selectStyle}
                                    value={selectedCategory}
                                    onChange={handleCategoryChange}
                                >
                                    <option value="">Select Exam</option>
                                    {categories.map(cat => (
                                        <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="text-gray-800 dark:text-white text-sm font-bold mb-2 block">Subject</label>
                                <select
                                    className="w-full bg-[#475569]/10 dark:bg-[#475569]/60 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-500/50 rounded-lg h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
                                    style={selectStyle}
                                    value={selectedSubject}
                                    onChange={handleSubjectChange}
                                    disabled={!selectedCategory || subjects.length === 0}
                                >
                                    <option value="">{subjects.length > 0 ? 'Select Subject' : 'No Subjects Available'}</option>
                                    {subjects.map(sub => (
                                        <option key={sub.subject_id} value={sub.subject_id}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Topic */}
                            <div>
                                <label className="text-gray-800 dark:text-white text-sm font-bold mb-2 block">Topic</label>
                                <select
                                    className="w-full bg-[#475569]/10 dark:bg-[#475569]/60 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-500/50 rounded-lg h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
                                    style={selectStyle}
                                    value={selectedTopic}
                                    onChange={handleTopicChange}
                                    disabled={!selectedSubject || topics.length === 0}
                                >
                                    <option value="">{topics.length > 0 ? 'Select Topic' : 'No Topics Available'}</option>
                                    {topics.map(top => (
                                        <option key={top.topic_id} value={top.topic_id}>{top.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Micro-topic */}
                            <div>
                                <label className="text-gray-800 dark:text-white text-sm font-bold mb-2 block">Micro-topic (Optional)</label>
                                <select
                                    className="w-full bg-[#475569]/10 dark:bg-[#475569]/60 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-500/50 rounded-lg h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
                                    style={selectStyle}
                                    value={selectedMicroTopic}
                                    onChange={(e) => setSelectedMicroTopic(e.target.value)}
                                    disabled={!selectedTopic || microTopics.length === 0}
                                >
                                    <option value="">{microTopics.length > 0 ? 'Select Micro-Topic' : 'No Micro-Topics Available'}</option>
                                    {microTopics.map(mTop => (
                                        <option key={mTop.micro_topic_id} value={mTop.micro_topic_id}>{mTop.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            {/* Number of Questions */}
                            <div>
                                <label className="text-gray-800 dark:text-white text-sm font-bold mb-2 block">Number of Questions</label>
                                <select
                                    className="w-full bg-[#475569]/10 dark:bg-[#475569]/60 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-500/50 rounded-lg h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
                                    style={selectStyle}
                                    value={questionCount}
                                    onChange={e => setQuestionCount(e.target.value)}
                                >
                                    <option value="5">5 questions</option>
                                    <option value="10">10 questions</option>
                                    <option value="15">15 questions</option>
                                    <option value="20">20 questions</option>
                                    <option value="25">25 questions</option>
                                    <option value="30">30 questions</option>
                                </select>
                            </div>

                            {/* Time Per Question */}
                            <div>
                                <label className="text-gray-800 dark:text-white text-sm font-bold mb-2 block">Time Per Question (seconds)</label>
                                <select
                                    className="w-full bg-[#475569]/10 dark:bg-[#475569]/60 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-500/50 rounded-lg h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
                                    style={selectStyle}
                                    value={timePerQuestion}
                                    onChange={e => setTimePerQuestion(e.target.value)}
                                >
                                    <option value="10">10 seconds</option>
                                    <option value="15">15 seconds</option>
                                    <option value="20">20 seconds</option>
                                    <option value="30">30 seconds</option>
                                    <option value="45">45 seconds</option>
                                    <option value="60">60 seconds (1 min)</option>
                                    <option value="90">90 seconds (1.5 min)</option>
                                    <option value="120">120 seconds (2 min)</option>
                                    <option value="180">180 seconds (3 min)</option>
                                    <option value="240">240 seconds (4 min)</option>
                                    <option value="300">300 seconds (5 min)</option>
                                </select>
                            </div>

                            {/* Difficulty */}
                            <div>
                                <label className="text-gray-800 dark:text-white text-sm font-bold mb-2 block">Difficulty</label>
                                <select
                                    className="w-full bg-[#475569]/10 dark:bg-[#475569]/60 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-500/50 rounded-lg h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
                                    style={selectStyle}
                                    value={difficulty}
                                    onChange={e => setDifficulty(e.target.value)}
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-10">
                    <button 
                        disabled={loading}
                        onClick={handleStart}
                        className={`w-full bg-gradient-to-r from-primary to-[#7c3aed] hover:from-primary-dark hover:to-[#6d28d9] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 transition-all text-[15px] tracking-wide ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Setting up Battle Ground...' : (activeTab === '1v1' ? 'Find Opponent ⚔️' : 'Start SOLO')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuizBattle;
