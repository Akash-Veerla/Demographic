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
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'transparent', color: 'text.primary' }}>
            <AppBar position="fixed" elevation={1} sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                color: theme.palette.text.primary,
                backdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[1] // Elevation 1 (shadow-sm)
            }}>
                <Toolbar>
                    <MapIcon color={theme.palette.primary.main} style={{ marginRight: '10px' }} />
                    <Typography
                        variant="h6"
                        component="div"
                        onClick={() => navigate('/')}
                        sx={{
                            flexGrow: 1,
                            fontWeight: '800',
                            letterSpacing: '-0.5px',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        KON-NECT
                    </Typography>

                    {/* Desktop Nav */}
                    {!isMobile && user && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                                startIcon={<MapIcon size={20} />}
                                onClick={() => navigate('/')}
                                sx={{
                                    color: location.pathname === '/' ? theme.palette.primary.main : theme.palette.text.secondary,
                                    fontWeight: location.pathname === '/' ? 600 : 400,
                                    position: 'relative',
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main },
                                    '&::after': location.pathname === '/' ? {
                                        content: '""',
                                        position: 'absolute',
                                        bottom: 0,
                                        left: '20%',
                                        width: '60%',
                                        height: '2px',
                                        bgcolor: theme.palette.primary.main,
                                        borderRadius: '2px'
                                    } : {}
                                }}
                            >
                                Map
                            </Button>
                            <Button
                                startIcon={<MessageSquare size={20} />}
                                onClick={() => navigate('/chat')}
                                sx={{
                                    color: location.pathname === '/chat' ? theme.palette.primary.main : theme.palette.text.secondary,
                                    fontWeight: location.pathname === '/chat' ? 600 : 400,
                                    position: 'relative',
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main },
                                    '&::after': location.pathname === '/chat' ? {
                                        content: '""',
                                        position: 'absolute',
                                        bottom: 0,
                                        left: '20%',
                                        width: '60%',
                                        height: '2px',
                                        bgcolor: theme.palette.primary.main,
                                        borderRadius: '2px'
                                    } : {}
                                }}
                            >
                                Chat
                            </Button>

                            <Box sx={{ width: '1px', height: 24, bgcolor: theme.palette.divider, mx: 2 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2, cursor: 'pointer', p: 0.5, borderRadius: 2, '&:hover': { bgcolor: theme.palette.action.hover } }} onClick={() => navigate('/profile')}>
                                <Avatar user={user} sx={{ width: 32, height: 32, border: `2px solid ${theme.palette.primary.main}` }} />
                                <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>{user.displayName}</Typography>
                            </Box>
                            <IconButton onClick={handleLogout} sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.error.main } }} title="Logout">
                                <LogOut size={20} />
                            </IconButton>
                        </Box>
                    )}

                    {/* Mobile Logout/Menu */}
                    {isMobile && user && (
                        <IconButton
                            size="large"
                            edge="end"
                            color="inherit"
                            onClick={handleMenu}
                        >
                            <Avatar user={user} sx={{ width: 32, height: 32 }} />
                        </IconButton>
                    )}
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        keepMounted
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                        PaperProps={{
                            sx: {
                                bgcolor: '#1e293b',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                            <User size={16} style={{ marginRight: 8 }} /> Profile
                        </MenuItem>
                        <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>
                            <LogOut size={16} style={{ marginRight: 8 }} /> Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box sx={{ flexGrow: 1, pt: '64px', position: 'relative', overflow: 'hidden', pb: isMobile ? 7 : 0 }}>
                {children}
            </Box>

            {/* Mobile Bottom Nav - Glass */}
            {isMobile && user && (
                <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, bgcolor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.1)' }} elevation={3}>
                    <BottomNavigation
                        showLabels
                        value={location.pathname}
                        onChange={(event, newValue) => {
                            navigate(newValue);
                        }}
                        sx={{ bgcolor: 'transparent' }}
                    >
                        {navItems.map((item) => (
                            <BottomNavigationAction
                                key={item.label}
                                label={item.label}
                                value={item.path}
                                icon={item.icon}
                                sx={{
                                    color: 'rgba(255,255,255,0.5)',
                                    '&.Mui-selected': { color: '#38bdf8' }
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
