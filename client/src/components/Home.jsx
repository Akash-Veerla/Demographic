import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Home = () => {
    const { user } = useAuth();

    // Mock data for UI structure (replace with real data fetching later)
    const pendingRequests = [];
    const friends = [];

    return (
        <div className="h-full w-full bg-background-light dark:bg-background-dark p-6 overflow-y-auto font-display">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Welcome Section */}
                <div className="bg-surface-light dark:bg-card-dark rounded-3xl p-8 shadow-sm border border-white/50 dark:border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-on-surface dark:text-white mb-2">
                                Welcome back, {user?.displayName?.split(' ')[0]}! 👋
                            </h1>
                            <p className="text-secondary dark:text-gray-400 max-w-md">
                                Explore the map to find people with similar interests or check your connection requests below.
                            </p>
                        </div>
                        <div className="hidden sm:block">
                            <Link to="/social" className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg flex items-center gap-2">
                                <span className="material-symbols-outlined">map</span>
                                Explore Map
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Friend Requests */}
                    <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-96 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-xl text-orange-600 dark:text-orange-400">
                                    <span className="material-symbols-outlined">person_add</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Friend Requests</h2>
                            </div>
                            <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full">{pendingRequests.length}</span>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined text-gray-400 text-2xl">inbox</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No pending requests</p>
                            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                        </div>
                    </div>

                    {/* My Connections */}
                    <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-96 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                                    <span className="material-symbols-outlined">group</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">My Connections</h2>
                            </div>
                            <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full">{friends.length}</span>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined text-gray-400 text-2xl">diversity_3</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No connections yet</p>
                            <Link to="/social" className="mt-4 text-primary text-sm font-bold hover:underline">Find people nearby →</Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Home;
