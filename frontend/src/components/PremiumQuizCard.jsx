import React from 'react';

const PremiumQuizCard = ({
    title,
    badge,
    rightMeta,
    leftMeta,
    actionText = "Explore Quiz",
    onClick,
    className = ""
}) => {
    return (
        <div 
            onClick={onClick}
            className={`group relative cursor-pointer bg-gray-50 dark:bg-[#0d0e16]/60 border border-gray-200 dark:border-white/10 hover:border-indigo-500/40 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/10 flex flex-col justify-between h-full min-h-[170px] ${className}`}
        >
            {/* Glow on hover */}
            <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            
            <div>
                <div className="flex items-center justify-between mb-4">
                    {badge && (
                        <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            {badge}
                        </span>
                    )}
                    {rightMeta && (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                            {rightMeta}
                        </span>
                    )}
                </div>

                <h3 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-2 leading-relaxed mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-left">
                    {title}
                </h3>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-white/10 mt-auto">
                {leftMeta && <span>{leftMeta}</span>}
                {actionText && (
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                        {actionText} <span className="text-[14px]">&rarr;</span>
                    </span>
                )}
            </div>
        </div>
    );
};

export default PremiumQuizCard;
