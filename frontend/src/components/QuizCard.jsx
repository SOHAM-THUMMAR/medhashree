import React from 'react';
import { Link } from 'react-router-dom';

const QuizCard = ({
    title,
    category,
    image,
    difficulty,
    buttonText = "Play Now",
    buttonLink = "/play",
    stars,
    questionsCount,
    onPlay
}) => {
    return (
        <div className="bg-white dark:bg-brand-surface rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 hover:border-indigo-500/20 dark:hover:border-white/20 transition-all duration-300 group flex flex-col h-full shadow-sm hover:shadow-md">

            {/* Top Image Section */}
            <div className="h-40 w-full overflow-hidden shrink-0 relative">
                {image ? (
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        <span className="text-white/30 text-5xl font-bold select-none">{(category || title || 'Q').charAt(0).toUpperCase()}</span>
                    </div>
                )}
                {/* Optional Difficulty Badge overlapping image */}
                {difficulty && (
                    <div className="absolute top-3 left-3">
                        <span className="text-[10px] bg-[#FACC15] text-black px-2 py-0.5 rounded text-xs font-bold uppercase shadow-sm">
                            {difficulty}
                        </span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-grow">

                <h3 className="text-lg font-bold mt-1 text-gray-900 dark:text-white line-clamp-2">
                    {title}
                </h3>

                {category && (
                    <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{category}</div>
                )}

                {/* Optional Stars/Questions stats (Used mostly in Explore page) */}
                {(stars || questionsCount) && (
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        {stars && (
                            <div className="flex items-center gap-1">
                                <div className="flex text-[#fbbf24] text-[10px] drop-shadow-md tracking-wider">
                                    {/* Simplified star rendering for dummy data, can be expanded */}
                                    ★★★★<span className="text-gray-300 dark:text-gray-600">★</span>
                                </div>
                            </div>
                        )}
                        {questionsCount && (
                            <span className="font-medium bg-gray-100 dark:bg-brand-surfaceAlt text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">{questionsCount} Qs</span>
                        )}
                    </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end items-center mt-auto pt-6">
                    {buttonLink ? (
                        <Link
                            to={buttonLink}
                            onClick={onPlay}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors text-center shadow-md shadow-indigo-600/10"
                        >
                            {buttonText}
                        </Link>
                    ) : (
                        <button
                            onClick={onPlay}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-indigo-600/10"
                        >
                            {buttonText}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default QuizCard;
