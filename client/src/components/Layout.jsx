import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Box, useMediaQuery, useTheme, BottomNavigation, BottomNavigationAction, Paper, Container, alpha } from '@mui/material';
import { Menu as MenuIcon, LogOut, Map as MapIcon, MessageSquare, User } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import Avatar from './Avatar';
import { useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const navItems = [
        { label: 'Map', icon: <MapIcon size={20} />, path: '/' },
        { label: 'Chat', icon: <MessageSquare size={20} />, path: '/chat' },
        { label: 'Profile', icon: <User size={20} />, path: '/profile' },
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'transparent', color: 'text.primary', overflow: 'hidden' }}>

            {/* Desktop / Tablet Floating Navbar - "Stitch Style" */}
            {!isMobile && user && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl h-16 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl rounded-full shadow-lg z-[1000] flex items-center px-6 justify-between border border-white/20 dark:border-white/5 animate-in slide-in-from-top-4 fade-in duration-500">
                    {/* Brand */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <MapIcon size={20} className="text-primary" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-white">KON-NECT</span>
                    </div>

                    {/* Center Toggles (Could be Global/Local later, currently Nav) */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-full p-1 border border-slate-200 dark:border-slate-700/50">
                        <button
                            onClick={() => navigate('/')}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${location.pathname === '/' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Map
                        </button>
                        <button
                            onClick={() => navigate('/chat')}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${location.pathname === '/chat' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Chat
                        </button>
                    </div>

                    {/* Right Profile */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/profile')}>
                            <div className="text-right hidden lg:block">
                                <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">{user.displayName?.split(' ')[0]}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Online</p>
                            </div>
                            <Avatar user={user} sx={{ width: 40, height: 40, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                        </div>
                        <IconButton onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                            <LogOut size={20} />
                        </IconButton>
                    </div>
                </div>
            )}

            {/* Mobile Header (Simplified) */}
            {isMobile && user && (
                <div className="fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md z-[1000] flex items-center justify-between px-4 border-b border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                        <MapIcon className="text-primary" size={24} />
                        <span className="font-bold text-lg">KON-NECT</span>
                    </div>
                    <IconButton onClick={() => navigate('/profile')}>
                        <Avatar user={user} sx={{ width: 32, height: 32 }} />
                    </IconButton>
                </div>
            )}


            <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden', height: '100%' }}>
                {children}
            </Box>

            {/* Mobile Bottom Nav - Glass */}
            {isMobile && user && (
                <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${theme.palette.divider}` }} elevation={3}>
                    <BottomNavigation
                        showLabels
                        value={location.pathname}
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
