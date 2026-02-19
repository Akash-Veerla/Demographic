import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userLocation, setUserLocation] = useState(null); // { lat, lng } — single source of truth for geolocation

    // Check localStorage OR URL query param for token to set initial loading state
    const [loading, setLoading] = useState(!!localStorage.getItem('token') || window.location.search.includes('token='));
    const [error, setError] = useState(null);

    // --- Actions ---

    const fetchCurrentUser = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/current_user');
            const fetchedUser = response.data;
            setUser(fetchedUser);
            setIsAuthenticated(true);
            // Seed userLocation from stored DB location if available
            if (fetchedUser?.location?.coordinates) {
                const [lng, lat] = fetchedUser.location.coordinates;
                if (lat && lng && !(lat === 0 && lng === 0)) {
                    setUserLocation({ lat, lng });
                }
            }
        } catch (err) {
            console.error("Fetch User Failed:", err);
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
            setError(null); // Don't show error on initial load failure
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/api/auth/login', credentials);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setUser(user);
            setIsAuthenticated(true);
            return user;
        } catch (err) {
            const msg = err.response?.data?.error || 'Login failed';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/api/auth/register', userData);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setUser(user);
            setIsAuthenticated(true);
            return user;
        } catch (err) {
            const msg = err.response?.data?.error || 'Registration failed';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
    };

    const updateInterests = async (interests) => {
        try {
            const response = await api.post('/api/user/interests', { interests });
            setUser(response.data); // Update local user state
            return response.data;
        } catch (err) {
            console.error("Update Interests Failed:", err);
            throw err;
        }
    };

    const updateProfile = async (data) => {
        try {
            const response = await api.post('/api/user/profile', data);
            setUser(response.data);
            return response.data;
        } catch (err) {
            console.error("Update Profile Failed:", err);
            throw err;
        }
    }

    const forgotPassword = async (email) => {
        try {
            const response = await api.post('/api/auth/forgot-password', { email });
            return response.data;
        } catch (err) {
            throw err;
        }
    }

    // --- Init ---

    const updateLocation = useCallback(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    await api.post('/api/user/location', { lat: latitude, lng: longitude });
                    // Update both user object and standalone location
                    setUserLocation({ lat: latitude, lng: longitude });
                    setUser(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            location: {
                                type: 'Point',
                                coordinates: [longitude, latitude]
                            }
                        };
                    });
                } catch (err) {
                    console.error("Failed to update location:", err);
                }
            },
            (err) => console.error("Geolocation error:", err),
            { enableHighAccuracy: true }
        );
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            updateLocation();
        }
    }, [isAuthenticated, updateLocation]);

    useEffect(() => {
        // Check for token in URL (Google Auth Redirect)
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');

        if (urlToken) {
            localStorage.setItem('token', urlToken);
            // Clear Query Params to clean URL
            window.history.replaceState(null, '', window.location.pathname);
        }

        const token = localStorage.getItem('token');
        if (token) {
            fetchCurrentUser();
        } else {
            setLoading(false);
        }
    }, [fetchCurrentUser]);

    const value = {
        user,
        userLocation,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        updateInterests,
        updateProfile,
        updateLocation,
        forgotPassword,
        fetchCurrentUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
