import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Globe, ArrowRight, Route, MessageSquare, Sparkles } from 'lucide-react';
import { ColorModeContext } from '../App';
import M3Switch from './M3Switch';

const Landing = () => {
    const navigate = useNavigate();
    const { toggleColorMode, mode } = useContext(ColorModeContext);

    return (
        <div className="min-h-[100dvh] w-full flex flex-col bg-[#f8f6f6] dark:bg-[#0f0d13] text-[#1a100f] dark:text-[#E6E1E5] font-display relative overflow-hidden selection:bg-primary/30">

            {/* Immersive Animated Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
                {/* Core Map Texture */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 dark:opacity-[0.15] scale-105 animate-[pulse_10s_ease-in-out_infinite]"
                    style={{ backgroundImage: 'var(--bg-map-url)' }}
                ></div>

                {/* Advanced Gradient Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(103,80,164,0.15)_0%,_transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_0%,_rgba(208,188,255,0.15)_0%,_transparent_70%)]"></div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#f8f6f6] dark:from-[#0f0d13] to-transparent"></div>
                <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[#f8f6f6] dark:from-[#0f0d13] to-transparent"></div>

                {/* Floating Map Nodes (Decorative) */}
                <div className="absolute top-[20%] left-[15%] w-32 h-32 bg-primary/20 rounded-full blur-[60px] animate-blob"></div>
                <div className="absolute top-[40%] right-[10%] w-40 h-40 bg-secondary/20 rounded-full blur-[70px] animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[20%] left-[40%] w-48 h-48 bg-tertiary/20 rounded-full blur-[80px] animate-blob animation-delay-4000"></div>
            </div>

            {/* Navigation Bar */}
            <nav className="relative z-20 w-full px-6 py-5 flex justify-between items-center max-w-7xl mx-auto shrink-0 transition-all duration-300">
                <div className="flex items-center gap-3 group cursor-pointer z-30" onClick={() => navigate('/')}>
                    <div className="w-12 h-12 rounded-sq-xl bg-white/70 dark:bg-black/50 backdrop-blur-xl flex items-center justify-center text-primary border border-white/50 dark:border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <MapPin size={24} className="text-primary drop-shadow-[0_0_8px_rgba(103,80,164,0.5)]" />
                    </div>
                    <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-[#1a100f] to-[#5e413d] dark:from-white dark:to-gray-400">KON-NECT</span>
                </div>
                <div className="flex items-center gap-4 z-30">
                    <div className="hidden sm:block">
                        <M3Switch
                            checked={mode === 'dark'}
                            onChange={toggleColorMode}
                            iconOn="dark_mode"
                            iconOff="light_mode"
                        />
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="hidden sm:block px-6 py-2.5 rounded-full font-extrabold text-sm text-[#5e413d] dark:text-[#CAC4D0] hover:text-primary dark:hover:text-[#D0BCFF] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => navigate('/register')}
                        className="px-6 py-2.5 rounded-sq-full font-extrabold text-sm bg-[#1a100f] dark:bg-white text-white dark:text-[#1a100f] hover:scale-105 transition-all shadow-xl shadow-black/20 dark:shadow-white/10 flex items-center gap-2 group"
                    >
                        Join Now
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </nav>

            {/* Main Hero Container */}
            <main className="relative z-10 flex-col items-center justify-center px-4 w-full flex-grow flex pb-12 pt-4 sm:pt-8">
                <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

                    {/* Left: Typography & CTA */}
                    <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-sm shimmer">
                            <Sparkles size={16} className="text-primary" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Next-Gen Spatial Networking</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.95] text-[#1a100f] dark:text-white drop-shadow-sm">
                            Map your <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-tertiary to-primary animate-gradient-x inline-block pb-2">
                                connections.
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-[#5e413d] dark:text-[#CAC4D0] max-w-xl font-medium leading-relaxed">
                            A completely revolutionized way to discover people. Utilizing geo-spatial mapping, AI-driven interest matching, and persistent real-time networking.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2">
                            <button
                                onClick={() => navigate('/register')}
                                className="group relative px-8 py-4.5 rounded-sq-2xl bg-primary text-white font-black text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-3 justify-center">
                                    Launch Interface
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            </button>

                            <button
                                onClick={() => navigate('/login')}
                                className="px-8 py-4.5 rounded-sq-2xl bg-white/50 dark:bg-black/40 backdrop-blur-2xl border-[0.5px] border-white/60 dark:border-white/10 text-[#1a100f] dark:text-white font-bold text-lg hover:bg-white/80 dark:hover:bg-black/60 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all duration-300"
                            >
                                Access Portal
                            </button>
                        </div>
                    </div>

                    {/* Right: Feature Grid (Bento Box Style) */}
                    <div className="flex-1 w-full max-w-2xl grid grid-cols-2 gap-4 auto-rows-[minmax(140px,auto)]">
                        {/* Feature 1 - Large */}
                        <div className="col-span-2 sm:col-span-1 p-6 rounded-sq-3xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-500 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                                <Route size={120} />
                            </div>
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="w-12 h-12 rounded-sq-xl bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-auto drop-shadow-md">
                                    <Route size={24} strokeWidth={2.5} />
                                </div>
                                <div className="mt-8">
                                    <h3 className="text-xl font-black text-[#1a100f] dark:text-white mb-1">Dynamic Routing</h3>
                                    <p className="text-sm font-medium text-[#5e413d] dark:text-[#CAC4D0]">OSRM-powered navigation snapping to real global road networks instantly.</p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 - Small */}
                        <div className="p-6 rounded-sq-3xl bg-primary/10 dark:bg-primary/20 backdrop-blur-3xl border border-primary/20 dark:border-primary/10 shadow-2xl hover:bg-primary/20 transition-all duration-500 flex flex-col group">
                            <div className="w-12 h-12 rounded-sq-xl bg-white/50 dark:bg-black/30 flex items-center justify-center text-primary mb-auto">
                                <Users size={24} strokeWidth={2.5} />
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-black text-primary mb-1">Interest NLP</h3>
                                <p className="text-xs font-bold text-primary/70">Geospatial matching based on shared semantic data.</p>
                            </div>
                        </div>

                        {/* Feature 3 - Small */}
                        <div className="p-6 rounded-sq-3xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-500 flex flex-col group">
                            <div className="w-12 h-12 rounded-sq-xl bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 mb-auto">
                                <MessageSquare size={24} strokeWidth={2.5} />
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-black text-[#1a100f] dark:text-white mb-1">Persistent Sockets</h3>
                                <p className="text-xs font-bold text-[#5e413d] dark:text-[#CAC4D0]">Real-time encrypted message histories & live unread sync.</p>
                            </div>
                        </div>

                        {/* Feature 4 - Wide */}
                        <div className="col-span-2 p-6 rounded-sq-3xl bg-tertiary/10 dark:bg-tertiary/20 backdrop-blur-3xl border border-tertiary/20 dark:border-tertiary/10 shadow-2xl hover:bg-tertiary/20 transition-all duration-500 overflow-hidden relative group flex items-center justify-between">
                            <div className="relative z-10 w-2/3">
                                <h3 className="text-2xl font-black text-tertiary mb-2">Global Heatmaps</h3>
                                <p className="text-sm font-bold text-tertiary/70">Observe live social pulses and trending interests bubbling up in neighboring continents in real-time.</p>
                            </div>
                            <div className="w-20 h-20 rounded-full bg-white/50 dark:bg-black/30 flex items-center justify-center text-tertiary shrink-0 animate-[spin_20s_linear_infinite]">
                                <Globe size={40} strokeWidth={2} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

        </div>
    );
};

export default Landing;
