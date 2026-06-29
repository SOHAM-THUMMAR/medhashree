import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';
import SEOHead from '../components/SEOHead';
import { OrganizationSchema, WebSiteSchema, FAQSchema } from '../components/StructuredData';

function Landing() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [settings, setSettings] = useState({
    landing_hero_badge: 'New Seeded Tournaments Live',
    landing_hero_title: 'The Ultimate Competitive Quiz Battleground for Tech Elite',
    landing_hero_subtitle: 'Unlock your true capacity. Participate in premium, curated engineering contests spanning React 19 architecture, JavaScript memory leak audits, and PostgreSQL optimization models.',
    landing_compete_btn_text: 'Compete Now',
    landing_explore_btn_text: 'Explore Quizzes',
    landing_stats_1_value: '10,000+',
    landing_stats_1_label: 'Expert Audited Questions',
    landing_stats_2_value: '50,000+',
    landing_stats_2_label: 'Completed Battles',
    landing_stats_3_value: '100%',
    landing_stats_3_label: 'Interactive Feedback Loop',

    // Brand & Nav
    brand_logo_text: 'MEDHASHREE',
    brand_logo_badge: 'League',
    brand_nav_login_text: 'Log In',
    brand_nav_signup_text: 'Get Started',
    brand_footer_copyright: '© 2026',
    brand_footer_link_1: 'Play',
    brand_footer_link_2: 'Sign Up',
    brand_footer_link_3: 'Support',

    // Tournaments Header
    landing_tournaments_title: 'Compete in Premium Seeded Tournaments',
    landing_tournaments_subtitle: 'These exclusive tournaments are populated with verified expert questions and isolated from search filters.',

    // Tournament Cards
    landing_tournament_1_icon: '⚛️',
    landing_tournament_1_badge: 'React 19 & RSCs',
    landing_tournament_1_name: 'React Mastermind League',
    landing_tournament_1_difficulty: 'Expert',
    landing_tournament_1_questions: '3',
    landing_tournament_1_desc: 'Test your mastery of Server Components, React 19 Hooks, rendering lifecycles, and modern state architectures.',

    landing_tournament_2_icon: '💛',
    landing_tournament_2_badge: 'ESNext & Event Loop',
    landing_tournament_2_name: 'JavaScript Champions Cup',
    landing_tournament_2_difficulty: 'Advanced',
    landing_tournament_2_questions: '3',
    landing_tournament_2_desc: 'Crack core concepts including the Javascript Event Loop,WeakMap collections, memory optimizations, and async schedules.',

    landing_tournament_3_icon: '🗄️',
    landing_tournament_3_badge: 'PostgreSQL & SQL Core',
    landing_tournament_3_name: 'Database Titans Arena',
    landing_tournament_3_difficulty: 'Hard',
    landing_tournament_3_questions: '3',
    landing_tournament_3_desc: 'Conquer advanced LATERAL joins, composite index patterns, execution plan tunings, and transactional control.',

    // Features
    landing_feature_1_emoji: '⚡',
    landing_feature_1_title: 'Solo Exploration',
    landing_feature_1_desc: 'Hone your skills in standard quizzes across core languages with detailed answers to level up your knowledge.',
    landing_feature_2_emoji: '🏆',
    landing_feature_2_title: 'Premium Tournaments',
    landing_feature_2_desc: 'Participate in time-bound, competitive leagues designed by experts and fight for the top leaderboard rank.',
    landing_feature_3_emoji: '🧠',
    landing_feature_3_title: 'Dynamic Explanations',
    landing_feature_3_desc: 'Every single question includes a comprehensive explanation block with references, enabling real growth.',

    // FAQs
    landing_faq_title: 'Frequently Asked Questions',
    landing_faq_1_q: 'How do I participate in tournaments?',
    landing_faq_1_a: 'Simply click "Get Started" to register your account. Once registered, log in to access the active Tournaments board, select your desired league, and click "Play Now"!',
    landing_faq_2_q: 'Can I upload custom quizzes?',
    landing_faq_2_a: 'Absolutely! Users with an instructor or administrator role can build custom quizzes and tournaments by uploading CSV files directly via our admin console.',
    landing_faq_3_q: 'What makes Medhashree different?',
    landing_faq_3_a: 'We isolate tournament-bound, highly challenging premium questions from regular search feeds, combining high-octane battles with elite learning feedback.',

    // Mock Battle
    landing_mock_arena_title: 'QUIZ-MATCH://BATTLE-ARENA',
    landing_mock_badge: 'LIVE',
    landing_mock_p1_label: 'YOU',
    landing_mock_p1_name: 'Dev_Mastermind',
    landing_mock_p1_pts: '950',
    landing_mock_p1_pct: '92',
    landing_mock_question_header: 'QUESTION 3 OF 3',
    landing_mock_question_text: 'WeakMap key collection?',
    landing_mock_vs_text: 'VS',
    landing_mock_p2_label: 'OPPONENT',
    landing_mock_p2_name: 'Algorithm_Bot',
    landing_mock_p2_pts: '820',
    landing_mock_p2_pct: '82'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/site-settings`);
        const data = await res.json();
        if (data.success && data.data) {
          setSettings(prev => ({
            ...prev,
            ...data.data
          }));
        }
      } catch (err) {
        console.error('Failed to fetch site settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const renderHeroTitle = (title) => {
    if (!title) return '';
    if (title.includes('**')) {
      const parts = title.split('**');
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <span key={index} className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {part}
            </span>
          );
        }
        return part;
      });
    }
    
    const highlightPhrase = "Quiz Battleground";
    if (title.includes(highlightPhrase)) {
      const parts = title.split(highlightPhrase);
      return (
        <>
          {parts[0]}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {highlightPhrase}
          </span>
          {parts[1]}
        </>
      );
    }
    return title;
  };

  const featuredTournaments = [
    {
      id: 'react-league',
      name: settings.landing_tournament_1_name,
      badge: settings.landing_tournament_1_badge,
      questions: settings.landing_tournament_1_questions,
      difficulty: settings.landing_tournament_1_difficulty,
      gradient: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      description: settings.landing_tournament_1_desc,
      icon: settings.landing_tournament_1_icon
    },
    {
      id: 'js-champions',
      name: settings.landing_tournament_2_name,
      badge: settings.landing_tournament_2_badge,
      questions: settings.landing_tournament_2_questions,
      difficulty: settings.landing_tournament_2_difficulty,
      gradient: 'from-amber-500/20 to-orange-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.15)]',
      description: settings.landing_tournament_2_desc,
      icon: settings.landing_tournament_2_icon
    },
    {
      id: 'db-titans',
      name: settings.landing_tournament_3_name,
      badge: settings.landing_tournament_3_badge,
      questions: settings.landing_tournament_3_questions,
      difficulty: settings.landing_tournament_3_difficulty,
      gradient: 'from-pink-500/20 to-indigo-500/10 border-pink-500/30 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.15)]',
      description: settings.landing_tournament_3_desc,
      icon: settings.landing_tournament_3_icon
    }
  ];

  const features = [
    {
      title: settings.landing_feature_1_title,
      description: settings.landing_feature_1_desc,
      emoji: settings.landing_feature_1_emoji
    },
    {
      title: settings.landing_feature_2_title,
      description: settings.landing_feature_2_desc,
      emoji: settings.landing_feature_2_emoji
    },
    {
      title: settings.landing_feature_3_title,
      description: settings.landing_feature_3_desc,
      emoji: settings.landing_feature_3_emoji
    }
  ];

  const faqs = [
    {
      q: settings.landing_faq_1_q,
      a: settings.landing_faq_1_a
    },
    {
      q: settings.landing_faq_2_q,
      a: settings.landing_faq_2_a
    },
    {
      q: settings.landing_faq_3_q,
      a: settings.landing_faq_3_a
    }
  ];

  return (
    <div className="bg-[#080710] text-white min-h-screen font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <SEOHead 
        title="The Ultimate Competitive Quiz Battleground"
        description={settings.landing_hero_subtitle}
      />
      <OrganizationSchema />
      <WebSiteSchema />
      <FAQSchema items={faqs.map(f => ({ question: f.q, answer: f.a }))} />

      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-indigo-900/20 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[55%] bg-purple-900/15 blur-[130px] rounded-full pointer-events-none"></div>

      {/* Header / Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent italic tracking-wider">
            {settings.brand_logo_text || 'MEDHASHREE'}
          </span>
          {settings.brand_logo_badge && (
            <span className="bg-indigo-500/20 border border-indigo-500/40 text-[#a5b4fc] text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded-full uppercase">
              {settings.brand_logo_badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/public/solved-papers')}
            className="text-[#a5b4fc] hover:text-[#c7d2fe] transition-colors text-sm font-semibold"
          >
            Solved PYQs
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="text-gray-300 hover:text-white transition-colors text-sm font-semibold"
          >
            {settings.brand_nav_login_text || 'Log In'}
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40"
          >
            {settings.brand_nav_signup_text || 'Get Started'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-20 text-center flex flex-col items-center">
        {settings.landing_hero_badge && (
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 text-xs font-semibold backdrop-blur-md mb-8 animate-pulse">
            <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
            <span className="text-gray-300 uppercase tracking-widest">{settings.landing_hero_badge}</span>
          </div>
        )}

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight max-w-5xl mb-8">
          {renderHeroTitle(settings.landing_hero_title)}
        </h1>

        <p className="text-gray-400 text-base sm:text-xl max-w-3xl mb-12 font-light leading-relaxed">
          {settings.landing_hero_subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-5 mb-16">
          <button 
            onClick={() => navigate('/register')}
            className="bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-white/5 hover:scale-[1.03] text-base"
          >
            {settings.landing_compete_btn_text}
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.03] text-base backdrop-blur-sm"
          >
            {settings.landing_explore_btn_text}
          </button>
          <button 
            onClick={() => navigate('/public/solved-papers')}
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.03] text-base shadow-lg shadow-indigo-500/25"
          >
            Explore Solved PYQs 📚
          </button>
        </div>

        {/* Knowledge Arena Live Battle Mockup Card */}
        <div className="w-full max-w-4xl bg-[#0f0e1d]/80 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative text-left">
          <div className="absolute -top-[1px] left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
          
          {/* Mockup Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
            <div className="text-xs text-gray-500 font-mono tracking-widest">{settings.landing_mock_arena_title || 'QUIZ-MATCH://BATTLE-ARENA'}</div>
            {settings.landing_mock_badge && (
              <div className="bg-red-500/10 text-red-400 text-[10px] font-mono px-2 py-0.5 rounded border border-red-500/20 animate-pulse uppercase font-black tracking-wider">{settings.landing_mock_badge}</div>
            )}
          </div>

          {/* Scoreboard Split Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Player 1 */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right">
              <div className="text-xs text-indigo-400 font-bold mb-1 tracking-widest">{settings.landing_mock_p1_label || 'YOU'}</div>
              <div className="text-xl sm:text-2xl font-black mb-2 text-white">{settings.landing_mock_p1_name || 'Dev_Mastermind'}</div>
              <div className="text-3xl font-black text-white font-mono">{settings.landing_mock_p1_pts || '0'} <span className="text-xs text-gray-500 font-normal font-sans">PTS</span></div>
              <div className="w-full max-w-[150px] bg-white/5 h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${settings.landing_mock_p1_pct || 50}%` }}></div>
              </div>
            </div>

            {/* Battle Core */}
            <div className="flex flex-col items-center justify-center border-y md:border-y-0 md:border-x border-white/5 py-4 md:py-0">
              <span className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">{settings.landing_mock_question_header || 'QUESTION 3 OF 3'}</span>
              <div className="text-sm text-gray-300 font-mono bg-white/5 px-4 py-2 rounded-lg border border-white/5 max-w-[220px] text-center mb-2">
                {settings.landing_mock_question_text || 'WeakMap key collection?'}
              </div>
              <span className="text-2xl font-black text-rose-500 animate-pulse font-mono">{settings.landing_mock_vs_text || 'VS'}</span>
            </div>

            {/* Player 2 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="text-xs text-purple-400 font-bold mb-1 tracking-widest">{settings.landing_mock_p2_label || 'OPPONENT'}</div>
              <div className="text-xl sm:text-2xl font-black mb-2 text-white">{settings.landing_mock_p2_name || 'Algorithm_Bot'}</div>
              <div className="text-3xl font-black text-white font-mono">{settings.landing_mock_p2_pts || '0'} <span className="text-xs text-gray-500 font-normal font-sans">PTS</span></div>
              <div className="w-full max-w-[150px] bg-white/5 h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${settings.landing_mock_p2_pct || 50}%` }}></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Seeded Premium Tournaments Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            {settings.landing_tournaments_title || 'Compete in Premium Seeded Tournaments'}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
            {settings.landing_tournaments_subtitle || 'These exclusive tournaments are populated with verified expert questions and isolated from search filters.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredTournaments.map((t) => (
            <div 
              key={t.id}
              className={`bg-[#0c0d16] border rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:-translate-y-2 transition-all duration-300 cursor-pointer ${t.gradient}`}
              onClick={() => navigate('/login')}
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-4xl">{t.icon}</span>
                  <span className="bg-white/5 border border-white/10 text-gray-300 text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase">
                    {t.difficulty}
                  </span>
                </div>

                <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest mb-3 text-indigo-400 font-mono">
                  {t.badge}
                </span>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 leading-snug">
                  {t.name}
                </h3>

                <p className="text-gray-400 text-sm leading-relaxed mb-6 font-light">
                  {t.description}
                </p>
              </div>

              <div className="border-t border-white/5 pt-6 flex items-center justify-between">
                <span className="text-xs text-gray-500">{t.questions} Questions</span>
                <span className="text-sm font-bold flex items-center gap-1 group text-indigo-400 hover:text-white transition-colors">
                  Play Now 
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((f, i) => (
            <div key={i} className="flex gap-4 text-left">
              <div className="shrink-0 w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-2xl">
                {f.emoji}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-light">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Statistics Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          <div className="py-4">
            <div className="text-4xl sm:text-5xl font-black text-indigo-400 font-mono mb-2">{settings.landing_stats_1_value}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{settings.landing_stats_1_label}</div>
          </div>
          <div className="py-4">
            <div className="text-4xl sm:text-5xl font-black text-purple-400 font-mono mb-2">{settings.landing_stats_2_value}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{settings.landing_stats_2_label}</div>
          </div>
          <div className="py-4">
            <div className="text-4xl sm:text-5xl font-black text-pink-400 font-mono mb-2">{settings.landing_stats_3_value}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{settings.landing_stats_3_label}</div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 border-t border-white/5">
        <h2 className="text-3xl font-black text-center text-white mb-12">{settings.landing_faq_title || 'Frequently Asked Questions'}</h2>
        
        <div className="space-y-4 text-left">
          {faqs.map((f, i) => (
            <div 
              key={i} 
              className="bg-[#0c0d16] border border-white/5 rounded-2xl overflow-hidden transition-colors"
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-white focus:outline-none hover:bg-white/5 transition-colors"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                <span>{f.q}</span>
                <span className="text-indigo-400 text-lg transition-transform duration-300">
                  {activeFaq === i ? '−' : '+'}
                </span>
              </button>
              
              {activeFaq === i && (
                <div className="px-6 pb-6 text-sm text-gray-400 leading-relaxed font-light border-t border-white/5 pt-4">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Sleek Dark Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#040508] py-12 text-center text-gray-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-white italic tracking-wider">
              {settings.brand_logo_text || 'MEDHASHREE'}
            </span>
            <span className="text-[10px] text-gray-600 uppercase font-mono">
              {settings.brand_footer_copyright || '© 2026'}
            </span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => navigate('/login')}>{settings.brand_footer_link_1 || 'Play'}</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => navigate('/register')}>{settings.brand_footer_link_2 || 'Sign Up'}</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => navigate('/login')}>{settings.brand_footer_link_3 || 'Support'}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default Landing;
