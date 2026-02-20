import React, { useState, useContext } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { ColorModeContext } from '../App';
import { MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import M3NavBar from './M3NavBar';
import M3IconButton from './M3IconButton';
import M3Switch from './M3Switch';
import M3SegmentedButton from './M3SegmentedButton';
import { useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { toggleColorMode, mode } = useContext(ColorModeContext);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { label: 'Home', icon: 'home', activeIcon: 'home', path: '/' },
        { label: 'Map', icon: 'map', activeIcon: 'map', path: '/map' },
        { label: 'Social', icon: 'explore', activeIcon: 'explore', path: '/social' },
        { label: 'Friends', icon: 'group', activeIcon: 'group', path: '/friends' },
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
                {/* Mobile Top Bar */}
                {isMobile && user && (
                    <div className="flex items-center justify-between px-4 h-16 bg-white dark:bg-[#141218]/10 dark:backdrop-blur-2xl border-b border-white/30 dark:border-white/10 sticky top-0 z-50">
                        <div className="flex items-center gap-2" onClick={() => navigate('/')}>
                            <img src="/logo.svg" alt="App Logo" className="w-8 h-8 rounded-2xl shadow-sm drop-shadow-sm" />
                            <span className="font-display font-bold text-lg tracking-tight text-[#1a100f] dark:text-[#E6E1E5]">KON-NECT</span>
                        </div>
                        <M3Switch
                            checked={mode === 'dark'}
                            onChange={toggleColorMode}
                            iconOn="dark_mode"
                            iconOff="light_mode"
                        />
                    </div>
                )}

                {/* Desktop / Tablet Navbar (In Flow) */}
                {!isMobile && user && (
                    <div className={`w-[98%] max-w-[1400px] mx-auto ${location.pathname.startsWith('/map') ? 'mt-0 mb-2' : 'mt-6 mb-6'} h-16 bg-white dark:bg-[#141218]/10 dark:backdrop-blur-2xl rounded-sq-2xl shadow-xl flex items-center px-6 justify-between border-[0.5px] border-white/30 dark:border-white/10 shrink-0 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]`}>
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
                            <img src="/logo.svg" alt="App Logo" className="w-10 h-10 rounded-2xl shadow-sm hover:scale-105 transition-transform drop-shadow-md" />
                            <span className="font-display font-bold text-xl tracking-tight text-[#1a100f] dark:text-[#E6E1E5] whitespace-nowrap">KON-NECT</span>
                        </div>

                        <M3SegmentedButton
                            className="hidden md:inline-flex"
                            segments={[
                                { value: '/', label: 'Home', icon: 'home' },
                                { value: '/map', label: 'Map', icon: 'map' },
                                { value: '/social', label: 'Social', icon: 'explore' },
                                { value: '/friends', label: 'Friends', icon: 'group' },
                            ]}
                            value={location.pathname === '/' ? '/' : location.pathname}
                            onChange={(val) => navigate(val)}
                        />

                        {/* Right Profile & Actions */}
                        <div className="flex items-center gap-3">
                            {/* Theme Toggle — M3 Switch (Sun/Moon) */}
                            <M3Switch
                                checked={mode === 'dark'}
                                onChange={toggleColorMode}
                                iconOn="dark_mode"
                                iconOff="light_mode"
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
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    height: location.pathname.startsWith('/map') ? '100%' : 'auto',
                    minHeight: location.pathname.startsWith('/map') ? '0px' : 'calc(100% - 140px)'
                }}>
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
