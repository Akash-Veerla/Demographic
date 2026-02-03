import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Map, Shield, Users } from 'lucide-react';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-full w-full bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 font-display">

            {/* Hero Section */}
            <div className="max-w-4xl mx-auto text-center mt-8 mb-16 animate-fade-in-up">
                <h1 className="text-4xl md:text-6xl font-extrabold text-[#1c110d] dark:text-white leading-tight mb-6">
                    Connect <span className="text-primary">Meaningfully.</span>
                </h1>
                <p className="text-lg md:text-xl text-secondary dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    A privacy-first platform to discover and connect with people who share your true interests. No algorithms, just real connections nearby.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate('/social')}
                        className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-primary/30 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
                    >
                        <Map size={20} />
                        Start Exploring
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="bg-white dark:bg-[#2c1b19] border border-gray-200 dark:border-gray-700 text-[#1c110d] dark:text-white font-bold py-4 px-8 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-[#3a2523] transition-all flex items-center justify-center gap-2"
                    >
                        <Users size={20} />
                        Your Profile
                    </button>
                </div>
            </div>

            {/* Feature Cards */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

                {/* Card 1 */}
                <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                        <Users size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Interest Based</h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                        Find your tribe based on what you love, not just who you know. Connect through shared passions.
                    </p>
                </div>

                {/* Card 2 */}
                <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
                        <Shield size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Privacy First</h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                        No tracking, no face scanning, no invasive ads. You control exactly what you share and when.
                    </p>
                </div>

                {/* Card 3 */}
                <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                        <Map size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Real Connections</h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                        Map-based discovery leading to real-world meetups or meaningful digital conversations.
                    </p>
                </div>

            </div>

            <footer className="mt-auto py-8 text-center text-sm text-gray-400">
                <p>&copy; 2023 KON-NECT. Redefining social discovery.</p>
            </footer>

        </div>
    );
};

export default Home;
