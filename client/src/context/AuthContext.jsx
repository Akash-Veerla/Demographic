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
    const [loading, setLoading] = useState(!!localStorage.getItem('token'));
    const [error, setError] = useState(null);

    // --- Actions ---

    const fetchCurrentUser = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/current_user');
            setUser(response.data);
            setIsAuthenticated(true);
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

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchCurrentUser();
        } else {
            setLoading(false);
        }
    }, [fetchCurrentUser]);

    const value = {
        user,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        updateInterests,
        updateProfile,
        forgotPassword,
        fetchCurrentUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
