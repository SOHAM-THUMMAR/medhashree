import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../config/api';
import { triggerMathJax } from '../utils/mathjax';
import PremiumQuizCard from '../components/PremiumQuizCard';
import SEOHead from '../components/SEOHead';

const parseOptionValue = (val) => {
  if (!val) return { text: '', image: null };
  const strVal = String(val).trim();
  if (strVal.startsWith('{') && strVal.endsWith('}')) {
    try {
      const parsed = JSON.parse(strVal);
      if (parsed.text !== undefined || parsed.image !== undefined) {
        return { text: parsed.text || '', image: parsed.image || null };
      }
    } catch {
      // Fallback
    }
  }
  if (strVal.startsWith('data:image/')) {
    return { text: '', image: strVal };
  }
  return { text: strVal, image: null };
};

function SolvedPapers({ isPublic = false }) {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected paper state
  const [viewingPaper, setViewingPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // Keep track of which accordion panels are open
  // Format: { [questionId]: { hint: boolean, explanation: boolean, answer: boolean } }
  const [accordionState, setAccordionState] = useState({});

  // Question Traversal Jump Search State
  const [searchQNumber, setSearchQNumber] = useState('');
  const readerRef = useRef(null);
  const showJumpBar = Boolean(viewingPaper && questions.length > 0);

  useEffect(() => {
    const fetchSolvedPapers = async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/quizzes/solved-papers');
        const data = await res.json();
        if (data.success) {
          setPapers(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch solved papers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSolvedPapers();
  }, []);

  // Run MathJax when questions or accordionState changes
  useEffect(() => {
    if (questions.length > 0) {
      triggerMathJax();
    }
  }, [questions, accordionState]);

  const handleSelectPaper = async (paper) => {
    setViewingPaper(paper);
    setLoadingQuestions(true);
    setQuestions([]);
    setAccordionState({});
    setSearchQNumber('');
    
    try {
      const res = await apiFetch(`/quizzes/solved-papers/${paper.id}/questions`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch solved paper questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleBackToList = () => {
    setViewingPaper(null);
    setQuestions([]);
    setSearchQNumber('');
  };

  const toggleAccordion = (qId, panel) => {
    setAccordionState(prev => {
      const current = prev[qId] || { hint: false, explanation: false, answer: false };
      return {
        ...prev,
        [qId]: {
          ...current,
          [panel]: !current[panel]
        }
      };
    });
  };

  // Traversal Jump Handler
  const handleJumpToQuestion = () => {
    const num = parseInt(searchQNumber);
    if (!num || num < 1 || num > questions.length) return;
    const element = document.getElementById(`question-row-${num}`);
    if (element) {
      // Scroll smoothly to question center
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Visual feedback glowing highlights
      element.classList.add('bg-indigo-500/[0.04]', 'dark:bg-indigo-500/[0.06]', 'ring-2', 'ring-indigo-500/25', 'rounded-2xl', 'p-4');
      setTimeout(() => {
        element.classList.remove('bg-indigo-500/[0.04]', 'dark:bg-indigo-500/[0.06]', 'ring-2', 'ring-indigo-500/25', 'rounded-2xl', 'p-4');
      }, 3000);
    }
  };

  // Group papers by Subject/Exam
  const groupedPapers = papers.reduce((acc, paper) => {
    const key = paper.category || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(paper);
    return acc;
  }, {});

  // Sort papers chronologically (descending years) inside each group
  Object.keys(groupedPapers).forEach(key => {
    groupedPapers[key].sort((a, b) => b.year - a.year);
  });

  // Calculate reading time based on question count
  const getReadingTime = (qCount) => {
    const mins = Math.max(5, Math.ceil((qCount || 0) * 1.5));
    return `${mins} min read`;
  };

  return (
    <>
    <SEOHead title={viewingPaper ? viewingPaper.file_name : "Solved PYQs & Papers"} description="Browse and solve previous year question papers (PYQs) for entrance exams like JEE, NEET, GATE, and SSC CGL on Medhashree." />
    <div className={`min-h-screen text-black dark:text-white ${isPublic ? 'bg-gray-50 dark:bg-[#080710] selection:bg-indigo-500 selection:text-white relative overflow-x-hidden pb-16' : 'pb-12 pt-6'}`}>
      
      {/* Dynamic Background Glowing Blobs for Public Guest Mode */}
      {isPublic && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-indigo-900/20 blur-[150px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[55%] bg-purple-900/15 blur-[130px] rounded-full pointer-events-none"></div>
        </>
      )}

      {/* Guest Navigation Bar */}
      {isPublic && (
        <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-gray-200 dark:border-white/5 mb-10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent italic tracking-wider">
              MEDHASHREE
            </span>
            <span className="bg-indigo-500/20 border border-indigo-500/40 text-[#a5b4fc] text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded-full uppercase">
              League
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-semibold px-3 py-1.5"
            >
              Home
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-semibold"
            >
              Log In
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md shadow-indigo-600/20"
            >
              Get Started
            </button>
          </div>
        </nav>
      )}

      <div className={`relative z-10 max-w-[1200px] mx-auto px-4 md:px-6`}>
        
        {/* VIEW 1: Solved Papers subject list grouped by timeline chains */}
        {!viewingPaper ? (
          <div>
            {/* Top Banner */}
            <div className={`w-full bg-gradient-to-r from-indigo-600 via-purple-700 to-brand-dark rounded-3xl py-12 px-8 md:px-12 mb-12 shadow-2xl relative overflow-hidden ${!isPublic && 'mt-4'}`}>
              <div className="absolute top-0 right-0 w-[40%] h-[150%] bg-[#9333ea]/20 blur-[100px] rounded-full pointer-events-none"></div>
              <span className="inline-block bg-white/10 border border-white/20 text-indigo-200 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                Previous Year Question Papers
              </span>
              <h1 className="font-extrabold text-3xl md:text-5xl text-white mb-4 tracking-wide leading-tight">
                Fully Solved Papers Archive
              </h1>
              <p className="text-[#c7d2fe] text-base md:text-lg max-w-2xl font-light leading-relaxed">
                Step-by-step solved previous year exam papers. Study step-by-step logic, micro-hints, and detailed mathematical explanations.
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-medium">Fetching solved papers archive...</p>
              </div>
            ) : Object.keys(groupedPapers).length > 0 ? (
              <div className="space-y-12">
                {Object.entries(groupedPapers).map(([subject, subjectPapers]) => (
                  <div key={subject} className="bg-white dark:bg-[#0d0e16]/60 border border-gray-200 dark:border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl transition-all hover:border-indigo-500/20">
                    {/* Subject/Exam Heading */}
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-2.5 h-7 bg-indigo-500 rounded-full"></div>
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
                        {subject}
                      </h2>
                      <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 text-xs font-bold px-3 py-0.5 rounded-full">
                        {subjectPapers.length} Papers
                      </span>
                    </div>

                    {/* Responsive Grid Layout (4 per line on desktop) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {subjectPapers.map((paper) => (
                        <PremiumQuizCard
                           key={paper.id}
                           title={paper.title}
                           badge={`YEAR ${paper.year}`}
                           rightMeta={`${paper.questionsCount} Questions`}
                           leftMeta={getReadingTime(paper.questionsCount)}
                           actionText="Read Solution"
                           onClick={() => handleSelectPaper(paper)}
                           className="w-full"
                         />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-16 border border-gray-200 dark:border-white/10 rounded-3xl bg-white dark:bg-brand-surface shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25H5.625A2.25 2.25 0 013.375 18V6.125c0-.621.504-1.125 1.125-1.125H9.75M8.25 21h8.25F18.75 21 20.25 19.5 20.25 17.75v-11.5c0-1.75-1.5-3.25-3.25-3.25H8.25C6.5 3 5 4.5 5 6.25v11.5C5 19.5 6.5 21 8.25 21z" />
                </svg>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Solved Papers Available</h3>
                <p className="max-w-md mx-auto text-sm text-gray-500">Solved PYQ papers uploaded by admin will appear here automatically.</p>
              </div>
            )}
          </div>
        ) : (
          
          /* VIEW 2: Premium Blog Style Question Reader Pane */
          <div className="max-w-[850px] mx-auto" ref={readerRef}>
            {/* Navigation back and header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-white/10">
              <button 
                onClick={handleBackToList}
                className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-gray-200 dark:border-white/10 hover:border-indigo-500/20 px-4 py-2 rounded-xl bg-white dark:bg-brand-surface shadow-sm"
              >
                &larr; Back to Solved Papers
              </button>
              
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Published in <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold uppercase">{viewingPaper.category}</strong>
              </span>
            </div>

            {/* Jump bar rendered via fixed position below */}

            {/* Premium Article Cover Header */}
            <header className="mb-12 text-left">
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                {viewingPaper.title}
              </h1>

              {/* Author, Date, Reading Time Metadata (Medium style) */}
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-50 to-purple-600 flex items-center justify-center font-bold text-white text-lg">
                  MS
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors text-[15px]">
                      MEDHASHREE Expert Team
                    </span>
                    <span className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                      VERIFIED
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <span>{new Date(viewingPaper.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>&bull;</span>
                    <span>{getReadingTime(viewingPaper.questionsCount)}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> Live Solution
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Questions Pane */}
            {loadingQuestions ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Decoding explanations & formulas...</p>
              </div>
            ) : questions.length > 0 ? (
              <div className="space-y-16">
                {questions.map((q, index) => {
                  const state = accordionState[q.question_id] || { hint: false, explanation: false, answer: false };
                  
                  return (
                    <article 
                      key={q.question_id} 
                      id={`question-row-${index + 1}`}
                      className="py-8 border-b border-gray-200 dark:border-white/10 text-left tex2jax_process transition-all duration-500"
                    >
                      {/* Question Index & Meta */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <span className="font-mono font-bold text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                          QUESTION {index + 1}
                        </span>
                        
                        <div className="flex gap-2">
                          {q.difficulty_label && (
                            <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded border ${
                              q.difficulty_label === 'Easy' ? 'bg-green-500/10 text-green-600 border-green-500/25' :
                              q.difficulty_label === 'Medium' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/25' :
                              'bg-red-500/10 text-red-500 border-red-500/25'
                            }`}>
                              {q.difficulty_label}
                            </span>
                          )}
                          {q.year && (
                            <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/25">
                              {q.year}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Text with MathJax Support */}
                      <h3 className="font-extrabold text-xl md:text-2xl text-gray-800 dark:text-gray-100 leading-relaxed mb-8">
                        {q.full_question_text}
                      </h3>

                      {/* Render question image if available */}
                      {q.question_image_url && (
                        <div className="mb-8 max-w-[450px] overflow-hidden rounded-2xl border border-gray-250 dark:border-white/10 shadow-sm bg-white dark:bg-brand-surfaceAlt/20">
                          <img
                            src={q.question_image_url}
                            alt={`Illustration for question ${index + 1}`}
                            className="w-full h-auto object-cover max-h-[300px]"
                          />
                        </div>
                      )}

                      {/* Option Layout */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        {[
                          { key: 'A', value: q.option_a },
                          { key: 'B', value: q.option_b },
                          { key: 'C', value: q.option_c },
                          { key: 'D', value: q.option_d }
                        ].map((opt) => {
                          if (!opt.value) return null;
                          const parsedOpt = parseOptionValue(opt.value);
                          return (
                            <div 
                              key={opt.key}
                              className={`flex items-center gap-3 border rounded-xl p-4 transition-all ${
                                state.answer && q.correct_answer?.trim().toUpperCase() === opt.key 
                                  ? 'bg-green-500/15 border-green-500/50 text-green-700 dark:text-green-300 font-extrabold shadow-sm'
                                  : 'bg-white dark:bg-brand-surfaceAlt border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <span className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg font-bold font-mono text-[13px] ${
                                state.answer && q.correct_answer?.trim().toUpperCase() === opt.key
                                  ? 'bg-green-500/20 text-green-500 border border-green-500/35'
                                  : 'bg-gray-100 dark:bg-brand-surface text-gray-500 dark:text-gray-400'
                              }`}>
                                {opt.key}
                              </span>
                              <div className="flex flex-col gap-2 w-full">
                                {parsedOpt.text && <span className="text-sm font-semibold">{parsedOpt.text}</span>}
                                {parsedOpt.image && (
                                  <img
                                    src={parsedOpt.image}
                                    alt={`Option ${opt.key}`}
                                    className="max-h-24 object-contain rounded-lg border border-gray-100 dark:border-white/5 self-start"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* THREE Premium Custom Accordions: Hint, Explanation, Reveal Answer */}
                      <div className="space-y-3 mt-8">
                        {/* 1. HINT ACCORDION */}
                        {q.hint && (
                          <div className="border border-indigo-100 dark:border-indigo-500/10 rounded-xl overflow-hidden bg-indigo-50/30 dark:bg-indigo-950/10">
                            <button
                              onClick={() => toggleAccordion(q.question_id, 'hint')}
                              className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-500/10 transition-colors focus:outline-none select-none"
                            >
                              <span className="flex items-center gap-2.5">
                                <span className="text-indigo-600 dark:text-indigo-400">💡</span> Hint / Logic Direction
                              </span>
                              <span className={`text-indigo-600 dark:text-indigo-400 transition-transform duration-300 text-[16px] ${state.hint ? 'rotate-180' : ''}`}>
                                &#9662;
                              </span>
                            </button>
                            {state.hint && (
                              <div className="px-6 pb-5 pt-3 text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed font-medium border-t border-indigo-100 dark:border-indigo-500/10">
                                {q.hint}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. REVEAL ANSWER ACCORDION */}
                        <div className="border border-green-100 dark:border-green-500/20 rounded-xl overflow-hidden bg-green-50/20 dark:bg-green-950/10">
                          <button
                            onClick={() => toggleAccordion(q.question_id, 'answer')}
                            className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-sm text-gray-700 dark:text-gray-300 hover:bg-green-500/10 transition-colors focus:outline-none select-none"
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="text-green-600 dark:text-green-500">🎯</span> Correct Option
                            </span>
                            <span className={`text-green-600 dark:text-green-500 transition-transform duration-300 text-[16px] ${state.answer ? 'rotate-180' : ''}`}>
                              &#9662;
                            </span>
                          </button>
                          {state.answer && (
                            <div className="px-6 pb-5 pt-3 border-t border-green-100 dark:border-green-500/10">
                              <div className="inline-flex items-center gap-3 bg-green-100/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/35 px-4 py-2 rounded-xl text-green-700 dark:text-green-400 font-extrabold text-sm">
                                <span>Correct Answer:</span>
                                <span className="bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black font-mono">
                                  {q.correct_answer?.trim().charAt(0) || 'A'}
                                </span>
                                <span>{q.correct_answer}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. EXPLANATION ACCORDION */}
                        {q.explanation && (
                          <div className="border border-purple-100 dark:border-purple-500/20 rounded-xl overflow-hidden bg-purple-50/20 dark:bg-purple-950/10">
                            <button
                              onClick={() => toggleAccordion(q.question_id, 'explanation')}
                              className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-500/10 transition-colors focus:outline-none select-none"
                            >
                              <span className="flex items-center gap-2.5">
                                <span className="text-purple-600 dark:text-purple-400">📝</span> Comprehensive Explanation
                              </span>
                              <span className={`text-purple-600 dark:text-purple-400 transition-transform duration-300 text-[16px] ${state.explanation ? 'rotate-180' : ''}`}>
                                &#9662;
                              </span>
                            </button>
                            {state.explanation && (
                              <div className="px-6 pb-6 pt-4 text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed font-medium border-t border-purple-100 dark:border-purple-500/10 bg-purple-500/[0.01]">
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-20">
                <p>No questions found in this paper.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

      {/* Fixed Jump-to-Question Bar — rendered outside all overflow containers */}
      {showJumpBar && (
        <div 
          className="fixed z-[9999] flex items-center gap-2 bg-white/95 dark:bg-[#0d0e16]/95 border border-gray-200 dark:border-white/10 p-1.5 px-3 rounded-2xl shadow-2xl backdrop-blur-md hover:border-indigo-500/30 transition-all top-[5.5rem] right-4 lg:top-24 lg:right-6 max-sm:scale-90 max-sm:right-2"
        >
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 select-none font-mono">Q#</span>
          <input 
            type="number"
            min="1"
            max={questions.length}
            placeholder={`1-${questions.length}`}
            value={searchQNumber}
            onChange={(e) => setSearchQNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJumpToQuestion();
            }}
            className="w-16 bg-gray-50 dark:bg-brand-surfaceAlt border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-center font-bold font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-black dark:text-white"
          />
          <button 
            onClick={handleJumpToQuestion}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-sm shadow-indigo-500/10"
          >
            Go
          </button>
        </div>
      )}
    </>
  );
}

export default SolvedPapers;
