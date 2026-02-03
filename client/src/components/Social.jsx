import React, { useState, useEffect } from 'react';
import MapComponent from './Map';
import api from '../utils/api';
import { Box, Card, CardContent, Typography, Avatar, Chip, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { MessageSquare } from 'lucide-react';

const ConnectView = () => {
    const [users, setUsers] = useState([]);
    const { user } = useAuth();

    // Mock Data (Replace with real API calls later)
    const pendingRequests = [];
    const friends = [];

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/api/users/global');
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, []);

    const checkInterestMatch = (uInterests) => {
        if (!user?.interests || !uInterests) return false;
        const mySet = new Set(user.interests.map(i => typeof i === 'string' ? i.toLowerCase() : i.name.toLowerCase()));
        return uInterests.some(i => mySet.has(typeof i === 'string' ? i.toLowerCase() : i.name.toLowerCase()));
    };

    return (
        <div className="h-full w-full p-6 space-y-8">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Friend Requests */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 min-h-[300px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-xl text-orange-600 dark:text-orange-400">
                                    <span className="material-symbols-outlined">person_add</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Friend Requests</h2>
                            </div>
                            <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full">{pendingRequests.length}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined text-gray-400 text-2xl">inbox</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No pending requests</p>
                        </div>
                    </div>

                    {/* My Connections */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 min-h-[300px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                                    <span className="material-symbols-outlined">group</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">My Connections</h2>
                            </div>
                            <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full">{friends.length}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined text-gray-400 text-2xl">diversity_3</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No connections yet</p>
                        </div>
                    </div>
                </div>

                {/* Discover Suggestions */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <span className="material-symbols-outlined text-primary text-2xl">explore</span>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Discover People</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.filter(u => u._id !== user?._id).map(u => {
                            const isMatch = checkInterestMatch(u.interests);
                            return (
                                <Card key={u._id} sx={{ borderRadius: 4, bgcolor: 'background.paper' }} elevation={2}>
                                    <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2 }}>
                                        <Avatar src={u.profilePhoto} sx={{ width: 80, height: 80, border: isMatch ? '3px solid #3b82f6' : 'none' }} />
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">{u.displayName}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>{u.bio || 'No bio'}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                                            {u.interests?.slice(0, 5).map((int, i) => (
                                                <Chip
                                                    key={i}
                                                    label={typeof int === 'string' ? int : int.name}
                                                    size="small"
                                                    color={isMatch && (typeof int === 'string' ? user.interests.includes(int) : true) ? "primary" : "default"}
                                                />
                                            ))}
                                        </Box>
                                        <Button variant="outlined" startIcon={<MessageSquare size={16} />} fullWidth onClick={() => alert('Chat coming soon via Map!')}>
                                            Connect
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

const Social = () => {
    const [activeTab, setActiveTab] = useState('map');

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Tab Navigation Bar - Sticky */}
            <div className="bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-gray-800 px-4 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto flex gap-6">
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-all duration-200 flex items-center gap-2 ${activeTab === 'map'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">map</span>
                        Map
                    </button>
                    <button
                        onClick={() => setActiveTab('connect')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-all duration-200 flex items-center gap-2 ${activeTab === 'connect'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">grid_view</span>
                        Connect
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative w-full">
                {activeTab === 'map' ? (
                    // Force fixed height for Map to work in scrollable layout
                    <div className="w-full h-[85vh] relative overflow-hidden shadow-inner">
                        <MapComponent />
                    </div>
                ) : (
                    <ConnectView />
                )}
            </div>
        </div>
    );
};

export default Social;
