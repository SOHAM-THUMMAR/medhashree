import { useState, useEffect } from 'react';
import { authFetch } from '../../config/api';
import AuthMarketingPane from '../../components/AuthMarketingPane';
import AdminNavBanner from '../../components/admin/AdminNavBanner';

function ManageSettings() {
    const [activeTab, setActiveTab] = useState('hero'); // 'hero', 'stats', 'auth'
    const [previewAuthScreen, setPreviewAuthScreen] = useState('login'); // 'login', 'register', 'forgot'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Initial state with fallbacks matching standard values
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
        login_heading: 'Welcome Back',
        login_subheading: 'Enter your credentials to enter the quiz arena',
        register_heading: 'Create Account',
        register_subheading: 'Join Medhashree and start your tech quiz league',
        forgot_password_heading: 'Reset Password',
        auth_left_title: 'Sharpen Your\nEngineering Edge',
        auth_left_subtitle: 'Dive deep into core technical assessments. Compete live inside professional environments, secure your rank on our global leaderboard, and gain instant, audited feedback.',

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

        // Tournament Card 1
        landing_tournament_1_icon: '⚛️',
        landing_tournament_1_badge: 'React 19 & RSCs',
        landing_tournament_1_name: 'React Mastermind League',
        landing_tournament_1_difficulty: 'Expert',
        landing_tournament_1_questions: '3',
        landing_tournament_1_desc: 'Test your mastery of Server Components, React 19 Hooks, rendering lifecycles, and modern state architectures.',

        // Tournament Card 2
        landing_tournament_2_icon: '💛',
        landing_tournament_2_badge: 'ESNext & Event Loop',
        landing_tournament_2_name: 'JavaScript Champions Cup',
        landing_tournament_2_difficulty: 'Advanced',
        landing_tournament_2_questions: '3',
        landing_tournament_2_desc: 'Crack core concepts including the Javascript Event Loop, WeakMap collections, memory optimizations, and async schedules.',

        // Tournament Card 3
        landing_tournament_3_icon: '🗄️',
        landing_tournament_3_badge: 'PostgreSQL & SQL Core',
        landing_tournament_3_name: 'Database Titans Arena',
        landing_tournament_3_difficulty: 'Hard',
        landing_tournament_3_questions: '3',
        landing_tournament_3_desc: 'Conquer advanced LATERAL joins, composite index patterns, execution plan tunings, and transactional control.',

        // Features list
        landing_feature_1_emoji: '⚡',
        landing_feature_1_title: 'Solo Exploration',
        landing_feature_1_desc: 'Hone your skills in standard quizzes across core languages with detailed answers to level up your knowledge.',
        landing_feature_2_emoji: '🏆',
        landing_feature_2_title: 'Premium Tournaments',
        landing_feature_2_desc: 'Participate in time-bound, competitive leagues designed by experts and fight for the top leaderboard rank.',
        landing_feature_3_emoji: '🧠',
        landing_feature_3_title: 'Dynamic Explanations',
        landing_feature_3_desc: 'Every single question includes a comprehensive explanation block with references, enabling real growth.',

        // FAQ Section
        landing_faq_title: 'Frequently Asked Questions',
        landing_faq_1_q: 'How do I participate in tournaments?',
        landing_faq_1_a: 'Simply click "Get Started" to register your account. Once registered, log in to access the active Tournaments board, select your desired league, and click "Play Now"!',
        landing_faq_2_q: 'Can I upload custom quizzes?',
        landing_faq_2_a: 'Absolutely! Users with an instructor or administrator role can build custom quizzes and tournaments by uploading CSV files directly via our admin console.',
        landing_faq_3_q: 'What makes Medhashree different?',
        landing_faq_3_a: 'We isolate tournament-bound, highly challenging premium questions from regular search feeds, combining high-octane battles with elite learning feedback.',

        // Mock Battle arena card
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
        landing_mock_p2_pct: '82',

        // Auth left pane footer
        auth_footer_text: 'SECURED PROTOCOL // CONTEST HUB 2026'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await authFetch('/site-settings');
                const data = await res.json();
                if (data.success && data.data) {
                    // Merge with fallbacks
                    setSettings(prev => ({
                        ...prev,
                        ...data.data
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch site settings:', err);
                setMessage({ text: 'Failed to load live settings. Using standard fallbacks.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });

        try {
            const res = await authFetch('/site-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ text: 'Site settings updated successfully!', type: 'success' });
                if (data.data) {
                    setSettings(data.data);
                }
            } else {
                setMessage({ text: data.message || 'Failed to save settings', type: 'error' });
            }
        } catch (err) {
            console.error('Save Settings Error:', err);
            setMessage({ text: 'Cannot connect to server. Please try again.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto text-black dark:text-white pb-12 pt-6 px-4 lg:px-0">
            {/* Header Banner */}
            <AdminNavBanner 
                title="Manage Site Information & Content" 
                subtitle="Configure global landing page messaging, brand identity, and authentication portal copy." 
            />

            {/* Success/Error Banners */}
            {message.text && (
                <div className={`p-4 rounded-2xl mb-8 text-sm font-semibold tracking-wide border ${
                    message.type === 'success' 
                        ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' 
                        : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                }`}>
                    {message.type === 'success' ? '✅' : '⚠️'} {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Form Controls - span 2 columns */}
                <div className="xl:col-span-2 bg-white dark:bg-brand-surfaceAlt rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                    <form onSubmit={handleSave}>
                        {/* Custom Tab Navigation */}
                        <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-800 pb-4 mb-6 gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('hero')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeTab === 'hero' 
                                        ? 'bg-indigo-500 text-white shadow-sm' 
                                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                                }`}
                            >
                                🚀 Landing Hero
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('stats')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeTab === 'stats' 
                                        ? 'bg-indigo-500 text-white shadow-sm' 
                                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                                }`}
                            >
                                📊 Stats & Labels
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('tournaments_faq')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeTab === 'tournaments_faq' 
                                        ? 'bg-indigo-500 text-white shadow-sm' 
                                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                                }`}
                            >
                                🏆 Tournaments & FAQs
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('features_mock')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeTab === 'features_mock' 
                                        ? 'bg-indigo-500 text-white shadow-sm' 
                                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                                }`}
                            >
                                ✨ Features & Mock Card
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('brand')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeTab === 'brand' 
                                        ? 'bg-indigo-500 text-white shadow-sm' 
                                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                                }`}
                            >
                                🌐 Brand & Nav
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('auth')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeTab === 'auth' 
                                        ? 'bg-indigo-500 text-white shadow-sm' 
                                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                                }`}
                            >
                                🔐 Auth Pages
                            </button>
                        </div>

                        {/* Tab Contents */}
                        {activeTab === 'hero' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                        Hero Tag Badge
                                    </label>
                                    <input
                                        type="text"
                                        name="landing_hero_badge"
                                        value={settings.landing_hero_badge}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                        placeholder="e.g. New Seeded Tournaments Live"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                        Hero Main Title
                                    </label>
                                    <input
                                        type="text"
                                        name="landing_hero_title"
                                        value={settings.landing_hero_title}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-semibold"
                                        placeholder="Enter high-impact headline"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                        Hero Description Subtitle
                                    </label>
                                    <textarea
                                        name="landing_hero_subtitle"
                                        value={settings.landing_hero_subtitle}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition leading-relaxed"
                                        placeholder="Provide context and summary of the quiz battlefield..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                            Primary Action Button
                                        </label>
                                        <input
                                            type="text"
                                            name="landing_compete_btn_text"
                                            value={settings.landing_compete_btn_text}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                            placeholder="e.g. Compete Now"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                            Secondary Action Button
                                        </label>
                                        <input
                                            type="text"
                                            name="landing_explore_btn_text"
                                            value={settings.landing_explore_btn_text}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                            placeholder="e.g. Explore Quizzes"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div className="space-y-8">
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest">Statistic Metric 1</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="sm:col-span-1">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Value</label>
                                            <input
                                                type="text"
                                                name="landing_stats_1_value"
                                                value={settings.landing_stats_1_value}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Label</label>
                                            <input
                                                type="text"
                                                name="landing_stats_1_label"
                                                value={settings.landing_stats_1_label}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest">Statistic Metric 2</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="sm:col-span-1">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Value</label>
                                            <input
                                                type="text"
                                                name="landing_stats_2_value"
                                                value={settings.landing_stats_2_value}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Label</label>
                                            <input
                                                type="text"
                                                name="landing_stats_2_label"
                                                value={settings.landing_stats_2_label}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest">Statistic Metric 3</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="sm:col-span-1">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Value</label>
                                            <input
                                                type="text"
                                                name="landing_stats_3_value"
                                                value={settings.landing_stats_3_value}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Label</label>
                                            <input
                                                type="text"
                                                name="landing_stats_3_label"
                                                value={settings.landing_stats_3_label}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tournaments_faq' && (
                            <div className="space-y-8">
                                {/* Tournaments Section Headers */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <span>🏆</span> Tournaments Section Header
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Section Title</label>
                                            <input
                                                type="text"
                                                name="landing_tournaments_title"
                                                value={settings.landing_tournaments_title}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Section Subtitle / Description</label>
                                            <textarea
                                                name="landing_tournaments_subtitle"
                                                value={settings.landing_tournaments_subtitle}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tournament Card 1 */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <span>⚛️</span> Tournament Card 1 (React League)
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Card Name</label>
                                            <input
                                                type="text"
                                                name="landing_tournament_1_name"
                                                value={settings.landing_tournament_1_name}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Card Badge (Tech / Category)</label>
                                            <input
                                                type="text"
                                                name="landing_tournament_1_badge"
                                                value={settings.landing_tournament_1_badge}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Difficulty</label>
                                            <input
                                                type="text"
                                                name="landing_tournament_1_difficulty"
                                                value={settings.landing_tournament_1_difficulty}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Questions Count</label>
                                                <input
                                                    type="text"
                                                    name="landing_tournament_1_questions"
                                                    value={settings.landing_tournament_1_questions}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition text-center"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Emoji Icon</label>
                                                <input
                                                    type="text"
                                                    name="landing_tournament_1_icon"
                                                    value={settings.landing_tournament_1_icon}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition text-center"
                                                />
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Description</label>
                                            <textarea
                                                name="landing_tournament_1_desc"
                                                value={settings.landing_tournament_1_desc}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tournament Card 2 */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <span>💛</span> Tournament Card 2 (JS Champions)
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Card Name</label>
                                            <input
                                                type="text"
                                                name="landing_tournament_2_name"
                                                value={settings.landing_tournament_2_name}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Card Badge (Tech / Category)</label>
                                            <input
                                                type="text"
                                                name="landing_tournament_2_badge"
                                                value={settings.landing_tournament_2_badge}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Difficulty</label>
                                            <input
                                                type="text"
                                                name="landing_tournament_2_difficulty"
                                                value={settings.landing_tournament_2_difficulty}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Questions Count</label>
                                                <input
                                                    type="text"
                                                    name="landing_tournament_2_questions"
                                                    value={settings.landing_tournament_2_questions}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition text-center"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Emoji Icon</label>
                                                <input
                                                    type="text"
                                                    name="landing_tournament_2_icon"
                                                    value={settings.landing_tournament_2_icon}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition text-center"
                                                />
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Description</label>
                                            <textarea
                                                name="landing_tournament_2_desc"
                                                value={settings.landing_tournament_2_desc}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tournament Card 3 */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <span>🗄️</span> Tournament Card 3 (Database Titans)
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Card Name</label>
                                            <input
                                                type="text"
                                                name="landing_tournament_3_name"
                                                value={settings.landing_tournament_3_name}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Card Badge (Tech / Category)</label>
                                            <input
                                                type="text"
                                                name="landing_tournament_3_badge"
                                                value={settings.landing_tournament_3_badge}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Difficulty</label>
                                            <input
                                                type="text"
                                                name="landing_tournament_3_difficulty"
                                                value={settings.landing_tournament_3_difficulty}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Questions Count</label>
                                                <input
                                                    type="text"
                                                    name="landing_tournament_3_questions"
                                                    value={settings.landing_tournament_3_questions}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition text-center"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Emoji Icon</label>
                                                <input
                                                    type="text"
                                                    name="landing_tournament_3_icon"
                                                    value={settings.landing_tournament_3_icon}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition text-center"
                                                />
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Description</label>
                                            <textarea
                                                name="landing_tournament_3_desc"
                                                value={settings.landing_tournament_3_desc}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* FAQs Title & Content */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <span>💬</span> FAQ Section Title & Entries
                                    </h3>
                                    <div className="space-y-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Main FAQ Title</label>
                                            <input
                                                type="text"
                                                name="landing_faq_title"
                                                value={settings.landing_faq_title}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">FAQ Item 1</h4>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Question</label>
                                            <input
                                                type="text"
                                                name="landing_faq_1_q"
                                                value={settings.landing_faq_1_q}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Answer</label>
                                            <textarea
                                                name="landing_faq_1_a"
                                                value={settings.landing_faq_1_a}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                                        <h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">FAQ Item 2</h4>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Question</label>
                                            <input
                                                type="text"
                                                name="landing_faq_2_q"
                                                value={settings.landing_faq_2_q}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Answer</label>
                                            <textarea
                                                name="landing_faq_2_a"
                                                value={settings.landing_faq_2_a}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                                        <h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">FAQ Item 3</h4>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Question</label>
                                            <input
                                                type="text"
                                                name="landing_faq_3_q"
                                                value={settings.landing_faq_3_q}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Answer</label>
                                            <textarea
                                                name="landing_faq_3_a"
                                                value={settings.landing_faq_3_a}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'features_mock' && (
                            <div className="space-y-8">
                                {/* Platform Features */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-6">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <span>⚡</span> Platform Features Grid
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider">Feature 1</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="sm:col-span-1">
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Emoji</label>
                                                <input
                                                    type="text"
                                                    name="landing_feature_1_emoji"
                                                    value={settings.landing_feature_1_emoji}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition text-center"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Title</label>
                                                <input
                                                    type="text"
                                                    name="landing_feature_1_title"
                                                    value={settings.landing_feature_1_title}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                                />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Description</label>
                                                <textarea
                                                    name="landing_feature_1_desc"
                                                    value={settings.landing_feature_1_desc}
                                                    onChange={handleChange}
                                                    rows={2}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                                        <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider">Feature 2</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="sm:col-span-1">
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Emoji</label>
                                                <input
                                                    type="text"
                                                    name="landing_feature_2_emoji"
                                                    value={settings.landing_feature_2_emoji}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition text-center"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Title</label>
                                                <input
                                                    type="text"
                                                    name="landing_feature_2_title"
                                                    value={settings.landing_feature_2_title}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                                />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Description</label>
                                                <textarea
                                                    name="landing_feature_2_desc"
                                                    value={settings.landing_feature_2_desc}
                                                    onChange={handleChange}
                                                    rows={2}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                                        <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider">Feature 3</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="sm:col-span-1">
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Emoji</label>
                                                <input
                                                    type="text"
                                                    name="landing_feature_3_emoji"
                                                    value={settings.landing_feature_3_emoji}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition text-center"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Title</label>
                                                <input
                                                    type="text"
                                                    name="landing_feature_3_title"
                                                    value={settings.landing_feature_3_title}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                                />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Description</label>
                                                <textarea
                                                    name="landing_feature_3_desc"
                                                    value={settings.landing_feature_3_desc}
                                                    onChange={handleChange}
                                                    rows={2}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mock Arena Battle Card Details */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <span>🎮</span> Battle Mock Arena Card Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Arena URL / Title Schema</label>
                                            <input
                                                type="text"
                                                name="landing_mock_arena_title"
                                                value={settings.landing_mock_arena_title}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Badge State</label>
                                            <input
                                                type="text"
                                                name="landing_mock_badge"
                                                value={settings.landing_mock_badge}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-mono uppercase"
                                            />
                                        </div>
                                        
                                        {/* Player 1 Details */}
                                        <div className="p-4 bg-white dark:bg-[#1a1d2e] rounded-xl border border-gray-200 dark:border-gray-800 sm:col-span-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                                            <h4 className="font-bold text-xs text-indigo-400 sm:col-span-4">Player 1 (Left Side)</h4>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase">Label</label>
                                                <input
                                                    type="text"
                                                    name="landing_mock_p1_label"
                                                    value={settings.landing_mock_p1_label}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] text-gray-400 uppercase">Name</label>
                                                <input
                                                    type="text"
                                                    name="landing_mock_p1_name"
                                                    value={settings.landing_mock_p1_name}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase">Points & Percentage</label>
                                                <div className="flex gap-1">
                                                    <input
                                                        type="text"
                                                        name="landing_mock_p1_pts"
                                                        value={settings.landing_mock_p1_pts}
                                                        onChange={handleChange}
                                                        className="w-1/2 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-center"
                                                        placeholder="950"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="landing_mock_p1_pct"
                                                        value={settings.landing_mock_p1_pct}
                                                        onChange={handleChange}
                                                        className="w-1/2 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-center"
                                                        placeholder="92"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Questions and Center VS details */}
                                        <div className="p-4 bg-white dark:bg-[#1a1d2e] rounded-xl border border-gray-200 dark:border-gray-800 sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <h4 className="font-bold text-xs text-gray-400 sm:col-span-3">Battle Core (Middle Panel)</h4>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase">Question Header</label>
                                                <input
                                                    type="text"
                                                    name="landing_mock_question_header"
                                                    value={settings.landing_mock_question_header}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase">Question Text</label>
                                                <input
                                                    type="text"
                                                    name="landing_mock_question_text"
                                                    value={settings.landing_mock_question_text}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase">VS Divider Text</label>
                                                <input
                                                    type="text"
                                                    name="landing_mock_vs_text"
                                                    value={settings.landing_mock_vs_text}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-center"
                                                />
                                            </div>
                                        </div>

                                        {/* Player 2 Details */}
                                        <div className="p-4 bg-white dark:bg-[#1a1d2e] rounded-xl border border-gray-200 dark:border-gray-800 sm:col-span-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                                            <h4 className="font-bold text-xs text-pink-400 sm:col-span-4">Player 2 (Right Side)</h4>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase">Label</label>
                                                <input
                                                    type="text"
                                                    name="landing_mock_p2_label"
                                                    value={settings.landing_mock_p2_label}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] text-gray-400 uppercase">Name</label>
                                                <input
                                                    type="text"
                                                    name="landing_mock_p2_name"
                                                    value={settings.landing_mock_p2_name}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase">Points & Percentage</label>
                                                <div className="flex gap-1">
                                                    <input
                                                        type="text"
                                                        name="landing_mock_p2_pts"
                                                        value={settings.landing_mock_p2_pts}
                                                        onChange={handleChange}
                                                        className="w-1/2 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-center"
                                                        placeholder="820"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="landing_mock_p2_pct"
                                                        value={settings.landing_mock_p2_pct}
                                                        onChange={handleChange}
                                                        className="w-1/2 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-center"
                                                        placeholder="82"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'brand' && (
                            <div className="space-y-8">
                                {/* Branding Headers */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <span>🎨</span> Brand Logo and Header Options
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Logo Brand Title</label>
                                            <input
                                                type="text"
                                                name="brand_logo_text"
                                                value={settings.brand_logo_text}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-black tracking-wider uppercase italic text-indigo-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Logo Badge Label</label>
                                            <input
                                                type="text"
                                                name="brand_logo_badge"
                                                value={settings.brand_logo_badge}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Navbar Login Button text</label>
                                            <input
                                                type="text"
                                                name="brand_nav_login_text"
                                                value={settings.brand_nav_login_text}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Navbar Signup Button text</label>
                                            <input
                                                type="text"
                                                name="brand_nav_signup_text"
                                                value={settings.brand_nav_signup_text}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Branding Footers */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-[#818cf8] uppercase tracking-widest flex items-center gap-2">
                                        <span>📋</span> Footer Options
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Footer Copyright details</label>
                                            <input
                                                type="text"
                                                name="brand_footer_copyright"
                                                value={settings.brand_footer_copyright}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                        <div className="sm:col-span-2 grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Footer Link 1</label>
                                                <input
                                                    type="text"
                                                    name="brand_footer_link_1"
                                                    value={settings.brand_footer_link_1}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-indigo-500 text-center"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Footer Link 2</label>
                                                <input
                                                    type="text"
                                                    name="brand_footer_link_2"
                                                    value={settings.brand_footer_link_2}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-indigo-500 text-center"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 mb-1">Footer Link 3</label>
                                                <input
                                                    type="text"
                                                    name="brand_footer_link_3"
                                                    value={settings.brand_footer_link_3}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-indigo-500 text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'auth' && (
                            <div className="space-y-8">
                                {/* Left Visual Pane configs */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                                        Left Visual Pane — Full Content
                                    </h3>

                                    {/* Brand Identity */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Brand Logo Text</label>
                                            <input
                                                type="text"
                                                name="brand_logo_text"
                                                value={settings.brand_logo_text}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                                placeholder="e.g. MEDHASHREE"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Logo Badge Label</label>
                                            <input
                                                type="text"
                                                name="brand_logo_badge"
                                                value={settings.brand_logo_badge}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                                placeholder="e.g. League"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1">Leave empty to hide the badge pill.</p>
                                        </div>
                                    </div>

                                    {/* Title & Subtitle */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Welcome Heading</label>
                                            <textarea
                                                name="auth_left_title"
                                                value={settings.auth_left_title}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition leading-relaxed font-bold"
                                                placeholder="e.g. Sharpen Your&#10;Engineering Edge"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1">Use line breaks (Enter) to control multi-line layout.</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Descriptive Subheading</label>
                                            <textarea
                                                name="auth_left_subtitle"
                                                value={settings.auth_left_subtitle}
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                                                placeholder="Enter a descriptive overview about premium engineering contests..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Feature Cards — Editable */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-5">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        Feature Cards (Left Pane)
                                    </h3>
                                    <p className="text-[11px] text-gray-400 -mt-2">These 3 cards appear below the heading on the login/register left pane.</p>

                                    {/* Card 1 */}
                                    <div className="p-4 bg-white dark:bg-[#1a1d2e] rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">CARD 1</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Icon / Emoji</label>
                                                <input
                                                    type="text"
                                                    name="landing_tournament_1_icon"
                                                    value={settings.landing_tournament_1_icon}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-indigo-500 transition"
                                                    placeholder="⚛️"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Card Title</label>
                                                <input
                                                    type="text"
                                                    name="landing_tournament_1_name"
                                                    value={settings.landing_tournament_1_name}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                                    placeholder="React Mastermind League"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-400 mb-1">Card Description</label>
                                            <textarea
                                                name="landing_tournament_1_desc"
                                                value={settings.landing_tournament_1_desc}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                                                placeholder="Brief description of this card..."
                                            />
                                        </div>
                                    </div>

                                    {/* Card 2 */}
                                    <div className="p-4 bg-white dark:bg-[#1a1d2e] rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">CARD 2</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Icon / Emoji</label>
                                                <input
                                                    type="text"
                                                    name="landing_tournament_2_icon"
                                                    value={settings.landing_tournament_2_icon}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-indigo-500 transition"
                                                    placeholder="💛"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Card Title</label>
                                                <input
                                                    type="text"
                                                    name="landing_tournament_2_name"
                                                    value={settings.landing_tournament_2_name}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                                    placeholder="JavaScript Champions Cup"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-400 mb-1">Card Description</label>
                                            <textarea
                                                name="landing_tournament_2_desc"
                                                value={settings.landing_tournament_2_desc}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                                                placeholder="Brief description of this card..."
                                            />
                                        </div>
                                    </div>

                                    {/* Card 3 */}
                                    <div className="p-4 bg-white dark:bg-[#1a1d2e] rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded">CARD 3</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Icon / Emoji</label>
                                                <input
                                                    type="text"
                                                    name="landing_tournament_3_icon"
                                                    value={settings.landing_tournament_3_icon}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-indigo-500 transition"
                                                    placeholder="🗄️"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Card Title</label>
                                                <input
                                                    type="text"
                                                    name="landing_tournament_3_name"
                                                    value={settings.landing_tournament_3_name}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                                    placeholder="Database Titans Arena"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-400 mb-1">Card Description</label>
                                            <textarea
                                                name="landing_tournament_3_desc"
                                                value={settings.landing_tournament_3_desc}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                                                placeholder="Brief description of this card..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Text */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Left Pane Footer Text
                                    </h3>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1">Footer Line</label>
                                        <input
                                            type="text"
                                            name="auth_footer_text"
                                            value={settings.auth_footer_text}
                                            onChange={handleChange}
                                            className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-mono"
                                            placeholder="e.g. SECURED PROTOCOL // CONTEST HUB 2026"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Small monospace text at the bottom of the left pane.</p>
                                    </div>
                                </div>

                                {/* Login page configs */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg> Login Page Content
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Welcome Heading</label>
                                            <input
                                                type="text"
                                                name="login_heading"
                                                value={settings.login_heading}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                                placeholder="e.g. Welcome Back"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Descriptive Subheading</label>
                                            <textarea
                                                name="login_subheading"
                                                value={settings.login_subheading}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                                                placeholder="e.g. Enter your credentials to enter the quiz arena"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Register page configs */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> Register Page Content
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Welcome Heading</label>
                                            <input
                                                type="text"
                                                name="register_heading"
                                                value={settings.register_heading}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                                placeholder="e.g. Create Account"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Descriptive Subheading</label>
                                            <textarea
                                                name="register_subheading"
                                                value={settings.register_subheading}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                                                placeholder="e.g. Join Medhashree and start your tech quiz league"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Forgot password configs */}
                                <div className="p-5 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                    <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> Forgot Password Content
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Heading Title</label>
                                            <input
                                                type="text"
                                                name="forgot_password_heading"
                                                value={settings.forgot_password_heading}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition font-bold"
                                                placeholder="e.g. Reset Password"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
 
                         {/* Save Bar */}
                         <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6 flex justify-between items-center">
                             <span className="text-xs text-gray-400">Updates take effect immediately across all visitors.</span>
                             <button
                                 type="submit"
                                 disabled={saving}
                                 className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/60 text-white font-bold text-sm px-8 py-3 rounded-xl transition duration-300 shadow-md shadow-indigo-500/20 active:scale-95"
                             >
                                 {saving ? 'Saving changes...' : 'Save Site Settings'}
                             </button>
                         </div>
                     </form>
                 </div>
 
                 {/* Live Mock Preview Panel - spans 1 column */}
                 <div className="xl:col-span-1 flex flex-col gap-6">
                     <div className="bg-[#080710] border border-gray-800 text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden min-h-[450px] flex flex-col justify-between">
                         {/* Glowing backdrop blobs */}
                         <div className="absolute top-0 left-0 w-36 h-36 bg-indigo-900/40 rounded-full blur-[40px] pointer-events-none"></div>
                         <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-900/30 rounded-full blur-[40px] pointer-events-none"></div>
 
                         {/* Mock header */}
                         <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4 relative z-10">
                             <span className="text-xs font-bold text-gray-400 tracking-wider">LIVE SITE PREVIEW</span>
                             <span className="bg-green-500/10 border border-green-500/30 text-green-400 text-[9px] font-bold px-2 py-0.5 rounded">REALTIME</span>
                         </div>
 
                         {/* Preview switcher state rendering */}
                         {activeTab === 'hero' && (
                             <div className="flex-1 flex flex-col justify-center items-center text-center py-4 relative z-10">
                                 <div className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 rounded-full px-3 py-1 text-[10px] font-semibold mb-4 text-gray-300">
                                     <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                                     <span>{settings.landing_hero_badge || 'Tag Badge'}</span>
                                 </div>
                                 <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight mb-3">
                                     {settings.landing_hero_title || 'Headline title'}
                                 </h2>
                                 <p className="text-gray-400 text-xs max-w-md mb-6 leading-relaxed font-light">
                                     {settings.landing_hero_subtitle || 'Subtitle descriptive text'}
                                 </p>
                                 <div className="flex gap-3">
                                     <div className="bg-white text-black font-bold text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                                         {settings.landing_compete_btn_text || 'Action 1'}
                                     </div>
                                     <div className="bg-white/5 border border-white/10 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer">
                                         {settings.landing_explore_btn_text || 'Action 2'}
                                     </div>
                                 </div>
                             </div>
                         )}
 
                         {activeTab === 'stats' && (
                             <div className="flex-1 flex flex-col justify-center gap-6 py-4 relative z-10">
                                 <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                     <div className="text-2xl font-black text-indigo-400 font-mono mb-1">
                                         {settings.landing_stats_1_value || '10,000+'}
                                     </div>
                                     <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                         {settings.landing_stats_1_label || 'Label Metric 1'}
                                     </div>
                                 </div>
                                 <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                     <div className="text-2xl font-black text-purple-400 font-mono mb-1">
                                         {settings.landing_stats_2_value || '50,000+'}
                                     </div>
                                     <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                         {settings.landing_stats_2_label || 'Label Metric 2'}
                                     </div>
                                 </div>
                                 <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                     <div className="text-2xl font-black text-pink-400 font-mono mb-1">
                                         {settings.landing_stats_3_value || '100%'}
                                     </div>
                                     <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                         {settings.landing_stats_3_label || 'Label Metric 3'}
                                     </div>
                                 </div>
                             </div>
                         )}

                         {activeTab === 'auth' && (
                             <div className="flex-1 flex flex-col justify-center py-4 relative z-10">
                                 <div className="flex justify-center gap-2 mb-4 bg-white/5 p-1 rounded-lg border border-white/10">
                                     {['left_pane', 'login', 'register', 'forgot'].map((screen) => (
                                         <button
                                             key={screen}
                                             type="button"
                                             onClick={() => setPreviewAuthScreen(screen)}
                                             className={`flex-1 text-[9px] font-bold py-1.5 px-1 rounded-md transition ${
                                                 previewAuthScreen === screen 
                                                     ? 'bg-indigo-500 text-white shadow-sm' 
                                                     : 'text-gray-400 hover:text-white'
                                             }`}
                                         >
                                             {screen === 'left_pane' ? 'LEFT PANE' : screen.toUpperCase()}
                                         </button>
                                     ))}
                                 </div>

                                 {previewAuthScreen === 'left_pane' && (
                                     <AuthMarketingPane settings={settings} isCompact={true} />
                                 )}

                                 {previewAuthScreen === 'login' && (
                                     <div className="border border-white/5 bg-[#0f0e1d] rounded-2xl p-5 shadow-inner">
                                         <div className="text-center mb-6">
                                             <h3 className="text-lg font-extrabold text-white mb-1.5">{settings.login_heading || 'Header'}</h3>
                                             <p className="text-[11px] text-gray-400 font-light">{settings.login_subheading || 'Sub-headline'}</p>
                                         </div>
                                         <div className="space-y-3">
                                             <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-gray-500/70">you@example.com</div>
                                             <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-gray-500/70">••••••••</div>
                                             <div className="bg-indigo-500 text-white font-bold text-xs p-2.5 rounded-lg text-center cursor-pointer">Log In & Compete</div>
                                         </div>
                                     </div>
                                 )}

                                 {previewAuthScreen === 'register' && (
                                     <div className="border border-white/5 bg-[#0f0e1d] rounded-2xl p-5 shadow-inner">
                                         <div className="text-center mb-6">
                                             <h3 className="text-lg font-extrabold text-white mb-1.5">{settings.register_heading || 'Header'}</h3>
                                             <p className="text-[11px] text-gray-400 font-light">{settings.register_subheading || 'Sub-headline'}</p>
                                         </div>
                                         <div className="space-y-2">
                                             <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-gray-500/70">Full Name</div>
                                             <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-gray-500/70">Email Address</div>
                                             <div className="bg-indigo-500 text-white font-bold text-xs p-2 rounded-lg text-center cursor-pointer">Create Account</div>
                                         </div>
                                     </div>
                                 )}

                                 {previewAuthScreen === 'forgot' && (
                                     <div className="border border-white/5 bg-[#0f0e1d] rounded-2xl p-5 shadow-inner">
                                         <div className="text-center mb-6">
                                             <h3 className="text-lg font-extrabold text-white mb-1.5">{settings.forgot_password_heading || 'Header'}</h3>
                                             <p className="text-[11px] text-gray-400 font-light">Enter your email to receive an OTP</p>
                                         </div>
                                         <div className="space-y-3">
                                             <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-gray-500/70">name@example.com</div>
                                             <div className="bg-indigo-500 text-white font-bold text-xs p-2.5 rounded-lg text-center cursor-pointer">Send OTP</div>
                                         </div>
                                     </div>
                                 )}
                             </div>
                         )}

                         {activeTab === 'tournaments_faq' && (
                             <div className="flex-1 flex flex-col justify-center gap-4 py-4 relative z-10 overflow-y-auto max-h-[380px] pr-1">
                                 {/* Tournaments Header Preview */}
                                 <div className="text-center mb-2">
                                     <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Tournament Section</h4>
                                     <h3 className="text-sm font-extrabold">{settings.landing_tournaments_title || 'Compete in Tournaments'}</h3>
                                 </div>

                                 {/* Mini Tournament Card Preview */}
                                 <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2 relative overflow-hidden text-left">
                                     <div className="absolute top-0 right-0 bg-indigo-500/10 text-indigo-400 text-[8px] font-bold px-2 py-0.5 rounded-bl">
                                         {settings.landing_tournament_1_badge || 'React'}
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <span className="text-xl">{settings.landing_tournament_1_icon || '⚛️'}</span>
                                         <div>
                                             <h4 className="text-xs font-bold text-white">{settings.landing_tournament_1_name || 'React Mastermind'}</h4>
                                             <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                                                 <span className="text-amber-400 font-bold">{settings.landing_tournament_1_difficulty || 'Expert'}</span>
                                                 <span>•</span>
                                                 <span>{settings.landing_tournament_1_questions || '3'} Questions</span>
                                             </div>
                                         </div>
                                     </div>
                                     <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">
                                         {settings.landing_tournament_1_desc || 'Test your mastery...'}
                                     </p>
                                 </div>

                                 {/* FAQ Preview */}
                                 <div className="space-y-2 mt-2 text-left">
                                     <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider text-center">{settings.landing_faq_title || 'FAQs'}</h4>
                                     <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                         <div className="text-xs font-bold text-white flex justify-between items-center">
                                             <span>{settings.landing_faq_1_q || 'Question 1'}</span>
                                             <span className="text-[10px] text-indigo-400">▼</span>
                                         </div>
                                         <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                                             {settings.landing_faq_1_a || 'Answer 1'}
                                         </p>
                                     </div>
                                 </div>
                             </div>
                         )}

                         {activeTab === 'features_mock' && (
                             <div className="flex-1 flex flex-col justify-center gap-4 py-4 relative z-10 overflow-y-auto max-h-[380px] pr-1">
                                 {/* Feature Preview */}
                                 <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-3 items-start text-left">
                                     <span className="text-xl bg-white/5 p-1.5 rounded-lg border border-white/10">{settings.landing_feature_1_emoji || '⚡'}</span>
                                     <div>
                                         <h4 className="text-xs font-bold text-white">{settings.landing_feature_1_title || 'Feature Title'}</h4>
                                         <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                                             {settings.landing_feature_1_desc || 'Feature description details.'}
                                         </p>
                                     </div>
                                 </div>

                                 {/* Battle Arena Scoreboard Card Preview */}
                                 <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3.5 space-y-3 shadow-inner shadow-indigo-500/5 text-left">
                                     <div className="flex justify-between items-center border-b border-white/5 pb-2 text-[9px] font-mono tracking-wider text-gray-400">
                                         <span>{settings.landing_mock_arena_title || 'BATTLE-ARENA'}</span>
                                         <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-[8px] px-1 rounded font-bold animate-pulse">
                                             {settings.landing_mock_badge || 'LIVE'}
                                         </span>
                                     </div>

                                     {/* Matchup row */}
                                     <div className="grid grid-cols-7 gap-1 items-center">
                                         {/* Player 1 */}
                                         <div className="col-span-3 text-left">
                                             <span className="text-[7px] text-indigo-400 font-bold block tracking-widest">{settings.landing_mock_p1_label || 'YOU'}</span>
                                             <span className="text-[10px] font-bold text-white block truncate">{settings.landing_mock_p1_name || 'Player 1'}</span>
                                             <span className="text-[9px] text-indigo-300 font-mono block">{settings.landing_mock_p1_pts || '0'} pts</span>
                                             <div className="w-full bg-white/5 rounded-full h-1 mt-1 overflow-hidden">
                                                 <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${settings.landing_mock_p1_pct || 50}%` }}></div>
                                             </div>
                                         </div>

                                         {/* Middle VS and details */}
                                         <div className="col-span-1 text-center">
                                             <span className="text-[10px] font-black text-rose-500 font-mono tracking-tighter">{settings.landing_mock_vs_text || 'VS'}</span>
                                         </div>

                                         {/* Player 2 */}
                                         <div className="col-span-3 text-right">
                                             <span className="text-[7px] text-purple-400 font-bold block tracking-widest">{settings.landing_mock_p2_label || 'OPPONENT'}</span>
                                             <span className="text-[10px] font-bold text-white block truncate">{settings.landing_mock_p2_name || 'Player 2'}</span>
                                             <span className="text-[9px] text-purple-300 font-mono block">{settings.landing_mock_p2_pts || '0'} pts</span>
                                             <div className="w-full bg-white/5 rounded-full h-1 mt-1 overflow-hidden">
                                                 <div className="bg-purple-500 h-full rounded-full" style={{ width: `${settings.landing_mock_p2_pct || 50}%` }}></div>
                                             </div>
                                         </div>
                                     </div>

                                     {/* Mock Question info */}
                                     <div className="bg-white/5 border border-white/5 rounded-lg p-2 text-center">
                                         <span className="text-[7px] text-gray-500 font-bold block uppercase tracking-wider">{settings.landing_mock_question_header || 'QUESTION 1 OF 3'}</span>
                                         <span className="text-[9px] text-gray-300 font-semibold block truncate mt-0.5">{settings.landing_mock_question_text || 'Active Question...'}</span>
                                     </div>
                                 </div>
                             </div>
                         )}

                         {activeTab === 'brand' && (
                             <div className="flex-1 flex flex-col justify-between py-4 relative z-10">
                                 {/* Glassmorphic Navbar Preview */}
                                 <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center shadow-lg backdrop-blur-md">
                                     <div className="flex items-center gap-1">
                                         <span className="text-[10px] font-black tracking-wider text-white font-sans">{settings.brand_logo_text || 'MEDHASHREE'}</span>
                                         {settings.brand_logo_badge && (
                                             <span className="bg-indigo-500 text-[6px] text-white px-1.5 py-0.5 rounded font-black uppercase">
                                                 {settings.brand_logo_badge}
                                             </span>
                                         )}
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <span className="text-[9px] text-gray-400 font-semibold cursor-pointer">{settings.brand_nav_login_text || 'Log In'}</span>
                                         <span className="bg-white text-black text-[9px] font-bold px-2.5 py-1 rounded cursor-pointer">{settings.brand_nav_signup_text || 'Get Started'}</span>
                                     </div>
                                 </div>

                                 {/* Middle Visual Placeholder */}
                                 <div className="flex-1 flex flex-col justify-center items-center py-4">
                                     <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-base font-extrabold shadow-lg shadow-indigo-500/20">
                                         {settings.brand_logo_text ? settings.brand_logo_text.substring(0, 2).toUpperCase() : 'M'}
                                     </div>
                                     <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-2 font-mono">Branding Experience</span>
                                 </div>

                                 {/* Glassmorphic Footer Preview */}
                                 <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center text-[8px] text-gray-400">
                                     <span>{settings.brand_footer_copyright || '© 2026'} {settings.brand_logo_text || 'MEDHASHREE'}</span>
                                     <div className="flex gap-2">
                                         <span className="hover:text-white cursor-pointer">{settings.brand_footer_link_1 || 'Play'}</span>
                                         <span className="hover:text-white cursor-pointer">{settings.brand_footer_link_2 || 'Sign Up'}</span>
                                         <span className="hover:text-white cursor-pointer">{settings.brand_footer_link_3 || 'Support'}</span>
                                     </div>
                                 </div>
                             </div>
                         )}
 
                         <div className="border-t border-white/10 pt-3 text-center text-[10px] text-gray-500 relative z-10">
                             Pre-rendering layout styles of active component
                         </div>
                     </div>
                 </div>
             </div>
         </div>
     );
 }
 
 export default ManageSettings;
