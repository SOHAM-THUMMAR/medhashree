import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from '../config/api';
import { useSearch } from '../context/SearchContext';

function Categories() {
    const [apiCategories, setApiCategories] = useState([]);
    const navigate = useNavigate();
    const { debouncedQuery } = useSearch();

    const filteredCategories = debouncedQuery
        ? apiCategories.filter(c => c.name?.toLowerCase().includes(debouncedQuery))
        : apiCategories;

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE}/categories`);
                const data = await res.json();
                if (data.success) setApiCategories(data.data);
            } catch (err) { console.error('Failed to fetch categories:', err); }
        };
        fetchCategories();
    }, []);

    // Adjusting gradients manually to closely match the image
    const refinedStyles = [
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

            {/* Top Banner */}
            <div className="w-full bg-gradient-to-r from-indigo-600 via-primary to-[#040914] rounded-2xl py-8 sm:py-12 px-6 sm:px-10 mb-8 sm:mb-10 shadow-xl overflow-hidden relative border border-white/5">
                <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
                <h1 className="font-bold text-3xl md:text-[32px] text-white mb-3 tracking-wide z-10 relative">
                    Select Your Path to Success : &nbsp;Mock Quizzes for Your Career Goals
                </h1>
                <p className="text-gray-200 text-sm font-light mb-8 z-10 relative">
                    Select a category to explore specialized mock tests and quizzes
                </p>

                <div className="flex flex-wrap gap-4 z-10 relative">
                    <span className="border border-white/30 rounded-xl px-5 py-1.5 font-semibold text-sm tracking-wide bg-white/10 text-white shadow-md backdrop-blur-sm">
                        Trending Now
                    </span>
                    {apiCategories.slice(0, 4).map(cat => (
                        <span 
                            key={cat.category_id}
                            onClick={() => navigate(`/explore?category=${cat.category_id}`)}
                            className="border border-white/25 rounded-xl px-5 py-1.5 text-sm tracking-wide bg-white/5 text-gray-200 hover:text-white hover:bg-white/15 transition cursor-pointer"
                        >
                            {cat.name}
                        </span>
                    ))}
                </div>
            </div>

            {/* Popular Categories Title */}
            <div className="flex justify-center mb-10">
                <span className="border border-gray-200 dark:border-white/10 rounded-xl px-6 py-2 font-bold text-[13px] uppercase tracking-widest text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-brand-surfaceAlt shadow-sm">
                    Popular Categories
                </span>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCategories.length > 0 ? filteredCategories.map((cat, idx) => {
                    const style = refinedStyles[idx % refinedStyles.length];
                    return (
                        <div
                            key={cat.category_id}
                            className={`rounded-2xl border ${style.border} ${style.gradient} p-8 flex flex-col items-center justify-center text-center shadow-lg hover:-translate-y-1 hover:shadow-2xl transition-all duration-300`}
                        >
                            <h2 className="text-2xl font-bold mb-3 tracking-wider">{cat.name}</h2>
                            <p className="text-[11px] leading-relaxed text-gray-300 mb-6 px-4 whitespace-pre-line font-medium text-center">
                                {cat.description || "Top rated competitive quizzes"}
                            </p>
                            <Link
                                to={`/explore?category=${cat.category_id}`}
                                className="border border-white/60 text-white rounded-full px-10 py-1.5 text-xs font-semibold hover:bg-white/20 transition-colors tracking-wide"
                            >
                                Explore now
                            </Link>
                        </div>
                    );
                }) : (
                    <div className="col-span-3 text-center text-gray-400">Loading categories...</div>
                )}
            </div>

        </div>
    );
}

export default Categories;