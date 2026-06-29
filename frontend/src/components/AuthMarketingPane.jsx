import React from 'react';

const AuthMarketingPane = ({ settings = {}, isCompact = false }) => {
    const renderTitle = (title) => {
        if (!title) return '';
        return title.split('\n').map((line, index) => (
            <span key={index}>
                {line}
                {index < title.split('\n').length - 1 && <br />}
            </span>
        ));
    };

    if (isCompact) {
        return (
            <div className="border border-white/5 bg-[#0c0b1e]/90 rounded-2xl p-5 shadow-inner flex flex-col justify-between min-h-[350px] text-left relative overflow-hidden">
                {/* Glowing backdrop blobs */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-900/40 rounded-full blur-[25px] pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-purple-900/30 rounded-full blur-[25px] pointer-events-none"></div>

                {/* Logo and Badge */}
                <div className="flex items-center gap-1.5 mb-4 relative z-10">
                    <span className="text-sm font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent italic tracking-wider">
                        {settings.brand_logo_text || 'MEDHASHREE'}
                    </span>
                    {settings.brand_logo_badge && (
                        <span className="bg-indigo-500/20 border border-indigo-500/40 text-[#a5b4fc] text-[8px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-full uppercase">
                            {settings.brand_logo_badge}
                        </span>
                    )}
                </div>
                
                {/* Heading & Subtitle */}
                <div className="mb-4 relative z-10">
                    <h3 className="text-sm font-black tracking-tight leading-snug text-white mb-2 whitespace-pre-line">
                        {settings.auth_left_title || 'Sharpen Your\nEngineering Edge'}
                    </h3>
                    <p className="text-gray-400 text-[10px] leading-relaxed font-light line-clamp-3">
                        {settings.auth_left_subtitle}
                    </p>
                </div>

                {/* Leagues list */}
                <div className="space-y-2 mt-2 relative z-10">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-2 rounded-lg">
                        <span className="text-sm">{settings.landing_tournament_1_icon || '⚛️'}</span>
                        <div className="overflow-hidden">
                            <h4 className="text-[10px] font-bold text-white truncate">{settings.landing_tournament_1_name || 'React Mastermind League'}</h4>
                            <p className="text-[8px] text-gray-500 truncate">{settings.landing_tournament_1_desc}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-2 rounded-lg">
                        <span className="text-sm">{settings.landing_tournament_2_icon || '⚡'}</span>
                        <div className="overflow-hidden">
                            <h4 className="text-[10px] font-bold text-white truncate">{settings.landing_tournament_2_name || 'JavaScript Champions Cup'}</h4>
                            <p className="text-[8px] text-gray-500 truncate">{settings.landing_tournament_2_desc}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-2 rounded-lg">
                        <span className="text-sm">{settings.landing_tournament_3_icon || '🗄️'}</span>
                        <div className="overflow-hidden">
                            <h4 className="text-[10px] font-bold text-white truncate">{settings.landing_tournament_3_name || 'Database Titans Arena'}</h4>
                            <p className="text-[8px] text-gray-500 truncate">{settings.landing_tournament_3_desc}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 bg-gradient-to-br from-[#0c0b1e] via-[#090b11] to-[#040508] relative overflow-hidden border-r border-white/5">
            {/* Visual Orb Overlay */}
            <div className="absolute top-[30%] left-[20%] w-[350px] h-[350px] bg-indigo-500/5 blur-[90px] rounded-full pointer-events-none animate-pulse"></div>
            
            {/* Brand Logo */}
            <div className="flex items-center gap-2 relative z-10">
                <span className="text-3xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent italic tracking-wider">
                    {settings.brand_logo_text || 'MEDHASHREE'}
                </span>
                {settings.brand_logo_badge && (
                    <span className="bg-indigo-500/20 border border-indigo-500/40 text-[#a5b4fc] text-[10px] font-extrabold tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                        {settings.brand_logo_badge}
                    </span>
                )}
            </div>

            {/* Core Brand Content */}
            <div className="my-auto max-w-lg relative z-10">
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
                    {renderTitle(settings.auth_left_title || 'Sharpen Your\nEngineering Edge')}
                </h2>
                <p className="text-gray-400 text-base font-light leading-relaxed mb-10">
                    {settings.auth_left_subtitle}
                </p>

                {/* Stats List */}
                <div className="space-y-5">
                    <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-xl backdrop-blur-md">
                        <span className="text-2xl">{settings.landing_tournament_1_icon || '⚛️'}</span>
                        <div>
                            <h4 className="text-sm font-bold">{settings.landing_tournament_1_name}</h4>
                            <p className="text-xs text-gray-500">{settings.landing_tournament_1_desc}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-xl backdrop-blur-md">
                        <span className="text-2xl">{settings.landing_tournament_2_icon || '⚡'}</span>
                        <div>
                            <h4 className="text-sm font-bold">{settings.landing_tournament_2_name}</h4>
                            <p className="text-xs text-gray-500">{settings.landing_tournament_2_desc}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-xl backdrop-blur-md">
                        <span className="text-2xl">{settings.landing_tournament_3_icon || '🗄️'}</span>
                        <div>
                            <h4 className="text-sm font-bold">{settings.landing_tournament_3_name}</h4>
                            <p className="text-xs text-gray-500">{settings.landing_tournament_3_desc}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer credit */}
            <div className="text-xs text-gray-600 font-mono relative z-10">
                {settings.auth_footer_text || 'SECURED PROTOCOL // CONTEST HUB 2026'}
            </div>
        </div>
    );
};

export default AuthMarketingPane;
