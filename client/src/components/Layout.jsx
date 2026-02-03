import React, { useState } from 'react';
import { Box, IconButton, useMediaQuery, useTheme, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { ColorModeContext } from '../App';
import { useContext } from 'react';
import { LogOut, Home, Users, User, Sun, Moon } from 'lucide-react';

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
        { label: 'Home', icon: <Home size={20} />, path: '/' },
        { label: 'Social', icon: <Users size={20} />, path: '/social' },
        { label: 'Profile', icon: <User size={20} />, path: '/profile' },
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'transparent', color: 'text.primary', overflow: 'hidden' }}>

            <Box sx={{ flexGrow: 1, position: 'relative', overflowY: 'auto', overflowX: 'hidden', height: '100%' }} className="custom-scrollbar">

                {/* Desktop / Tablet Navbar (In Flow) */}
                {!isMobile && user && (
                    <div className="w-[90%] max-w-2xl mx-auto mt-6 mb-6 h-16 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl rounded-full shadow-lg flex items-center px-6 justify-between border border-white/20 dark:border-white/5 shrink-0 transition-all duration-300">
                        {/* Brand */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Home size={20} className="text-primary" />
                            </div>
                            <span className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-white">KON-NECT</span>
                        </div>

                        {/* Center Toggles */}
                        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-full p-1 border border-slate-200 dark:border-slate-700/50">
                            <button
                                onClick={() => navigate('/')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${location.pathname === '/' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                Home
                            </button>
                            <button
                                onClick={() => navigate('/social')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${location.pathname.startsWith('/social') || location.pathname.startsWith('/map') ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                Social
                            </button>
                        </div>

                        {/* Right Profile & Actions */}
                        <div className="flex items-center gap-3">
                            {/* Theme Toggle */}
                            <IconButton onClick={toggleColorMode} className="text-slate-500 hover:text-primary transition-colors">
                                {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </IconButton>

                            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/profile')}>
                                <div className="text-right hidden lg:block">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">{user.displayName?.split(' ')[0]}</p>
                                </div>
                                <Avatar user={user} sx={{ width: 40, height: 40, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                            </div>
                            <IconButton onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                                <LogOut size={20} />
                            </IconButton>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <Box sx={{ minHeight: 'calc(100% - 140px)' }}>
                    {children}
                </Box>
            </Box>

            {/* Mobile Bottom Nav */}
            {isMobile && user && (
                <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${theme.palette.divider} ` }} elevation={3}>
                    <BottomNavigation
                        showLabels
                        value={location.pathname === '/' ? '/' : location.pathname.startsWith('/social') ? '/social' : location.pathname}
                        onChange={(event, newValue) => {
                            navigate(newValue);
                        }}
                        sx={{ bgcolor: 'transparent', height: 70 }}
                    >
                        {navItems.map((item) => (
                            <BottomNavigationAction
                                key={item.label}
                                label={item.label}
                                value={item.path}
                                icon={item.icon}
                                sx={{
                                    color: theme.palette.text.secondary,
                                    '&.Mui-selected': { color: theme.palette.primary.main }
                                }}
                            />
                        ))}
                    </BottomNavigation>
                </Paper>
            )}
        </Box>
    );
};

export default Layout;
