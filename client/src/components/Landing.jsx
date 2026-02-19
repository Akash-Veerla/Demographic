import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Globe, ArrowRight } from 'lucide-react';
import { ColorModeContext } from '../App';
import M3Switch from './M3Switch';

const Landing = () => {
    const navigate = useNavigate();
    const { toggleColorMode, mode } = useContext(ColorModeContext);

    return (
        <div className="min-h-screen flex flex-col bg-[#f8f6f6] dark:bg-[#141218] text-[#1a100f] dark:text-[#E6E1E5] font-display relative selection:bg-primary/30 overflow-x-hidden">

            {/* Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="w-full h-full bg-cover bg-center opacity-40 dark:opacity-20 scale-110 blur-xl"
                    style={{ backgroundImage: 'var(--bg-map-url)' }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/60 to-[#f8f6f6] dark:from-black/40 dark:via-[#141218]/80 dark:to-[#141218]"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-10 w-full px-6 py-4 flex justify-between items-center max-w-7xl mx-auto shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary backdrop-blur-sm border border-primary/20">
                        <MapPin size={20} className="text-primary" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">KON-NECT</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Theme Toggle — M3 Switch */}
                    <M3Switch
                        checked={mode === 'dark'}
                        onChange={toggleColorMode}
                        iconOn="dark_mode"
                        iconOff="light_mode"
                    />
                    <button
                        onClick={() => navigate('/login')}
                        className="px-5 py-2 rounded-full font-bold text-sm text-[#5e413d] dark:text-[#CAC4D0] hover:text-primary transition-colors"
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => navigate('/register')}
                        className="px-5 py-2 rounded-full font-bold text-sm bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                    >
                        Sign Up
                    </button>
                </div>
            </nav>

            {/* Hero Section — fills remaining space */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center max-w-5xl mx-auto w-full min-h-0">

                {/* Badge */}
                <div className="mb-4 md:mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm">
                    <Globe size={16} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wide text-primary">Global Social Map</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-tertiary to-primary animate-gradient-x pb-2">
                    Connect with your <br />world, explicitly.
                </h1>

                <p className="text-base md:text-xl text-[#5e413d] dark:text-[#CAC4D0] max-w-2xl mb-6 md:mb-8 leading-relaxed">
                    Discover people nearby, match based on shared interests, and expand your social circle with a privacy-focused, real-time map experience.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => navigate('/register')}
                        className="group relative px-8 py-4 rounded-full bg-primary text-white font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2 justify-center">
                            Get Started Now
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>

                    <button
                        onClick={() => navigate('/login')}
                        className="px-8 py-4 rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 text-[#1a100f] dark:text-[#E6E1E5] font-bold text-lg hover:bg-white dark:hover:bg-white/10 transition-all duration-300"
                    >
                        I have an account
                    </button>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12 w-full">
                    {[
                        { icon: <MapPin size={24} />, title: "Real-time Location", desc: "See active users nearby with granular privacy controls." },
                        { icon: <Users size={24} />, title: "Interest Matching", desc: "Filter the map by shared hobbies and passions instantly." },
                        { icon: <Globe size={24} />, title: "Global & Local", desc: "Switch seamlessly between your neighborhood and the world." }
                    ].map((feature, i) => (
                        <div key={i} className="p-5 md:p-6 rounded-sq-2xl bg-white/60 dark:bg-[#1f1b24]/60 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group text-left">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-sq-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{feature.title}</h3>
                            <p className="text-sm text-[#5e413d] dark:text-[#CAC4D0] leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>

            </main>

            <footer className="relative z-10 py-3 text-center text-xs text-[#5e413d]/60 dark:text-[#CAC4D0]/60 font-medium shrink-0">
                <p>© 2026 KON-NECT. Designed for connection.</p>
            </footer>
        </div>
    );
};

export default Landing;
