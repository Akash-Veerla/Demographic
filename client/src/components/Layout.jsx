import React, { useState, useContext } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { ColorModeContext } from '../App';
import { Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import M3NavBar from './M3NavBar';
import M3IconButton from './M3IconButton';
import M3SegmentedButton from './M3SegmentedButton';
import { useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { toggleColorMode, mode } = useContext(ColorModeContext);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { label: 'Home', icon: 'home', activeIcon: 'home', path: '/' },
        { label: 'Social', icon: 'group', activeIcon: 'group', path: '/social' },
        { label: 'Profile', icon: 'person', activeIcon: 'person', path: '/profile' },
    ];

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            bgcolor: 'background.default',
            color: 'text.primary',
            position: 'relative'
        }}>

            {/* Background Layer (From Reference Designs) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div
                    className="w-full h-full bg-cover bg-center filter blur-xl scale-110 opacity-40 dark:opacity-20 transition-opacity duration-700"
                    style={{ backgroundImage: 'var(--bg-map-url)' }}
                ></div>
                {/* Overlay gradient for contrast */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-light/40 to-background-light/90 dark:via-background-dark/60 dark:to-background-dark/70 transition-colors duration-700"></div>
            </div>

            <Box sx={{
                flexGrow: 1,
                position: 'relative',
                zIndex: 1 // Content above background
            }}>
                {/* Desktop / Tablet Navbar (In Flow) */}
                {!isMobile && user && (
                    <div className={`w-[90%] max-w-2xl mx-auto mt-6 ${location.pathname.startsWith('/social') || location.pathname.startsWith('/map') ? 'mb-1' : 'mb-6'} h-16 bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl rounded-sq-2xl shadow-lg flex items-center px-6 justify-between border border-white/20 dark:border-white/5 shrink-0 transition-all duration-300`}>
                        {/* Brand */}
                        <div
                            className="flex items-center gap-3 cursor-pointer select-none"
                            onClick={() => navigate('/')}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                window.dispatchEvent(new Event('show_cluster_centers'));
                                alert('Secret Found: Clusters Activated!');
                            }}
                            onMouseDown={() => {
                                window.logoPressTimer = setTimeout(() => {
                                    window.dispatchEvent(new Event('show_cluster_centers'));
                                    // Visual feedback?
                                    alert('Easter Egg: Clusters Activated!');
                                }, 3000);
                            }}
                            onMouseUp={() => clearTimeout(window.logoPressTimer)}
                            onMouseLeave={() => clearTimeout(window.logoPressTimer)}
                            onTouchStart={() => {
                                window.logoPressTimer = setTimeout(() => {
                                    window.dispatchEvent(new Event('show_cluster_centers'));
                                    alert('Easter Egg: Clusters Activated!');
                                }, 3000);
                            }}
                            onTouchEnd={() => clearTimeout(window.logoPressTimer)}
                        >
                            <div className="w-10 h-10 rounded-sq-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                                <Home size={20} className="text-primary" />
                            </div>
                            <span className="font-display font-bold text-xl tracking-tight text-[#1a100f] dark:text-[#E6E1E5]">KON-NECT</span>
                        </div>

                        {/* Center Toggles — M3 Segmented Button */}
                        <M3SegmentedButton
                            className="hidden md:inline-flex"
                            segments={[
                                { value: '/', label: 'Home', icon: 'home' },
                                { value: '/social', label: 'Social', icon: 'group' },
                            ]}
                            value={location.pathname.startsWith('/social') || location.pathname.startsWith('/map') ? '/social' : '/'}
                            onChange={(val) => navigate(val)}
                        />

                        {/* Right Profile & Actions */}
                        <div className="flex items-center gap-3">
                            {/* Theme Toggle — M3 Icon Button */}
                            <M3IconButton
                                icon={mode === 'dark' ? 'light_mode' : 'dark_mode'}
                                variant="tonal"
                                onClick={toggleColorMode}
                                ariaLabel="Toggle theme"
                                size="default"
                            />

                            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/profile')}>
                                <div className="text-right hidden lg:block">
                                    <p className="text-sm font-bold text-[#1a100f] dark:text-[#E6E1E5] leading-none">{user.displayName?.split(' ')[0]}</p>
                                </div>
                                <Avatar user={user} sx={{ width: 40, height: 40, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                            </div>
                            {/* Logout — M3 Icon Button */}
                            <M3IconButton
                                icon="logout"
                                variant="standard"
                                onClick={handleLogout}
                                ariaLabel="Log out"
                                size="default"
                            />
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <Box sx={{ minHeight: 'calc(100% - 140px)' }}>
                    {children}
                </Box>
            </Box>

            {/* Mobile Bottom Nav — M3 Navigation Bar */}
            {isMobile && user && (
                <M3NavBar items={navItems} />
            )}
        </Box>
    );
};

export default Layout;
