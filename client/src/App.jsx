import React, { useEffect, useState, useMemo, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './store/authSlice';
import MapComponent from './components/Map';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import ProfileSetup from './components/ProfileSetup';
import Chat from './components/Chat';
import Social from './components/Social';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';

// Theme Context
export const ColorModeContext = createContext({
    toggleColorMode: () => { },
    mode: 'dark',
});

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useSelector(state => state.auth);
    if (!isAuthenticated) {
        return <Navigate to="/welcome" replace />;
    }
    return children;
};

const App = () => {
    const dispatch = useDispatch();
    const { loading } = useSelector(state => state.auth);

    // Theme State
    const [mode, setMode] = useState('dark');

    const colorMode = useMemo(() => ({
        toggleColorMode: () => {
            setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
        },
        mode
    }), [mode]);

    const theme = useMemo(() => getTheme(mode, 'blue'), [mode]);

    // Apply Tailwind Dark Mode
    useEffect(() => {
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [mode]);

    // Initial Auth Check override
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            dispatch(fetchCurrentUser());
        }
    }, [dispatch]);

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
                                            <Route path="/" element={<Profile />} />
                                            <Route path="/social" element={<Social />} />
                                            <Route path="/profile" element={<Profile />} />
                                            <Route path="/setup" element={<ProfileSetup />} />
                                            <Route path="/chat" element={<Chat />} />
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

export default App;
