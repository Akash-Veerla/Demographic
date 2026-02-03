import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Map, MessageSquare, User, Radio, Heart, Shield, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ activeNearby: 0, matchedInterestsNearby: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/api/stats/local');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to load stats", err);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    // Card Component for consistency
    const DashboardCard = ({ title, description, icon: Icon, onClick, className = "" }) => (
        <div
            onClick={onClick}
            className={`bg-white dark:bg-[#141218] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center group ${className}`}
        >
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
        </div>
    );

    const StatCard = ({ label, count, description, icon: Icon }) => (
        <div className="bg-white dark:bg-[#141218] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center justify-center h-full">
            <span className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-4 flex items-center gap-2">
                <Icon size={14} /> {label}
            </span>
            <div className="text-6xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                {loadingStats ? '-' : count}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    );

    return (
        <div className="min-h-full w-full bg-transparent p-4 md:p-8 font-display transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* 1. Header / Greeting */}
                <div className="mb-4 animate-fade-in">
                    <h1 className="text-3xl md:text-4xl font-black text-[#1a100f] dark:text-white tracking-tight">
                        Welcome back, <span className="text-primary">{user?.displayName?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-[#5e413d] dark:text-[#CAC4D0] font-bold mt-1">Ready to find some new connections?</p>
                </div>

                {/* 2. Navigation Cards (Row 1) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DashboardCard
                        title="Explore Map"
                        description="Discover people and places matching your vibe nearby."
                        icon={Map}
                        onClick={() => navigate('/map')}
                    />
                    <DashboardCard
                        title="Conversations"
                        description="Chat with your connections and plan meetups."
                        icon={MessageSquare}
                        onClick={() => navigate('/chat')}
                    />
                    <DashboardCard
                        title="My Profile"
                        description="Update your interests to find better matches."
                        icon={User}
                        onClick={() => navigate('/profile')}
                    />
                </div>

                {/* 3. Stats (Row 2) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard
                        label="Active Nearby"
                        count={stats.activeNearby}
                        description="Users active within 10km in the last 24h"
                        icon={Radio}
                    />
                    <StatCard
                        label="Matched Interests"
                        count={stats.matchedInterestsNearby}
                        description="Users nearby sharing at least one interest"
                        icon={Heart}
                    />
                </div>

                {/* 4. Info / Welcome Section (Row 3 - Glassmorphism) */}
                <div className="bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl rounded-[32px] p-8 md:p-12 border border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="max-w-4xl mx-auto relative z-10">
                        <div className="mb-10 text-center md:text-left">
                            <h2 className="text-3xl font-black text-[#1a100f] dark:text-white mb-4 tracking-tight">Welcome to KON-NECT</h2>
                            <p className="text-[#5e413d] dark:text-[#CAC4D0] leading-relaxed font-medium text-lg">
                                Connecting People by Interest. This platform is designed to help you find meaningful connections based on what you truly care about. Unlike traditional social networks, we prioritize privacy and intentionality.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
                            <div>
                                <h3 className="font-black text-xl text-[#1a100f] dark:text-white mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <CheckCircle size={22} strokeWidth={2.5} />
                                    </div>
                                    How it Works
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        "Navigate to the Map to see who is around you.",
                                        "Use Discovery Mode to find people with shared interests.",
                                        "Send a Friend Request if you'd like to connect."
                                    ].map((text, i) => (
                                        <li key={i} className="flex gap-4 items-start group/li">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 group-hover/li:scale-150 transition-transform"></span>
                                            <span className="text-[#5e413d] dark:text-[#CAC4D0] font-bold text-sm tracking-tight">{text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-[#1a100f] dark:text-white mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Shield size={22} strokeWidth={2.5} />
                                    </div>
                                    Safe & Private
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        "Your exact location is protected (fuzzed).",
                                        "Chat is only enabled after mutual acceptance.",
                                        "You are in control of your visibility settings."
                                    ].map((text, i) => (
                                        <li key={i} className="flex gap-4 items-start group/li">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 group-hover/li:scale-150 transition-transform"></span>
                                            <span className="text-[#5e413d] dark:text-[#CAC4D0] font-bold text-sm tracking-tight">{text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="text-center py-8">
                    <p className="text-xs text-[#5e413d] dark:text-[#CAC4D0] font-black uppercase tracking-widest">© 2026 KON-NECT. All rights reserved.</p>
                </footer>

            </div>
        </div>
    );
};

export default Home;
