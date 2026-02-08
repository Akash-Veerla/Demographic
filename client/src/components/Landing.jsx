import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Globe, ArrowRight } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#f8f6f6] dark:bg-[#141218] text-[#1a100f] dark:text-[#E6E1E5] font-display overflow-hidden relative selection:bg-primary/30">

            {/* Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="w-full h-full bg-cover bg-center opacity-40 dark:opacity-20 scale-110 blur-xl"
                    style={{ backgroundImage: 'var(--bg-map-url)' }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/60 to-[#f8f6f6] dark:from-black/40 dark:via-[#141218]/80 dark:to-[#141218]"></div>
            </div>

            {/* Navbar (Simple) */}
            <nav className="relative z-10 w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary backdrop-blur-sm border border-primary/20">
                        <MapPin size={20} className="text-primary" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">KON-NECT</span>
                </div>
                <div className="flex gap-4">
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

            {/* Hero Section */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 text-center max-w-5xl mx-auto">

                {/* Badge */}
                <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm animate-fade-in-up">
                    <Globe size={16} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wide text-primary">Global Social Map</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-tertiary to-primary animate-gradient-x pb-2">
                    Connect with your <br /> world, explicitly.
                </h1>

                <p className="text-lg md:text-xl text-[#5e413d] dark:text-[#CAC4D0] max-w-2xl mb-10 leading-relaxed">
                    Discover people nearby, match based on shared interests, and expand your social circle with a privacy-focused, real-time map experience.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => navigate('/register')}
                        className="group relative px-8 py-4 rounded-full bg-primary text-white font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full">
                    {[
                        { icon: <MapPin size={24} />, title: "Real-time Location", desc: "See active users nearby with granular privacy controls." },
                        { icon: <Users size={24} />, title: "Interest Matching", desc: "Filter the map by shared hobbies and passions instantly." },
                        { icon: <Globe size={24} />, title: "Global & Local", desc: "Switch seamlessly between your neighborhood and the world." }
                    ].map((feature, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-white/60 dark:bg-[#1f1b24]/60 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group text-left">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-sm text-[#5e413d] dark:text-[#CAC4D0] leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>

            </main>

            <footer className="relative z-10 py-8 text-center text-xs text-[#5e413d]/60 dark:text-[#CAC4D0]/60 font-medium">
                <p>© 2026 KON-NECT. Designed for connection.</p>
            </footer>
        </div>
    );
};

export default Landing;
