import React, { useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, MessageSquare, Lock, Users, ArrowRight, Sparkles, Navigation } from 'lucide-react';
import { ColorModeContext } from '../App';
import M3Switch from './M3Switch';

// ── Animated 3D Earth globe (CSS-only) ──────────────────────────────────────
const EarthGlobe = () => (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0" style={{ perspective: '220px' }}>
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-[#D0BCFF]/20 blur-xl scale-125 animate-pulse" />

        {/* Sphere container — rotates on Y axis */}
        <div
            className="relative w-full h-full rounded-full overflow-hidden"
            style={{
                background: 'radial-gradient(circle at 35% 30%, #4aaeda 0%, #1a6fa8 45%, #0d3d5e 85%, #071e2e 100%)',
                boxShadow: 'inset -6px -4px 12px rgba(0,0,0,0.4), inset 4px 3px 10px rgba(100,180,255,0.12), 0 0 30px rgba(74,174,218,0.2)',
                transformStyle: 'preserve-3d',
            }}
        >
            {/* Animated land masses — wide gradient strips that scroll left to right */}
            <div
                className="absolute inset-0 opacity-80"
                style={{
                    background: `
                        radial-gradient(ellipse 55% 22% at 48% 32%, rgba(76,153,0,0.85) 0%, transparent 70%),
                        radial-gradient(ellipse 40% 16% at 22% 58%, rgba(56,128,0,0.7)  0%, transparent 65%),
                        radial-gradient(ellipse 38% 14% at 74% 63%, rgba(56,128,0,0.70) 0%, transparent 65%),
                        radial-gradient(ellipse 28% 10% at 60% 82%, rgba(90,160,30,0.5) 0%, transparent 60%)
                    `,
                    animation: 'globeSpin 8s linear infinite',
                }}
            />
            {/* Cloud layer */}
            <div
                className="absolute inset-0 opacity-25"
                style={{
                    background: `
                        radial-gradient(ellipse 60% 8% at 50% 25%, white 0%, transparent 70%),
                        radial-gradient(ellipse 40% 6% at 30% 55%, white 0%, transparent 65%),
                        radial-gradient(ellipse 35% 5% at 70% 70%, white 0%, transparent 60%)
                    `,
                    animation: 'globeSpin 12s linear infinite',
                }}
            />
            {/* Specular highlight */}
            <div
                className="absolute rounded-full"
                style={{
                    width: '40%', height: '40%',
                    top: '8%', left: '18%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)',
                }}
            />
        </div>
        {/* Atmosphere rim glow */}
        <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
                boxShadow: '0 0 18px 4px rgba(74,174,218,0.25)',
                borderRadius: '50%',
            }}
        />
        <style>{`
            @keyframes globeSpin {
                from { background-position-x: 0%; }
                to   { background-position-x: 200%; }
            }
        `}</style>
    </div>
);

// ── Feature card with animated large icon ────────────────────────────────────
const FeatureCard = ({ icon: Icon, animIcon, title, desc, accent = 'text-blue-500', bg = 'bg-blue-500/15', wide = false }) => (
    <div className={`${wide ? 'col-span-2' : 'col-span-2 sm:col-span-1'} p-6 rounded-3xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-500 overflow-hidden relative group flex ${wide ? 'flex-col sm:flex-row items-start sm:items-center justify-between gap-6' : 'flex-col'}`}>
        {/* Large animated background icon */}
        <div className={`absolute top-0 right-0 p-4 opacity-[0.07] dark:opacity-[0.05] group-hover:opacity-[0.14] group-hover:scale-125 transition-all duration-700 ${accent}`}>
            <Icon size={100} strokeWidth={1.5} />
        </div>

        {/* Small icon badge */}
        <div className="relative z-10 flex flex-col h-full">
            <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center ${accent} mb-auto drop-shadow-md shrink-0`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            {!wide && (
                <div className="mt-8">
                    <h3 className={`text-xl font-black text-[#1a100f] dark:text-white mb-1 ${accent} dark:text-primary`}>{title}</h3>
                    <p className="text-sm font-medium text-[#5e413d] dark:text-[#CAC4D0]">{desc}</p>
                </div>
            )}
        </div>

        {wide && (
            <div className="relative z-10 w-full sm:w-2/3">
                <h3 className="text-2xl font-black text-tertiary mb-2">{title}</h3>
                <p className="text-sm font-bold text-[#5e413d] dark:text-[#CAC4D0]/80">{desc}</p>
            </div>
        )}

        {wide && <EarthGlobe />}
    </div>
);

