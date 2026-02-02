import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, forgotPassword } from '../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { Modal, Box, Typography, Button, TextField } from '@mui/material';

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector(state => state.auth);

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    // Forgot Password State
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [tempPassword, setTempPassword] = useState(null);
    const [forgotError, setForgotError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        // Prevent default form submission (reload)
        e.preventDefault();
        e.stopPropagation();

        try {
            await dispatch(loginUser(formData)).unwrap();
            navigate('/', { replace: true });
        } catch (err) {
            console.error("Login failed:", err);
        }
        return false;
    };

    const handleForgotPassword = async () => {
        if (!forgotEmail) {
            setForgotError("Please enter your email.");
            return;
        }
        try {
            const result = await dispatch(forgotPassword(forgotEmail)).unwrap();
            setTempPassword(result.tempPassword);
            setForgotError('');
        } catch (err) {
            setForgotError(err.error || "Failed to generate password.");
        }
    };

    const closeForgotModal = () => {
        setIsForgotModalOpen(false);
        setTempPassword(null);
        setForgotEmail('');
        setForgotError('');
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark font-display antialiased overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div
                    className="w-full h-full bg-cover bg-center filter blur-lg scale-110 opacity-40 dark:opacity-20"
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAJ8VVsGQsbQ71t7tcICQyIClCf8Uxwz0gCzvDqLmrgOJ9L9bi583sZn0HvniYez3uplEVS_gc97irtF3KtFQzNCk7ipt9E7bpZAWUicWX1Xzf1RW4QIgEtLiBeu5x9hJ4AlAYuObSbFjednl_JFlmNti9E1L97nltPIIy1qCgap2gY3KtlIMpy5wI0qdywUI30ttquQBFTUCgYzf4GtZJ-IGLB4SgtSHQGZDdyigDUYed9hPTfDJQX_KFfOYcHuiSt4NaH7CMvTCZe')" }}
                >
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-light/80 dark:to-background-dark/90"></div>
            </div>

            <div className="relative z-10 w-full max-w-[440px] mx-4 bg-white dark:bg-[#2c1b19] shadow-2xl p-8 md:p-10 flex flex-col animate-fade-in-up" style={{ borderRadius: '28px' }}>

                <div className="flex flex-col items-center gap-3 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-1">
                        <span className="material-symbols-outlined text-[32px]">share_location</span>
                    </div>
                    <h1 className="text-2xl font-bold text-primary tracking-tight">KON-NECT</h1>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-[#1a100f] dark:text-white text-[28px] font-bold leading-tight tracking-tight">Welcome Back</h2>
                    <p className="text-[#5e413d] dark:text-[#d0c0be] text-base font-normal mt-2 leading-relaxed">
                        Connect to your world.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm text-center font-medium">
                        {error.error || 'Login failed'}
                    </div>
                )}

                <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="email" className="text-[#1a100f] dark:text-white text-sm font-semibold ml-1">Email Address</label>
                        <div className="relative group">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                                className="w-full bg-[#f2e9e9] dark:bg-[#4a2e2b] text-[#1a100f] dark:text-white border-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#3a2523] h-12 px-4 pl-11 placeholder:text-[#915b55]/70 dark:placeholder:text-[#a88a87] transition-all duration-200 ease-in-out"
                                placeholder="user@example.com"
                                style={{ borderRadius: '12px' }}
                            />
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#915b55] group-focus-within:text-primary transition-colors text-[20px]">mail</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center ml-1">
                            <label htmlFor="password" className="text-[#1a100f] dark:text-white text-sm font-semibold">Password</label>
                        </div>
                        <div className="relative group">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
                                required
                                autoComplete="current-password"
                                className="w-full bg-[#f2e9e9] dark:bg-[#4a2e2b] text-[#1a100f] dark:text-white border-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#3a2523] h-12 px-4 pl-11 placeholder:text-[#915b55]/70 dark:placeholder:text-[#a88a87] transition-all duration-200 ease-in-out"
                                placeholder="••••••••"
                                style={{ borderRadius: '12px' }}
                            />
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#915b55] group-focus-within:text-primary transition-colors text-[20px]">lock</span>
                            <button
                                type="button"
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#915b55] hover:text-primary transition-colors focus:outline-none"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {showPassword ? 'visibility' : 'visibility_off'}
                                </span>
                            </button>
                        </div>
                        <div className="flex justify-end mt-1">
                            <button
                                type="button"
                                onClick={() => setIsForgotModalOpen(true)}
                                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors focus:outline-none"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-[#a32e21] active:scale-[0.98] text-white font-bold h-12 shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all duration-200 mt-2 rounded-full disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <span>{loading ? 'Logging In...' : 'Log In'}</span>
                    </button>
                </form>

                <p className="mt-8 text-center text-[#5e413d] dark:text-[#d0c0be] text-sm font-medium">
                    New to KON-NECT? <Link to="/register" className="font-bold text-primary hover:text-[#a32e21] hover:underline transition-all ml-1">Sign Up</Link>
                </p>
            </div>

            {/* Forgot Password Modal */}
            <Modal open={isForgotModalOpen} onClose={closeForgotModal}>
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 400, bgcolor: 'background.paper', borderRadius: 4, boxShadow: 24, p: 4
                }}>
                    <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Forgot Password
                    </Typography>

                    {!tempPassword ? (
                        <>
                            <Typography sx={{ mb: 2 }}>Enter your email to receive a temporary password.</Typography>
                            <TextField
                                fullWidth
                                label="Email Address"
                                variant="outlined"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            {forgotError && <Typography color="error" variant="caption" display="block" sx={{ mb: 2 }}>{forgotError}</Typography>}
                            <div className="flex justify-end gap-2">
                                <Button onClick={closeForgotModal}>Cancel</Button>
                                <Button variant="contained" onClick={handleForgotPassword}>Generate Password</Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Typography sx={{ mb: 2, color: 'success.main' }}>
                                Temporary password generated successfully!
                            </Typography>
                            <div className="bg-gray-100 p-4 rounded text-center font-mono text-lg font-bold mb-4 select-all">
                                {tempPassword}
                            </div>
                            <Typography variant="caption" display="block" sx={{ mb: 2, color: 'text.secondary' }}>
                                Please copy this password and login. You can change it later in your profile.
                            </Typography>
                            <Button fullWidth variant="contained" onClick={closeForgotModal}>Close</Button>
                        </>
                    )}
                </Box>
            </Modal>
        </div>
    );
};

export default Login;
