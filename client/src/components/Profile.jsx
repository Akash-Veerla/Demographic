import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';

const Profile = () => {
    const { user } = useSelector(state => state.auth);
    const navigate = useNavigate();

    if (!user) return null;

    return (
        <div className="bg-background-light dark:bg-background-dark text-on-surface dark:text-on-surface-dark font-sans transition-colors duration-300 min-h-screen flex flex-col p-4 md:p-8">
             <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                {/* Left Column: User Profile */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
                        {/* Decorative Gradient Background */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-transparent"></div>

                        <div className="relative flex flex-col items-center text-center">
                            {/* Avatar */}
                            <div className="w-32 h-32 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4 border-4 border-white dark:border-[#1e1e1e] shadow-sm overflow-hidden relative">
                                {user.profilePhoto ? (
                                    <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-5xl text-primary">person</span>
                                )}
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{user.displayName}</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">@{user.email.split('@')[0]}</p>

                            {/* Bio */}
                            <div className="w-full text-left">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Bio</label>
                                <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-4 border border-gray-200 dark:border-white/10 text-sm">
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{user.bio || "No bio yet."}</p>
                                </div>
                            </div>

                            {/* Interests */}
                            <div className="w-full text-left mt-6">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Interests</label>
                                <div className="flex flex-wrap gap-2">
                                    {user.interests && user.interests.map((int, i) => (
                                        <span key={i} className="px-4 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-container text-sm font-medium border border-primary/10 dark:border-primary/20">
                                            {typeof int === 'string' ? int : int.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/setup')}
                                className="mt-8 w-full py-3 px-4 rounded-full border border-gray-300 dark:border-white/20 text-primary dark:text-primary-container hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors font-medium flex items-center justify-center gap-2 group"
                            >
                                <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-lg">edit</span>
                                Edit Bio & Interests
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-white/5 h-fit">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
                            <span className="material-symbols-outlined text-primary text-2xl">security</span>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Privacy & Status</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Availability Status</label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Controls your visibility on the map.</p>
                                <div className="relative">
                                    <select className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white">
                                        <option>Chat Only</option>
                                        <option>Available for Meetup</option>
                                        <option>Invisible</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">Location Precision</label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <label className="flex-1 flex items-center p-3 rounded-xl border border-primary bg-primary/5 dark:bg-primary/10 cursor-pointer transition-colors">
                                        <input type="radio" name="location" className="w-5 h-5 text-primary focus:ring-primary border-gray-300" defaultChecked />
                                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">Exact</span>
                                    </label>
                                    <label className="flex-1 flex items-center p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                                        <input type="radio" name="location" className="w-5 h-5 text-primary focus:ring-primary border-gray-300" />
                                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">Approximate (~1km fuzz)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
};

export default Profile;
