import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from '../config/api';
import { useSearch } from '../context/SearchContext';
import SEOHead from '../components/SEOHead';

function SelfStudy() {
    const [apiSelfStudyPaths, setApiSelfStudyPaths] = useState([]);
    const navigate = useNavigate();
    const { debouncedQuery } = useSearch();

    const filteredPaths = debouncedQuery
        ? apiSelfStudyPaths.filter(c => c.name?.toLowerCase().includes(debouncedQuery))
        : apiSelfStudyPaths;

    useEffect(() => {
        const fetchPaths = async () => {
            try {
                // Fetch from renamed endpoint
                const res = await fetch(`${API_BASE}/self-study`);
                const data = await res.json();
                if (data.success) setApiSelfStudyPaths(data.data);
            } catch (err) { console.error('Failed to fetch self study paths:', err); }
        };
        fetchPaths();
    }, []);

    // Premium default color schemes if admin doesn't provide custom hex codes
    const defaultColorSchemes = [
        {
            gradient: "bg-gradient-to-b from-[#14532d] via-[#064e3b] to-black",
            border: "border-[#4ade80]/40 text-white",
        },
        {
            gradient: "bg-gradient-to-b from-primary-darker via-brand-indigoDark to-black",
            border: "border-primary-light/40 text-white",
        },
        {
            gradient: "bg-gradient-to-b from-[#b45309] via-[#713f12] to-black",
            border: "border-[#fcd34d]/40 text-white",
        },
        {
            gradient: "bg-gradient-to-b from-[#15803d] via-[#14532d] to-black",
            border: "border-[#86efac]/40 text-white",
        },
        {
            gradient: "bg-gradient-to-b from-[#991b1b] via-[#450a0a] to-black",
            border: "border-[#fca5a5]/40 text-white",
        },
        {
            gradient: "bg-gradient-to-b from-[#7e22ce] via-[#4c1d95] to-black",
            border: "border-[#d8b4fe]/40 text-white",
        },
    ];

    return (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-6 pb-20 text-black dark:text-white">
            <SEOHead title="Self Study Paths" description="Choose your study path and practice mock test papers for JEE, NEET, GATE, SSC CGL and other exams on Medhashree." />

            {/* Top Banner */}
            <div className="w-full bg-gradient-to-r from-indigo-600 via-primary to-[#040914] rounded-3xl py-8 sm:py-12 px-6 sm:px-10 mb-8 sm:mb-10 shadow-xl overflow-hidden relative border border-white/5 text-left">
                <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
                <h1 className="font-bold text-2xl sm:text-3xl md:text-[32px] text-white mb-3 tracking-wide z-10 relative">
                    Select Your Path to Success : &nbsp;Self Study Paths for Your Career Goals
                </h1>
                <p className="text-gray-200 text-xs sm:text-sm font-light mb-8 z-10 relative">
                    Select a self study path to explore specialized mock tests and practice questions
                </p>

                <div className="flex flex-wrap gap-3 z-10 relative">
                    <span className="border border-white/30 rounded-xl px-4 py-1.5 font-semibold text-xs tracking-wide bg-white/10 text-white shadow-md backdrop-blur-sm">
                        Trending Now
                    </span>
                    {apiSelfStudyPaths.slice(0, 4).map(cat => (
                        <span 
                            key={cat.category_id}
                            onClick={() => navigate(`/explore?category=${cat.category_id}`)}
                            className="border border-white/25 rounded-xl px-4 py-1.5 text-xs tracking-wide bg-white/5 text-gray-200 hover:text-white hover:bg-white/15 transition cursor-pointer"
                        >
                            {cat.name}
                        </span>
                    ))}
                </div>
            </div>

            {/* Popular Self Study Title */}
            <div className="flex justify-center mb-10">
                <span className="border border-gray-200 dark:border-white/10 rounded-xl px-6 py-2 font-bold text-[11px] uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-brand-surfaceAlt shadow-sm">
                    Popular Self Study Paths
                </span>
            </div>

            {/* Grid of Redesigned Left-Aligned Explore-Question Style Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredPaths.length > 0 ? filteredPaths.map((cat, idx) => {
                    const fallbackStyle = defaultColorSchemes[idx % defaultColorSchemes.length];
                    
                    // Admin custom color support
                    const hasCustomColors = cat.gradient_from && cat.gradient_to;
                    const customCardStyle = {
                        background: hasCustomColors 
                            ? `linear-gradient(to bottom right, ${cat.gradient_from}, ${cat.gradient_to})` 
                            : undefined,
                        borderColor: cat.border_color || undefined,
                    };

                    return (
                        <div
                            key={cat.category_id}
                            style={customCardStyle}
                            className={`group relative cursor-pointer border rounded-2xl p-6 sm:p-8 flex flex-col justify-between min-h-[190px] shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${
                                !hasCustomColors 
                                    ? `bg-white dark:bg-brand-surface ${fallbackStyle.border} ${fallbackStyle.gradient}`
                                    : 'text-white border-white/20'
                            }`}
                            onClick={() => navigate(`/explore?category=${cat.category_id}`)}
                        >
                            {/* Subtle overlay hover effect */}
                            <div className="absolute inset-0 bg-indigo-500/[0.02] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            
                            <div>
                                <span className={`text-[9px] font-mono font-black uppercase tracking-widest ${
                                    !hasCustomColors 
                                        ? 'text-indigo-500 dark:text-indigo-400' 
                                        : 'text-white/80'
                                }`}>
                                    SELF STUDY PATH
                                </span>
                                <h3 className="font-extrabold text-lg sm:text-xl mt-3 tracking-wide uppercase group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-left leading-snug">
                                    {cat.name}
                                </h3>
                                <p className={`text-[12px] mt-3 leading-relaxed text-left font-medium line-clamp-3 ${
                                    !hasCustomColors 
                                        ? 'text-gray-500 dark:text-gray-400' 
                                        : 'text-white/90'
                                }`}>
                                    {cat.description || "Explore audited competitive quizzes & practice questions."}
                                </p>
                            </div>

                            <div className={`flex items-center justify-between text-xs pt-4 border-t mt-6 font-semibold ${
                                !hasCustomColors 
                                    ? 'text-gray-600 dark:text-gray-400 border-gray-100 dark:border-white/5' 
                                    : 'text-white/80 border-white/10'
                            }`}>
                                <span className="font-medium">Ready to study 📚</span>
                                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all font-bold">
                                    Explore now &rarr;
                                </span>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-3 text-center text-gray-400 py-12">Loading self study paths...</div>
                )}
            </div>

        </div>
    );
}

export default SelfStudy;
