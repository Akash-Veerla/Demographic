import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Map, User, Radio, Heart, Shield, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import M3LoadingIndicator from './M3LoadingIndicator';
import M3Card from './M3Card';

const Home = () => {
    const { user, userLocation } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ activeNearby: 0, matchedInterestsNearby: 0, topInterests: [] });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (!user || !userLocation) return;

        const fetchStats = async () => {
            try {
                // Pass current coordinates directly for guaranteed accuracy
                const res = await api.get('/api/stats/local', {
                    params: { lat: userLocation.lat, lng: userLocation.lng }
                });
                setStats(res.data);
            } catch (err) {
                console.error("Failed to load stats", err);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStats();
    }, [userLocation?.lat, userLocation?.lng]); // Stable primitive deps

    // Card Component for consistency — now using M3Card
    const DashboardCard = ({ title, description, icon: Icon, onClick, className = "" }) => (
        <M3Card
            variant="elevated"
            onClick={onClick}
            interactive
            className={`flex flex-col items-center text-center group ${className}`}
        >
            <div className="w-12 h-12 bg-primary/10 rounded-sq-xl flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
        </M3Card>
    );

    const StatCard = ({ label, count, description, icon: Icon }) => (
        <M3Card variant="outlined" className="flex flex-col items-center text-center justify-center h-full" padding="p-8">
            <span className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-4 flex items-center gap-2">
                <Icon size={14} /> {label}
            </span>
            <div className="text-6xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                {loadingStats ? <M3LoadingIndicator size={40} className="mx-auto" /> : count}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </M3Card>
    );

    const PulseCard = ({ category, count, index }) => (
        <M3Card
            variant="filled"
            interactive
            onClick={() => navigate(`/map?filter=${category}`)}
            className="flex-shrink-0 w-64 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 border border-primary/10 relative overflow-hidden group hover:border-primary/30"
            padding="p-6"
        >
            <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-sq-xs animate-ping"></div>
            <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-sq-xs"></div>

            <h4 className="text-xl font-black text-gray-900 dark:text-white mb-1">{category}</h4>
            <p className="text-sm text-primary font-bold">{count} Active Nearby</p>
            <div className="mt-4 h-1 w-full bg-gray-100 dark:bg-white/10 rounded-sq-md overflow-hidden">
                <div className="h-full bg-primary rounded-sq-md" style={{ width: '70%' }}></div>
            </div>
        </M3Card>
    );

    return (
        <div className="min-h-full w-full bg-transparent p-4 md:p-8 font-display transition-colors duration-300 pb-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* 1. Header / Greeting */}
                <div className="mb-4 animate-fade-in">
                    <h1 className="text-3xl md:text-4xl font-black text-[#1a100f] dark:text-white tracking-tight">
                        Welcome back, <span className="text-primary">{user?.displayName?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-[#5e413d] dark:text-[#CAC4D0] font-bold mt-1">Ready to find some new connections?</p>
                </div>

                {/* 2. Navigation Cards (Row 1) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DashboardCard
                        title="Explore Map"
                        description="Discover people and places matching your vibe nearby."
                        icon={Map}
                        onClick={() => navigate('/social')}
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
                        label="Friends Online"
                        count={stats.activeNearby}
                        description="Mutual friends active within 20km"
                        icon={Radio}
                    />
                    <StatCard
                        label="Matched Interests"
                        count={stats.matchedInterestsNearby}
                        description="Users within 20km sharing your interests"
                        icon={Heart}
                    />
                </div>

                {/* 4. Live Pulse Carousel (New Row) */}
                {stats.topInterests && stats.topInterests.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                Live Pulse (50km)
                            </h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                            {stats.topInterests.map((item, i) => (
                                <div key={i} className="snap-start">
                                    <PulseCard category={item.category} count={item.count} index={i} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. Info / Welcome Section (Row 4 - Glassmorphism) */}
                <div className="bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl rounded-sq-2xl p-8 md:p-12 border border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="max-w-4xl mx-auto relative z-10">
                        <div className="mb-10 text-center md:text-left">
                            <h2 className="text-3xl font-black text-[#1a100f] dark:text-white mb-4 tracking-tight">Welcome to KON-NECT</h2>
                            <p className="text-[#5e413d] dark:text-[#CAC4D0] leading-relaxed font-medium text-lg">
                                KON-NECT helps you discover and connect with people near you who share your passions. Whether it's tech, travel, music, or art — find your tribe on the map, send a friend request, and start real conversations. No algorithms, no endless scrolling — just genuine connections based on what you love.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
                            <div>
                                <h3 className="font-black text-xl text-[#1a100f] dark:text-white mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-sq-lg flex items-center justify-center text-primary">
                                        <CheckCircle size={22} strokeWidth={2.5} />
                                    </div>
                                    How it Works
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        "Open the Map to see people near you with shared interests.",
                                        "Click on a pin to view their profile and interests.",
                                        "Send a Friend Request to connect and start chatting."
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
                                    <div className="w-10 h-10 bg-primary/10 rounded-sq-lg flex items-center justify-center text-primary">
                                        <Shield size={22} strokeWidth={2.5} />
                                    </div>
                                    Safe & Private
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        "Your exact location is fuzzed — only your general area is visible.",
                                        "Online status is only visible to your mutual friends.",
                                        "Chat unlocks only after both users accept a friend request."
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
