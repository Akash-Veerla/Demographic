import React, { useEffect, useState, useMemo, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import AuthProvider
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import ProfileSetup from './components/ProfileSetup';
import Chat from './components/Chat';
import Social from './components/Social';
import Home from './components/Home'; // New Home Component
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';

// Theme Context
export const ColorModeContext = createContext({
    toggleColorMode: () => { },
    mode: 'dark',
});



const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth(); // Use Context

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/welcome" replace />;
    }

    // Enforce Setup if interests are empty (and not currently on setup page)
    const isSetupPage = window.location.pathname === '/setup';
    if (isAuthenticated && user && (!user.interests || user.interests.length === 0) && !isSetupPage) {
        return <Navigate to="/setup" replace />;
    }

    return children;
};

const AppContent = () => {
    const { loading } = useAuth();

    // Theme State
    const [mode, setMode] = useState('light');

    const colorMode = useMemo(() => ({
        toggleColorMode: () => {
            setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
        },
        mode
    }), [mode]);

    const theme = useMemo(() => getTheme(mode, 'blue'), [mode]);

    useEffect(() => {
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [mode]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                    <Routes>
                        <Route path="/welcome" element={<Login />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/*"
                            element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Routes>
                                            <Route path="/" element={<Home />} />
                                            <Route path="/social" element={<Social />} />
                                            <Route path="/profile" element={<Profile />} />
                                            <Route path="/setup" element={<ProfileSetup />} />
                                            <Route path="/chat" element={<Chat />} />
                                            <Route path="/map" element={<Social />} />
                                            <Route path="*" element={<Navigate to="/" />} />
                                        </Routes>
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