const Landing = () => {
    const navigate = useNavigate();
    const { toggleColorMode, mode } = useContext(ColorModeContext);

    return (
        <div className="min-h-[100dvh] w-full flex flex-col bg-[#f8f6f6] dark:bg-[#0f0d13] text-[#1a100f] dark:text-[#E6E1E5] font-display relative overflow-hidden selection:bg-primary/30">

            {/* ── Fixed background ── */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 dark:opacity-[0.15] scale-105 animate-[pulse_10s_ease-in-out_infinite]"
                    style={{ backgroundImage: 'var(--bg-map-url)' }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(103,80,164,0.15)_0%,_transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_0%,_rgba(208,188,255,0.15)_0%,_transparent_70%)]" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#f8f6f6] dark:from-[#0f0d13] to-transparent" />
                <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[#f8f6f6] dark:from-[#0f0d13] to-transparent" />
                <div className="absolute top-[20%] left-[15%] w-32 h-32 bg-primary/20 rounded-full blur-[60px] animate-blob" />
                <div className="absolute top-[40%] right-[10%] w-40 h-40 bg-secondary/20 rounded-full blur-[70px] animate-blob animation-delay-2000" />
                <div className="absolute bottom-[20%] left-[40%] w-48 h-48 bg-tertiary/20 rounded-full blur-[80px] animate-blob animation-delay-4000" />
            </div>

            {/* ── Sticky nav ── */}
            <nav className="sticky top-0 z-30 w-full px-6 py-4 flex justify-between items-center max-w-7xl mx-auto shrink-0 backdrop-blur-md bg-[#f8f6f6]/60 dark:bg-[#0f0d13]/60 border-b border-white/20 dark:border-white/5">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                    <img src="/logo.svg" alt="KON-NECT" className="w-10 h-10 rounded-2xl shadow-lg border border-white/50 dark:border-white/10 group-hover:scale-105 transition-transform duration-300" />
                    <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-[#1a100f] to-[#5e413d] dark:from-white dark:to-gray-400">KON-NECT</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:block">
                        <M3Switch checked={mode === 'dark'} onChange={toggleColorMode} iconOn="dark_mode" iconOff="light_mode" />
                    </div>
                    {/* Sign In — styled with app design */}
                    <button
                        onClick={() => navigate('/login')}
                        className="hidden sm:flex items-center gap-1.5 px-5 py-2 rounded-full font-extrabold text-sm border border-[#be3627]/30 dark:border-[#D0BCFF]/30 text-[#be3627] dark:text-[#D0BCFF] hover:bg-[#be3627]/8 dark:hover:bg-[#D0BCFF]/8 transition-all"
                    >
                        Sign In
                    </button>
                    {/* Join Now — primary filled */}
                    <button
                        onClick={() => navigate('/register')}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-full font-extrabold text-sm bg-[#be3627] dark:bg-[#D0BCFF] text-white dark:text-[#1D1B20] hover:opacity-90 hover:scale-105 transition-all shadow-lg shadow-[#be3627]/25 dark:shadow-[#D0BCFF]/15 group"
                    >
                        Join Now
                        <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </nav>

            {/* ── Main content ── */}
            <main className="relative z-10 flex-col items-center justify-center px-4 w-full flex-grow flex pb-12 pt-6 sm:pt-10">
                <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

                    {/* Left: tagline & CTA */}
                    <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-sm shimmer">
                            <Sparkles size={14} className="text-primary" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Find people near you</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.95] text-[#1a100f] dark:text-white drop-shadow-sm">
                            Meet people<br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-tertiary to-primary animate-gradient-x inline-block pb-2">
                                near you.
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-[#5e413d] dark:text-[#CAC4D0] max-w-xl font-medium leading-relaxed">
                            Open the map, see who's nearby, and connect with people who share your interests — all within 20km of where you are right now.
                        </p>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => navigate('/register')}
                                className="flex items-center gap-2 px-7 py-3.5 rounded-full font-extrabold text-base bg-[#be3627] dark:bg-[#D0BCFF] text-white dark:text-[#1D1B20] hover:opacity-90 hover:scale-105 transition-all shadow-xl shadow-[#be3627]/30 dark:shadow-[#D0BCFF]/15 group"
                            >
                                Get Started
                                <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-7 py-3.5 rounded-full font-extrabold text-base border border-[#be3627]/25 dark:border-[#D0BCFF]/25 text-[#be3627] dark:text-[#D0BCFF] hover:bg-[#be3627]/8 dark:hover:bg-[#D0BCFF]/8 transition-all"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>

                    {/* Right: feature bento grid */}
                    <div className="flex-1 w-full max-w-2xl grid grid-cols-2 gap-4 auto-rows-[minmax(140px,auto)]">

                        {/* Card 1 — Live Map */}
                        <div className="col-span-2 sm:col-span-1 p-6 rounded-3xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-500 overflow-hidden relative group flex flex-col">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.07] dark:opacity-[0.05] group-hover:opacity-[0.14] group-hover:-rotate-12 group-hover:scale-125 transition-all duration-700 text-blue-500">
                                <MapPin size={100} strokeWidth={1.5} />
                            </div>
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-auto drop-shadow-md">
                                    <MapPin size={24} strokeWidth={2.5} />
                                </div>
                                <div className="mt-8">
                                    <h3 className="text-xl font-black text-[#1a100f] dark:text-white mb-1">Live Map</h3>
                                    <p className="text-sm font-medium text-[#5e413d] dark:text-[#CAC4D0]">See people near you on a real map. Green pins are people who share your interests.</p>
                                </div>
                            </div>
                        </div>

                        {/* Card 2 — Interest Match */}
                        <div className="col-span-2 sm:col-span-1 p-6 rounded-3xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-500 overflow-hidden relative group flex flex-col">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.07] dark:opacity-[0.05] group-hover:opacity-[0.14] group-hover:rotate-6 group-hover:scale-125 transition-all duration-700 text-primary">
                                <Users size={100} strokeWidth={1.5} />
                            </div>
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-black/30 flex items-center justify-center text-primary mb-auto">
                                    <Users size={24} strokeWidth={2.5} />
                                </div>
                                <div className="mt-8">
                                    <h3 className="text-lg font-black text-primary mb-1">Interest Matching</h3>
                                    <p className="text-xs font-bold text-primary/70">The more interests you share, the higher you rank on each other's map.</p>
                                </div>
                            </div>
                        </div>

                        {/* Card 3 — Chat */}
                        <div className="col-span-2 sm:col-span-1 p-6 rounded-3xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-500 overflow-hidden relative group flex flex-col">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.07] dark:opacity-[0.05] group-hover:opacity-[0.14] group-hover:-translate-y-1 group-hover:scale-125 transition-all duration-700 text-green-500">
                                <MessageSquare size={100} strokeWidth={1.5} />
                            </div>
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 mb-auto">
                                    <MessageSquare size={24} strokeWidth={2.5} />
                                </div>
                                <div className="mt-8">
                                    <h3 className="text-lg font-black text-[#1a100f] dark:text-white mb-1">Private Chat</h3>
                                    <p className="text-xs font-bold text-[#5e413d] dark:text-[#CAC4D0]">Chat with friends only. Messages are encrypted and saved so you never lose them.</p>
                                </div>
                            </div>
                        </div>

                        {/* Card 4 — Privacy */}
                        <div className="col-span-2 sm:col-span-1 p-6 rounded-3xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-500 overflow-hidden relative group flex flex-col">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.07] dark:opacity-[0.05] group-hover:opacity-[0.14] group-hover:scale-125 group-hover:rotate-[-8deg] transition-all duration-700 text-tertiary">
                                <Lock size={100} strokeWidth={1.5} />
                            </div>
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-black/30 flex items-center justify-center text-[#1a100f] dark:text-tertiary mb-auto">
                                    <Lock size={24} strokeWidth={2.5} />
                                </div>
                                <div className="mt-8">
                                    <h3 className="text-lg font-black text-[#1a100f] dark:text-white mb-1">Privacy First</h3>
                                    <p className="text-xs font-bold text-[#5e413d] dark:text-[#CAC4D0]">Your exact location is never shown. Only your general area is visible to others.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wide bottom card — Navigation */}
                <div className="w-full max-w-6xl mx-auto mt-6">
                    <div className="w-full p-6 md:p-8 rounded-3xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-500 overflow-hidden relative group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        {/* Animated big icon */}
                        <div className="absolute top-0 right-32 p-4 opacity-[0.06] dark:opacity-[0.04] group-hover:opacity-[0.1] group-hover:translate-x-2 transition-all duration-700 text-tertiary">
                            <Navigation size={120} strokeWidth={1.3} />
                        </div>
                        <div className="relative z-10 w-full sm:w-2/3">
                            <h3 className="text-2xl font-black text-tertiary mb-2">Get Directions</h3>
                            <p className="text-sm font-bold text-[#5e413d] dark:text-[#CAC4D0]/80">
                                Found someone interesting nearby? Tap any pin and hit Directions — the app draws a live driving route that updates as you move.
                            </p>
                        </div>
                        <EarthGlobe />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Landing;
