import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '../store/authSlice';

const Profile = () => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="bg-background-light dark:bg-background-dark text-on-surface dark:text-on-surface-dark font-sans transition-colors duration-300 min-h-screen flex flex-col">
            {/* Navbar Removed (Handled by Layout.jsx) */}

            <main className="flex-grow p-4 md:p-8 lg:p-12">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* Left Column: User Card */}
                    <section className="lg:col-span-5 flex flex-col gap-6">
                        <div className="bg-surface-light dark:bg-surface-container-dark rounded-3xl p-8 shadow-elevation-1 border border-white/50 dark:border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-transparent"></div>
                            <div className="relative flex flex-col items-center text-center">
                                {/* Avatar */}
                                <div className="w-32 h-32 rounded-full bg-primary-container dark:bg-primary-container-dark text-on-primary-container dark:text-on-primary-container-dark flex items-center justify-center text-4xl font-display font-bold mb-4 shadow-sm border-4 border-surface-light dark:border-surface-container-dark overflow-hidden">
                                    {user.profilePhoto ? (
                                        <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-5xl">person</span>
                                    )}
                                </div>
                                <h1 className="text-2xl font-display font-bold text-on-surface dark:text-on-surface-dark mb-1">{user.displayName}</h1>
                                <p className="text-secondary dark:text-gray-400 text-sm mb-6">@{user.email.split('@')[0]}</p>

                                {/* Bio */}
                                <div className="w-full text-left">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-gray-400 mb-2">Bio</label>
                                    <div className="bg-white dark:bg-black/20 rounded-xl p-4 border border-outline/20 dark:border-outline-dark/20 text-on-surface dark:text-on-surface-dark">
                                        <p className="text-base leading-relaxed">{user.bio || "No bio yet."}</p>
                                    </div>
                                </div>

                                {/* Interests */}
                                <div className="w-full text-left mt-6">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-gray-400 mb-3">Interests</label>
                                    <div className="flex flex-wrap gap-2">
                                        {user.interests && user.interests.map((int, i) => (
                                            <span key={i} className="px-4 py-1.5 rounded-full bg-surface-container dark:bg-surface-dark text-on-surface dark:text-on-surface-dark text-sm font-medium border border-outline/20 dark:border-outline-dark/20">
                                                {typeof int === 'string' ? int : int.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/setup')}
                                    className="mt-8 w-full py-3 px-4 rounded-full border border-outline dark:border-outline-dark text-primary dark:text-primary-container hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors font-medium flex items-center justify-center gap-2 group"
                                >
                                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-lg">edit</span>
                                    Edit Bio & Interests
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Right Column: Settings & Requests */}
                    <section className="lg:col-span-7 flex flex-col gap-6">
                        {/* Settings */}
                        <div className="bg-surface-light dark:bg-surface-container-dark rounded-3xl p-8 shadow-elevation-1 border border-white/50 dark:border-white/5 h-fit">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline/10 dark:border-outline-dark/10">
                                <span className="material-symbols-outlined text-primary text-2xl">security</span>
                                <h2 className="text-xl font-display font-bold text-on-surface dark:text-on-surface-dark">Privacy & Status</h2>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-on-surface dark:text-on-surface-dark mb-2">Availability Status</label>
                                    <p className="text-xs text-secondary dark:text-gray-400 mb-3">Controls your visibility on the map.</p>
                                    <div className="relative">
                                        <select className="w-full bg-white dark:bg-black/20 border border-outline/30 dark:border-outline-dark/30 rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-primary focus:border-transparent text-on-surface dark:text-on-surface-dark">
                                            <option>Chat Only</option>
                                            <option>Available for Meetup</option>
                                            <option>Invisible</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-secondary dark:text-gray-400">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-on-surface dark:text-on-surface-dark mb-3">Location Precision</label>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <label className="flex items-center p-3 rounded-xl border border-primary bg-primary/5 dark:bg-primary/10 cursor-pointer transition-colors">
                                            <input type="radio" name="location" className="form-radio text-primary focus:ring-primary h-5 w-5" defaultChecked />
                                            <span className="ml-3 text-sm font-medium text-on-surface dark:text-on-surface-dark">Exact</span>
                                        </label>
                                        <label className="flex items-center p-3 rounded-xl border border-outline/30 dark:border-outline-dark/30 hover:bg-surface-container dark:hover:bg-white/5 cursor-pointer transition-colors">
                                            <input type="radio" name="location" className="form-radio text-primary focus:ring-primary h-5 w-5" />
                                            <span className="ml-3 text-sm font-medium text-on-surface dark:text-on-surface-dark">Approximate (~1km fuzz)</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                                        Save Settings
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Requests */}
                        <div className="bg-surface-light dark:bg-surface-container-dark rounded-3xl p-8 shadow-elevation-1 border border-white/50 dark:border-white/5 flex-grow">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline/10 dark:border-outline-dark/10">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-2xl">people</span>
                                    <h2 className="text-xl font-display font-bold text-on-surface dark:text-on-surface-dark">Friend Requests</h2>
                                </div>
                                <span className="bg-primary-container dark:bg-primary-container-dark text-on-primary-container dark:text-on-primary-container-dark text-xs font-bold px-2.5 py-1 rounded-full">0</span>
                            </div>
                            <div className="flex flex-col items-center justify-center py-8 text-center h-full min-h-[150px]">
                                <div className="w-16 h-16 bg-surface-container dark:bg-surface-dark rounded-full flex items-center justify-center mb-4 text-secondary dark:text-gray-500">
                                    <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                                </div>
                                <p className="text-secondary dark:text-gray-400 font-medium">No pending requests.</p>
                                <p className="text-xs text-secondary/70 dark:text-gray-500 mt-1">Check back later or explore the map to meet new people!</p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <footer className="mt-auto py-8 text-center text-xs text-secondary dark:text-gray-500">
                <p>© 2023 KON-NECT. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Profile;
