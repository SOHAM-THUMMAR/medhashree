import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizCard from '../components/QuizCard';
import { apiFetch, authFetch } from '../config/api';
import { useSearch } from '../context/SearchContext';

const howItWorksSteps = [
  {
    step: 1,
    title: 'Browse Self Study Paths',
    description: 'Explore our wide range of self study paths to find topics that interest you.',
    emoji: '📚',
    gradient: 'from-blue-600 to-cyan-500'
  },
  {
    step: 2,
    title: 'Take Quizzes',
    description: 'Challenge yourself with quizzes of varying difficulty levels and formats.',
    emoji: '🎯',
    gradient: 'from-purple-600 to-pink-500'
  },
  {
    step: 3,
    title: 'Earn Rewards',
    description: 'Collect points, badges, and climb the leaderboard as you complete quizzes.',
    emoji: '🏆',
    gradient: 'from-amber-500 to-orange-600'
  }
];

function Home() {
  const navigate = useNavigate();
  const { debouncedQuery } = useSearch();
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, catRes] = await Promise.all([
          apiFetch('/quizzes/latest'),
          apiFetch('/self-study')
        ]);
        
        const quizData = await quizRes.json();
        const catData = await catRes.json();

        if (quizData.success) {
          setQuizzes(quizData.data.length > 0 ? quizData.data : []);
        }
        
        if (catData.success) {
          const formattedCats = catData.data.map((c, i) => {
             const gradients = [
               "from-[#004D4D]/40 to-[#00A3A3]/20",
               "from-[#0F172A]/40 to-[#2563EB]/20",
               "from-[#422006]/40 to-[#A16207]/20",
               "from-[#450A0A]/40 to-[#7F1D1D]/20",
               "from-[#7F1D1D]/40 to-[#EF4444]/20"
             ];
             const borders = [
                "border-[#00A3A3]/50", "border-[#2563EB]/50", "border-[#A16207]/50", "border-[#7F1D1D]/50", "border-[#EF4444]/50"
             ];
             return {
                id: c.category_id,
                name: c.name,
                gradient: gradients[i % gradients.length],
                border: borders[i % borders.length]
             };
          });
          setCategories(formattedCats);
        }
      } catch (error) {
         console.error("Home fetch error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePlayQuiz = async (fileId) => {
    // Requires auth to play
    if (!localStorage.getItem('token')) {
      alert("Please login to play the quiz!");
      navigate('/login');
      return;
    }
    
    try {
      const res = await authFetch('/battle/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quiz_type: 'solo',
          file_id: fileId
        })
      });
      const data = await res.json();
      if (data.success) {
         navigate(`/play/${data.data.session.session_id}`);
      } else {
         alert("Failed to start quiz: " + data.message);
      }
    } catch {
      alert("Failed to create session");
    }
  };

  return (
    <div className="max-w-[1400px]">
      {/* Hero */}
      <div className="bg-[#110e1b] bg-gradient-to-r from-brand-indigoDark/80 to-[#0B0E14] text-white rounded-2xl lg:rounded-[2rem] p-6 sm:p-10 lg:p-16 mb-10 lg:mb-16 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[150%] bg-primary/20 blur-[120px] rounded-full"></div>
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[100%] bg-[#9333EA]/10 blur-[100px] rounded-full"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 leading-tight">
            Your Quiz Adventure Starts Here: <br />
            Play, Share, Earn!
          </h1>
          <p className="text-gray-300 text-sm sm:text-lg lg:text-xl max-w-2xl mb-6 sm:mb-10 font-light">
            Build engaging quizzes, challenge others, and earn rewards
            for your knowledge.
          </p>

          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigate('/create')} className="bg-white text-black px-8 py-3.5 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg shadow-white/10">
              Create Quiz
            </button>
            <button onClick={() => navigate('/tournaments')} className="bg-[#5B4DFF] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#4B3DE0] transition-colors shadow-lg shadow-[#5B4DFF]/20">
              Join Contest
            </button>
          </div>
        </div>
      </div>

      {/* Latest Quizzes */}
      <h2 className="text-2xl font-semibold mb-6 text-white">Latest Quizzes</h2>

      {loading ? (
         <div className="text-white mb-16">Loading quizzes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {quizzes.length > 0 ? quizzes.filter(item => !debouncedQuery || item.title?.toLowerCase().includes(debouncedQuery) || item.category?.toLowerCase().includes(debouncedQuery)).map((item) => (
            <QuizCard
              key={item.id}
              title={item.title}
              category={item.category}
              image={item.image}
              difficulty="Medium"
              buttonLink={null}
              onPlay={() => handlePlayQuiz(item.id)}
            />
          )) : (
            <div className="text-gray-400">No quizzes available yet.</div>
          )}
        </div>
      )}

      {/* Self Study Paths */}
      <h2 className="text-2xl font-semibold mb-6 text-white">Self Study Paths</h2>
 
      {loading ? (
        <div className="text-white mb-16">Loading self study paths...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 mb-10 lg:mb-16">
          {categories.length > 0 ? categories.filter(cat => !debouncedQuery || cat.name?.toLowerCase().includes(debouncedQuery)).map((cat) => (
            <div
              key={cat.id || cat.name}
              onClick={() => navigate(`/explore?category=${cat.id}`)}
              className={`bg-[#0d1017] bg-gradient-to-b ${cat.gradient} rounded-2xl h-[140px] flex items-center justify-center shadow-lg border ${cat.border} hover:-translate-y-1 cursor-pointer transition-transform duration-300 relative overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient} opacity-20`}></div>
              <span className="text-white text-xl font-extrabold tracking-wider uppercase relative z-10 drop-shadow-md">
                {cat.name}
              </span>
            </div>
          )) : (
             <div className="text-gray-400 col-span-5">No self study paths available.</div>
          )}
        </div>
      )}

      {/* How it Works Section */}
      <div className="border border-primary/30 bg-[#0d0f14]/50 rounded-2xl lg:rounded-[2rem] p-6 sm:p-10 lg:p-16 mb-10 lg:mb-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

        <div className="flex flex-col items-center mb-16 relative z-10">
          <div className="border border-white/20 text-gray-300 px-5 py-1.5 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            Simple Process
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">How it Works</h2>
          <p className="text-gray-400 text-center max-w-2xl">
            Getting started with our quiz platform is very easy. Follow these steps to begin your quiz journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {howItWorksSteps.map((step) => (
            <div key={step.step} className="flex flex-col relative group">
              <div className="bg-[#1a1d24] rounded-2xl p-4 border border-white/5 mb-8 relative z-10 transition-transform duration-300 group-hover:-translate-y-2">
                <div className={`w-full h-[180px] rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center`}>
                  <span className="text-6xl drop-shadow-lg">{step.emoji}</span>
                </div>
              </div>

              <div className="absolute top-[50%] -translate-y-[50%] -left-4 w-10 h-10 bg-[#2d2459] border border-[#5B4DFF] rounded-full flex items-center justify-center text-white font-bold z-20 shadow-lg shadow-[#5B4DFF]/20">
                {step.step}
              </div>

              <div className="px-2">
                <h3 className="text-white font-bold text-xl mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="border border-primary/30 bg-[#0d0f14]/50 rounded-2xl lg:rounded-[2rem] p-6 sm:p-10 lg:p-16 relative overflow-hidden flex flex-col items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

        <h2 className="text-3xl font-bold text-white mb-4 tracking-wide relative z-10">Medhashree</h2>
        <p className="text-gray-400 text-sm text-center max-w-xl mb-16 relative z-10">
          Create engaging quizzes, challenge others, and earn rewards for your knowledge. Join our community of quiz creators and players today.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-32 w-full max-w-4xl relative z-10 mb-16">
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white font-semibold mb-6 text-lg">Quick Links</h3>
            <ul className="space-y-4 text-gray-400 text-sm flex flex-col items-center md:items-start">
              <li><a href="#/dashboard" className="hover:text-[#5B4DFF] transition-colors">• Dashboard</a></li>
              <li><a href="#/create" className="hover:text-[#5B4DFF] transition-colors">• Create Quiz</a></li>
              {/* <li><a href="#/leaderboard" className="hover:text-[#5B4DFF] transition-colors">• Leaderboard</a></li> */}
              <li><a href="#/explore" className="hover:text-[#5B4DFF] transition-colors">• Explore Quiz</a></li>
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white font-semibold mb-6 text-lg">Self Study</h3>
            <ul className="space-y-4 text-gray-400 text-sm flex flex-col items-center md:items-start">
              {categories.length > 0 ? categories.slice(0, 5).map(cat => (
                <li key={cat.id || cat.name}><a href={`#/explore?category=${cat.id}`} className="hover:text-[#5B4DFF] transition-colors">• {cat.name}</a></li>
              )) : (
                <li className="text-gray-500">Loading...</li>
              )}
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white font-semibold mb-6 text-lg">Contact Us</h3>
            <ul className="space-y-4 text-gray-400 text-sm flex flex-col items-center md:items-start">
              <li>• email : abc@example.com</li>
              <li>• contact : +91 3456223478</li>
            </ul>
          </div>
        </div>

        <button className="bg-[#5B4DFF]/20 text-[#8B80F9] border border-[#5B4DFF]/50 px-8 py-3 rounded-full font-semibold hover:bg-[#5B4DFF]/30 transition-colors relative z-10 text-sm">
          Contact Support
        </button>
      </div>
    </div>
  );
}

export default Home;