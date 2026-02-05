import React, { useContext, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import api from '../utils/api';

const Profile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isPassModalOpen, setIsPassModalOpen] = useState(false);
    const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');

    // Settings State
    const [availabilityStatus, setAvailabilityStatus] = useState(user?.availabilityStatus || 'Available for Meetup');
    const [saveSuccess, setSaveSuccess] = useState('');
    const [saveError, setSaveError] = useState('');

    const handleSaveSettings = async () => {
        try {
            await api.post('/api/user/profile', { availabilityStatus });
            setSaveSuccess('Settings saved successfully!');
            setSaveError('');
            // Persistent notification: No timeout, user must dismiss
        } catch (err) {
            console.error(err);
            setSaveError('Failed to save settings.');
            setSaveSuccess('');
        }
    };

    const handleChangePassword = async () => {
        if (!passData.currentPassword || !passData.newPassword) {
            setPassError('All fields are required');
            return;
        }
        try {
            await api.post('/api/user/change-password', passData);
            setPassSuccess('Password updated successfully!');
            setPassError('');
            setPassData({ currentPassword: '', newPassword: '' });
            setTimeout(() => {
                setIsPassModalOpen(false);
                setPassSuccess('');
            }, 2000);
        } catch (err) {
            setPassError(err.response?.data?.error || 'Failed to update password');
            setPassSuccess('');
        }
    };

    if (!user) return null;

    return (
        <div className="bg-transparent text-[#1a100f] dark:text-[#E6E1E5] font-display transition-colors duration-300 min-h-full flex flex-col">
            <main className="flex-grow p-4 md:p-8 lg:p-12">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* Left Column: User Card */}
                    <section className="lg:col-span-5 flex flex-col gap-6">
                        <div className="bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl rounded-[28px] p-8 shadow-xl border border-white/20 dark:border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-transparent"></div>
                            <div className="relative flex flex-col items-center text-center">
                                {/* Avatar */}
                                <div className="w-32 h-32 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center text-4xl font-display font-bold mb-4 shadow-sm border-4 border-white dark:border-[#141218] overflow-hidden">
                                    {user.profilePhoto ? (
                                        <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-5xl">person</span>
                                    )}
                                </div>
                                <h1 className="text-2xl font-display font-bold text-[#1a100f] dark:text-[#E6E1E5] mb-1">{user.displayName}</h1>
                                <p className="text-[#5e413d] dark:text-[#CAC4D0] text-sm mb-6">@{user.email.split('@')[0]}</p>

                                {/* Bio */}
                                <div className="w-full text-left">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#915b55] dark:text-[#938F99] mb-2">Bio</label>
                                    <div className="bg-[#f2e9e9] dark:bg-[#231f29] rounded-2xl p-4 border border-[#be3627]/10 dark:border-white/5 text-[#1a100f] dark:text-[#E6E1E5]">
                                        <p className="text-base leading-relaxed">{user.bio || "No bio yet."}</p>
                                    </div>
                                </div>

                                {/* Interests */}
                                <div className="w-full text-left mt-6">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#915b55] dark:text-[#938F99] mb-3">Interests</label>
                                    <div className="flex flex-wrap gap-2">
                                        {user.interests && user.interests.map((int, i) => (
                                            <span key={i} className="px-4 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-sm font-semibold border border-primary/10">
                                                {typeof int === 'string' ? int : int.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/setup')}
                                    className="mt-8 w-full py-3.5 px-4 rounded-full border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-300 font-bold flex items-center justify-center gap-2 group"
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
                        <div className="bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl rounded-[28px] p-8 shadow-xl border border-white/20 dark:border-white/5 h-fit">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#be3627]/10 dark:border-white/5">
                                <span className="material-symbols-outlined text-primary text-2xl">security</span>
                                <h2 className="text-xl font-display font-bold text-[#1a100f] dark:text-[#E6E1E5]">Privacy & Status</h2>
                            </div>

                            {/* Persistent Notifications */}
                            {saveSuccess && (
                                <div className="mb-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-100 px-4 py-3 rounded-xl flex justify-between items-center">
                                    <span className="font-bold text-sm">{saveSuccess}</span>
                                    <button onClick={() => setSaveSuccess('')} className="hover:opacity-70">
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                </div>
                            )}
                            {saveError && (
                                <div className="mb-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-100 px-4 py-3 rounded-xl flex justify-between items-center">
                                    <span className="font-bold text-sm">{saveError}</span>
                                    <button onClick={() => setSaveError('')} className="hover:opacity-70">
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-[#1a100f] dark:text-[#E6E1E5] mb-2">Availability Status</label>
                                    <p className="text-xs text-[#5e413d] dark:text-[#CAC4D0] mb-3">Controls your visibility on the map. "Invisible" hides you completely.</p>
                                    <div className="relative">
                                        <select
                                            value={availabilityStatus}
                                            onChange={(e) => setAvailabilityStatus(e.target.value)}
                                            className="w-full bg-[#f2e9e9] dark:bg-[#231f29] border-none rounded-2xl px-4 py-3 [appearance:none] [-webkit-appearance:none] [-moz-appearance:none] focus:ring-2 focus:ring-primary text-[#1a100f] dark:text-[#E6E1E5] font-medium cursor-pointer"
                                        >
                                            <option value="Chat Only">Chat Only</option>
                                            <option value="Available for Meetup">Available for Meetup</option>
                                            <option value="Invisible">Invisible</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#915b55] dark:text-[#CAC4D0]">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-[#be3627]/10 dark:border-white/5 pt-6 mt-2">
                                    <label className="block text-sm font-bold text-[#1a100f] dark:text-[#E6E1E5] mb-3">Account Security</label>
                                    <button
                                        onClick={() => setIsPassModalOpen(true)}
                                        className="w-full py-4 px-4 rounded-2xl border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 group"
                                    >
                                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">lock_reset</span>
                                        Change Password
                                    </button>
                                </div>
                            </div>

                            <div className="pt-8">
                                <button
                                    onClick={handleSaveSettings}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-full shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Save Settings
                                </button>
                            </div>
                        </div>

                        {/* Requests */}
                        <div className="bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl rounded-[28px] p-8 shadow-xl border border-white/20 dark:border-white/5 flex-grow">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#be3627]/10 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-2xl">people</span>
                                    <h2 className="text-xl font-display font-bold text-[#1a100f] dark:text-[#E6E1E5]">Friend Requests</h2>
                                </div>
                                <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">0</span>
                            </div>
                            <div className="flex flex-col items-center justify-center py-8 text-center h-full min-h-[150px]">
                                <div className="w-16 h-16 bg-[#f2e9e9] dark:bg-[#231f29] rounded-full flex items-center justify-center mb-4 text-[#915b55] dark:text-[#938F99]">
                                    <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                                </div>
                                <p className="text-[#1a100f] dark:text-[#E6E1E5] font-bold">No pending requests.</p>
                                <p className="text-xs text-[#5e413d] dark:text-[#CAC4D0] mt-1">Check back later or explore the map to meet new people!</p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <footer className="mt-auto py-8 text-center text-xs text-[#5e413d] dark:text-[#CAC4D0] font-medium">
                <p>© 2026 KON-NECT. All rights reserved.</p>
            </footer>

            {/* Change Password Modal */}
            <Modal open={isPassModalOpen} onClose={() => setIsPassModalOpen(false)}>
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 400, bgcolor: 'background.paper', borderRadius: 4, boxShadow: 24, p: 4,
                    border: '1px solid', borderColor: 'divider'
                }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Change Password</Typography>

                    {passSuccess ? (
                        <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-center font-bold">
                            {passSuccess}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <TextField
                                label="Current Password"
                                type="password"
                                fullWidth
                                value={passData.currentPassword}
                                onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                            />
                            <TextField
                                label="New Password"
                                type="password"
                                fullWidth
                                value={passData.newPassword}
                                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                            />
                            {passError && <Typography color="error" variant="caption">{passError}</Typography>}
                            <div className="flex justify-end gap-2 mt-2">
                                <Button onClick={() => setIsPassModalOpen(false)} color="inherit">Cancel</Button>
                                <Button onClick={handleChangePassword} variant="contained" sx={{ bgcolor: 'primary.main' }}>Update</Button>
                            </div>
                        </div>
                    )}
                </Box>
            </Modal>
        </div>
    );
};

export default Profile;
