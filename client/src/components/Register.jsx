import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector(state => state.auth);

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await dispatch(registerUser(formData)).unwrap();
            navigate('/setup', { replace: true });
        } catch (err) {
            console.error("Registration failed:", err);
        }
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

            <div className="relative z-10 w-full max-w-[460px] mx-4 bg-white dark:bg-[#2c1b19] shadow-2xl p-8 md:p-10 flex flex-col animate-fade-in-up" style={{ borderRadius: '28px' }}>
                <div className="flex flex-col items-center gap-3 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-container flex items-center justify-center text-primary mb-1">
                        <span className="material-symbols-outlined text-[32px]">share_location</span>
                    </div>
                    <h1 className="text-2xl font-bold text-primary tracking-tight">KON-NECT</h1>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-[#1a100f] dark:text-white text-[28px] font-bold leading-tight tracking-tight">Create Account</h2>
                    <p className="text-[#5e413d] dark:text-[#d0c0be] text-base font-normal mt-2 leading-relaxed">
                        Join the community to connect and explore.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm text-center font-medium">
                        {error.error || 'Registration failed'}
                    </div>
                )}

                <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="displayName" className="text-[#1a100f] dark:text-white text-sm font-semibold ml-1">Full Name</label>
                        <div className="relative group">
                            <input
                                id="displayName"
                                name="displayName"
                                type="text"
                                value={formData.displayName}
                                onChange={handleChange}
                                required
                                autoComplete="name"
                                className="w-full bg-[#f2e9e9] dark:bg-[#4a2e2b] text-[#1a100f] dark:text-white border-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#3a2523] h-12 px-4 pl-11 placeholder:text-[#915b55]/70 dark:placeholder:text-[#a88a87] transition-all duration-200 ease-in-out"
                                placeholder="John Doe"
                                style={{ borderRadius: '12px' }}
                            />
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#915b55] group-focus-within:text-primary transition-colors text-[20px]">person</span>
                        </div>
                    </div>

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
                        <label htmlFor="password" className="text-[#1a100f] dark:text-white text-sm font-semibold ml-1">Password (Min 8 chars)</label>
                        <div className="relative group">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                className="w-full bg-[#f2e9e9] dark:bg-[#4a2e2b] text-[#1a100f] dark:text-white border-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#3a2523] h-12 px-4 pl-11 placeholder:text-[#915b55]/70 dark:placeholder:text-[#a88a87] transition-all duration-200 ease-in-out"
                                placeholder="••••••••"
                                style={{ borderRadius: '12px' }}
                            />
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#915b55] group-focus-within:text-primary transition-colors text-[20px]">lock</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-[#a32e21] active:scale-[0.98] text-white font-bold h-12 shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all duration-200 mt-2 rounded-full disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                    </button>
                </form>

                <div className="w-full flex items-center gap-4 my-6">
                    <div className="h-[1px] bg-gray-200 dark:bg-gray-700 flex-1"></div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Or register with</span>
                    <div className="h-[1px] bg-gray-200 dark:bg-gray-700 flex-1"></div>
                </div>

                <div className="flex justify-center gap-5 w-full">
                    {/* Only Google as requested */}
                    <button type="button" onClick={() => alert("Google Login Coming Soon!")} className="w-12 h-12 rounded-full border border-gray-100 dark:border-[#3a2523] bg-white dark:bg-[#3a2523] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#4a2e2b] hover:shadow-md transition-all duration-200 group">
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                        </svg>
                    </button>
                </div>

                <p className="mt-8 text-center text-[#5e413d] dark:text-[#d0c0be] text-sm font-medium">
                    Already have an account? <Link to="/login" className="font-bold text-primary hover:text-[#a32e21] hover:underline transition-all ml-1">Log In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
