import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../config/api';
import { triggerMathJax } from '../utils/mathjax';

const parseOptionValue = (val) => {
  if (!val) return { text: '', image: null };
  const strVal = String(val).trim();
  if (strVal.startsWith('{') && strVal.endsWith('}')) {
    try {
      const parsed = JSON.parse(strVal);
      if (parsed.text !== undefined || parsed.image !== undefined) {
        return { text: parsed.text || '', image: parsed.image || null };
      }
    } catch (e) {
      // Fallback
    }
  }
  if (strVal.startsWith('data:image/')) {
    return { text: '', image: strVal };
  }
  return { text: strVal, image: null };
};

function QuizPlayView() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [result, setResult] = useState(null);
    
    // Session meta
    const [quizType, setQuizType] = useState('solo');
    const [opponentName, setOpponentName] = useState(null);

    // Waiting for opponent state (1v1 sync)
    const [waitingForOpponent, setWaitingForOpponent] = useState(false);
    const pollRef = useRef(null);

    // Timer state
    const [timePerQuestion, setTimePerQuestion] = useState(60);
    const [timeLeft, setTimeLeft] = useState(60);
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const timerRef = useRef(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await authFetch(`/battle/${sessionId}/questions`);
                const data = await res.json();
                if (data.success && data.data.questions && data.data.questions.length > 0) {
                    setQuestions(data.data.questions);
                    const tpq = data.data.timePerQuestion || 60;
                    setTimePerQuestion(tpq);
                    setTimeLeft(tpq);
                    setQuestionStartTime(Date.now());
                    setQuizType(data.data.quizType || 'solo');
                    setOpponentName(data.data.opponentName || null);
                } else {
                    alert('Could not load quiz questions.');
                    navigate('/');
                }
            } catch (err) {
                console.error(err);
                alert('Error loading quiz session');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchSession();

        // Cleanup polling on unmount
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [sessionId, navigate]);

    // Run MathJax when questions or currentQuestionIdx changes
    useEffect(() => {
        if (questions.length > 0) {
            triggerMathJax();
        }
    }, [questions, currentQuestionIdx]);

    // Poll for opponent completion
    const startPolling = useCallback(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const res = await authFetch(`/battle/${sessionId}/complete`, { method: 'POST' });
                const data = await res.json();
                if (data.success && !data.data.waitingForOpponent) {
                    // Both done! Show results
                    clearInterval(pollRef.current);
                    pollRef.current = null;
                    setWaitingForOpponent(false);
                    setResult(data.data);
                    setCompleted(true);
                }
            } catch (err) {
                console.error('Poll error:', err);
            }
        }, 3000);
    }, [sessionId]);

    // Submit answer and advance (memoized for timer callback)
    const handleSubmitAndAdvance = useCallback(async () => {
        if (questions.length === 0) return;
        
        const current = questions[currentQuestionIdx];
        const currentOptions = [
            current.option_a, 
            current.option_b, 
            current.option_c, 
            current.option_d
        ].filter(Boolean);

        const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);

        // Save the answer to backend
        try {
            const answerValue = selectedOption !== null ? currentOptions[selectedOption] : '';
            await authFetch(`/battle/${sessionId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    questionId: current.id,
                    answer: answerValue,
                    timeTaken
                })
            });
        } catch (err) {
            console.error('Submit answer error', err);
        }
        
        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
            setSelectedOption(null);
            setTimeLeft(timePerQuestion);
            setQuestionStartTime(Date.now());
        } else {
            // Finish quiz — call complete
            setLoading(true);
            if (timerRef.current) clearInterval(timerRef.current);
            try {
                const res = await authFetch(`/battle/${sessionId}/complete`, { method: 'POST' });
                const completeData = await res.json();
                if (completeData.success) {
                    if (completeData.data.waitingForOpponent) {
                        // Opponent not done yet — show waiting screen & start polling
                        setLoading(false);
                        setWaitingForOpponent(true);
                        startPolling();
                    } else {
                        // Both done or solo — show results
                        setResult(completeData.data);
                        setCompleted(true);

                        // If it's a tournament attempt, record it
                        const searchParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1]);
                        const tId = searchParams.get('tournament');
                        if (tId) {
                            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                            const isUser1 = currentUser.user_id === completeData.data.user1_id;
                            const tScore = isUser1 ? completeData.data.user1Score : completeData.data.user2Score;
                            const tTime = isUser1 ? completeData.data.user1TotalTime : completeData.data.user2TotalTime;

                            authFetch(`/tournaments/${tId}/attempt`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    score: tScore,
                                    correctAnswers: tScore,
                                    totalQuestions: completeData.data.totalQuestions,
                                    timeTaken: tTime
                                })
                            }).catch(e => console.error('Failed to submit tournament attempt', e));
                        }
                    }
                } else {
                    alert('Failed to complete quiz');
                }
            } catch (err) {
                console.error('Complete error', err);
            } finally {
                setLoading(false);
            }
        }
    }, [currentQuestionIdx, questions, selectedOption, sessionId, timePerQuestion, questionStartTime, startPolling]);

    // Timer countdown effect
    useEffect(() => {
        if (loading || completed || waitingForOpponent || questions.length === 0) return;

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Time's up — auto-submit and advance
                    handleSubmitAndAdvance(true);
                    return timePerQuestion;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [loading, completed, waitingForOpponent, questions.length, currentQuestionIdx, handleSubmitAndAdvance, timePerQuestion]);

    if (loading) {
        return <div className="bg-brand-dark text-white min-h-screen p-8 flex justify-center items-center">Loading quiz...</div>;
    }

    if (questions.length === 0) {
        return <div className="bg-brand-dark text-white min-h-screen p-8 flex justify-center items-center">No questions found.</div>;
    }

    // ─── WAITING FOR OPPONENT ────────────────────────────────────
    if (waitingForOpponent) {
        return (
            <div className="bg-brand-dark text-white min-h-screen p-6 md:p-12 flex justify-center items-center">
                <div className="max-w-md w-full text-center">
                    <div className="bg-[#111827] border border-indigo-500/30 rounded-2xl p-10 shadow-2xl shadow-indigo-500/10">
                        {/* Animated hourglass */}
                        <div className="text-6xl mb-6 animate-bounce">⏳</div>
                        
                        <h2 className="text-2xl font-bold mb-3 text-white">Waiting for Opponent...</h2>
                        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                            You've finished the quiz! Waiting for <span className="text-primary-light font-semibold">{opponentName || 'your opponent'}</span> to complete their questions.
                        </p>

                        {/* Pulsing dots animation */}
                        <div className="flex justify-center gap-2 mb-6">
                            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
                        </div>
                        
                        <p className="text-gray-500 text-xs">Results will appear automatically once both players finish.</p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── RESULTS SCREEN ──────────────────────────────────────────
    if (completed && result) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const myUserId = currentUser.user_id;
        const is1v1 = result.quizType === '1v1' && result.user2_id;
        const isUser1 = String(myUserId) === String(result.user1_id);
        const myScore = isUser1 ? parseInt(result.user1Score, 10) || 0 : parseInt(result.user2Score, 10) || 0;
        const oppScore = isUser1 ? parseInt(result.user2Score, 10) || 0 : parseInt(result.user1Score, 10) || 0;
        const myTime = isUser1 ? parseInt(result.user1TotalTime, 10) || 0 : parseInt(result.user2TotalTime, 10) || 0;
        const oppTime = isUser1 ? parseInt(result.user2TotalTime, 10) || 0 : parseInt(result.user1TotalTime, 10) || 0;
        const oppName = isUser1 ? (result.user2Name || 'Opponent') : (result.user1Name || 'Opponent');
        
        let resultStatus = 'completed'; // solo
        if (is1v1) {
            if (String(result.winnerId) === String(myUserId)) resultStatus = 'won';
            else if (result.winnerId && String(result.winnerId) !== String(myUserId)) resultStatus = 'lost';
            else resultStatus = 'tie';
        }

        // Use explicit fallback — don't let JS || treat 0 as falsy
        const actualTotalQuestions = (result.totalQuestions != null && result.totalQuestions > 0)
            ? parseInt(result.totalQuestions, 10)
            : (questions.length > 0 ? questions.length : 1);
        const scorePercent = actualTotalQuestions > 0 ? Math.round((myScore / actualTotalQuestions) * 100) : 0;

        return (
            <div className="bg-brand-dark text-white min-h-screen p-6 md:p-12 flex justify-center items-start pt-12">
                <div className="max-w-xl w-full">
                    {/* Result Header */}
                    <div className="bg-[#111827] border border-indigo-500/30 rounded-2xl p-8 md:p-10 text-center shadow-2xl shadow-indigo-500/10 mb-6">
                        {/* Status Icon & Text */}
                        {is1v1 ? (
                            <>
                                {resultStatus === 'won' && (
                                    <div className="mb-6">
                                        <div className="text-6xl mb-3 animate-bounce">🏆</div>
                                        <h2 className="text-3xl font-black text-green-400">Victory!</h2>
                                        <p className="text-gray-400 text-sm mt-1">You defeated {oppName}</p>
                                    </div>
                                )}
                                {resultStatus === 'lost' && (
                                    <div className="mb-6">
                                        <div className="text-6xl mb-3">😞</div>
                                        <h2 className="text-3xl font-black text-red-400">Defeat</h2>
                                        <p className="text-gray-400 text-sm mt-1">{oppName} won this round</p>
                                    </div>
                                )}
                                {resultStatus === 'tie' && (
                                    <div className="mb-6">
                                        <div className="text-6xl mb-3">🤝</div>
                                        <h2 className="text-3xl font-black text-yellow-400">It's a Tie!</h2>
                                        <p className="text-gray-400 text-sm mt-1">Equally matched with {oppName}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="mb-6">
                                <div className="text-6xl mb-3">✅</div>
                                <h2 className="text-3xl font-black text-indigo-500">Quiz Completed!</h2>
                                <p className="text-gray-400 text-sm mt-1">Your results are ready</p>
                            </div>
                        )}

                        {/* Score Display */}
                        {is1v1 ? (
                            /* 1v1 Side-by-side scores */
                            <div className="flex items-center justify-center gap-6 mb-6">
                                {/* Your score */}
                                <div className={`flex-1 rounded-xl p-5 border ${
                                    resultStatus === 'won' ? 'bg-green-500/10 border-green-500/30' : 
                                    resultStatus === 'lost' ? 'bg-red-500/10 border-red-500/30' : 
                                    'bg-yellow-500/10 border-yellow-500/30'
                                }`}>
                                    <p className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">You</p>
                                    <p className="text-4xl font-black text-white">{myScore}</p>
                                    <p className="text-gray-500 text-xs mt-1">/ {actualTotalQuestions}</p>
                                    {myTime > 0 && (
                                        <p className="text-gray-500 text-xs mt-2">
                                            ⏱ {Math.floor(myTime / 60)}m {myTime % 60}s
                                        </p>
                                    )}
                                </div>

                                {/* VS */}
                                <div className="text-gray-600 text-lg font-black">VS</div>

                                {/* Opponent score */}
                                <div className={`flex-1 rounded-xl p-5 border ${
                                    resultStatus === 'lost' ? 'bg-green-500/10 border-green-500/30' : 
                                    resultStatus === 'won' ? 'bg-red-500/10 border-red-500/30' : 
                                    'bg-yellow-500/10 border-yellow-500/30'
                                }`}>
                                    <p className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">{oppName}</p>
                                    <p className="text-4xl font-black text-white">{oppScore}</p>
                                    <p className="text-gray-500 text-xs mt-1">/ {actualTotalQuestions}</p>
                                    {oppTime > 0 && (
                                        <p className="text-gray-500 text-xs mt-2">
                                            ⏱ {Math.floor(oppTime / 60)}m {oppTime % 60}s
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Solo score */
                            <div className="mb-6">
                                <div className="text-indigo-500 text-6xl font-black mb-2 drop-shadow-md">
                                    {myScore} <span className="text-3xl text-gray-500">/ {actualTotalQuestions}</span>
                                </div>
                                <div className="text-gray-400 text-sm">
                                    Accuracy: {scorePercent}%
                                </div>
                                {myTime > 0 && (
                                    <p className="text-gray-500 text-sm mt-2">
                                        Total time: {Math.floor(myTime / 60)}m {myTime % 60}s
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Score bar */}
                        <div className="w-full bg-[#1a1d2e] rounded-full h-3 mb-6 overflow-hidden">
                            <div
                                className={`h-3 rounded-full transition-all duration-1000 ${
                                    scorePercent >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                                    scorePercent >= 40 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                                    'bg-gradient-to-r from-red-500 to-rose-400'
                                }`}
                                style={{ width: `${scorePercent}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate('/battle')}
                            className="w-full bg-gradient-to-r from-primary to-[#7c3aed] hover:from-primary-dark hover:to-[#6d28d9] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-primary/30"
                        >
                            {is1v1 ? 'Play Another Battle ⚔️' : 'Play Again'}
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-[#1a1d2e] border border-gray-600 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                        >
                            Go to Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/explore')}
                            className="w-full bg-[#1a1d2e] border border-gray-600 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                        >
                            Explore More Quizzes
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── QUIZ QUESTION VIEW ──────────────────────────────────────
    const current = questions[currentQuestionIdx];
    const totalQuestions = questions.length;
    const progress = ((currentQuestionIdx + 1) / totalQuestions) * 100;
    const optionLetters = ['A', 'B', 'C', 'D'];
    
    const currentOptions = [
       current.option_a, 
       current.option_b, 
       current.option_c, 
       current.option_d
    ].filter(Boolean);

    // Timer color based on urgency
    const timerColor = timeLeft <= 10 ? 'text-red-500' : timeLeft <= 20 ? 'text-yellow-400' : 'text-white';
    const timerBgColor = timeLeft <= 10 ? 'bg-red-500/20 border-red-500/50' : timeLeft <= 20 ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-[#1a1d2e] border-gray-600';

    const handleNext = () => {
        if (selectedOption === null) return;
        handleSubmitAndAdvance(false);
    };

    return (
        <div className="bg-brand-dark text-white min-h-screen p-4 md:p-8">
            <div className="max-w-[1000px] w-full mx-auto">
                {/* Top bar: badges + opponent + timer */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <span className="border border-gray-500 text-white text-xs font-semibold px-3 py-1 rounded">
                            {current.exam || 'General'}
                        </span>
                        <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded">
                            {current.difficulty_label || 'Medium'}
                        </span>
                        {quizType === '1v1' && opponentName && (
                            <span className="bg-indigo-500/20 text-primary-light text-xs font-semibold px-3 py-1 rounded border border-indigo-500/30">
                                ⚔️ vs {opponentName}
                            </span>
                        )}
                    </div>

                    {/* Timer */}
                    <div className={`${timerBgColor} border rounded-lg px-4 py-2 flex items-center gap-2 transition-colors`}>
                        <svg className={`w-5 h-5 ${timerColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`${timerColor} text-lg font-bold font-mono min-w-[40px] text-center ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
                            {timeLeft}s
                        </span>
                    </div>
                </div>

                {/* Progress */}
                <div className="mb-6">
                    <p className="text-sm text-gray-300 mb-2 font-medium">
                        Question {currentQuestionIdx + 1} of {totalQuestions}
                    </p>
                    <div className="w-full bg-[#1a1d2e] rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-[#111827] border border-white/10 rounded-xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Conditional Image */}
                        {current.question_image_url && (
                            <div className="md:w-[45%] shrink-0">
                                <img
                                    src={current.question_image_url}
                                    alt="Question illustration"
                                    className="w-full h-auto rounded-lg object-cover"
                                />
                            </div>
                        )}

                        {/* Right: Question + Options */}
                        <div className="flex-1 flex flex-col">
                            <h2 className="text-lg font-semibold mb-6 leading-relaxed">
                                {current.full_question_text || current.text}
                            </h2>

                            {/* Options */}
                            <div className="flex flex-col gap-3">
                                {currentOptions.map((option, idx) => {
                                    const parsedOpt = parseOptionValue(option);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedOption(idx)}
                                            className={`flex items-center gap-4 p-3.5 rounded-lg border transition-all text-left
                                                ${selectedOption === idx
                                                    ? 'border-primary bg-primary/15 text-white'
                                                    : 'border-gray-700 bg-[#1a1d2e]/50 text-gray-300 hover:border-gray-500 hover:bg-[#1a1d2e]'
                                                }`}
                                        >
                                            <span
                                                className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm shrink-0 transition-colors
                                                    ${selectedOption === idx
                                                        ? 'bg-primary text-white'
                                                        : 'bg-[#2a2d3e] text-gray-400'
                                                    }`}
                                            >
                                                {optionLetters[idx]}
                                            </span>
                                            <div className="flex flex-col gap-2 w-full">
                                                {parsedOpt.text && <span className="font-medium text-sm">{parsedOpt.text}</span>}
                                                {parsedOpt.image && (
                                                    <img
                                                        src={parsedOpt.image}
                                                        alt={`Option ${optionLetters[idx]}`}
                                                        className="max-h-24 object-contain rounded-lg border border-gray-700/50 bg-white/5 self-start"
                                                    />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleNext}
                        disabled={selectedOption === null}
                        className={`px-8 py-3 rounded-lg font-bold transition-all
                            ${selectedOption !== null
                                ? 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30'
                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {currentQuestionIdx < totalQuestions - 1 ? 'Next Question →' : 'Submit Quiz →'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuizPlayView;
