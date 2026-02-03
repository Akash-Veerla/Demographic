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
            className={`bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center group ${className}`}
        >
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
        </div>
    );

    const StatCard = ({ label, count, description, icon: Icon }) => (
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center justify-center h-full">
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
        <div className="min-h-full w-full bg-background-light dark:bg-background-dark p-4 md:p-8 font-display">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* 1. Header / Greeting */}
                <div className="mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome back, <span className="text-primary">{user?.displayName?.split(' ')[0]}</span>
                    </h1>
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

                {/* 4. Info / Welcome Section (Row 3 - Tinted Blur) */}
                <div
                    className="rounded-3xl p-8 md:p-12 border border-[var(--glass-border)] shadow-sm"
                    style={{ backgroundColor: 'var(--blur-tint)', backdropFilter: 'blur(20px)' }}
                >
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Welcome to KON-NECT</h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                Connecting People by Interest. This platform is designed to help you find meaningful connections based on what you truly care about. Unlike traditional social networks, we prioritize privacy and intentionality.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <CheckCircle size={20} className="text-primary" /> How it Works
                                </h3>
                                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></span>
                                        Navigate to the Map to see who is around you.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></span>
                                        Use Discovery Mode to find people with shared interests.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></span>
                                        Send a Friend Request if you'd like to connect.
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Shield size={20} className="text-primary" /> Safe & Private
                                </h3>
                                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></span>
                                        Your exact location is protected (fuzzed).
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></span>
                                        Chat is only enabled after mutual acceptance.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></span>
                                        You are in control of your visibility settings.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="text-center py-6">
                    <p className="text-sm text-gray-400 font-medium">© 2026 KON-NECT. All rights reserved.</p>
                </footer>

            </div>
        </div>
    );
};

export default Home;
