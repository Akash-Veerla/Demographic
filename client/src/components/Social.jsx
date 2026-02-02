import React, { useState, useEffect } from 'react';
import MapComponent from './Map';
import api from '../utils/api';
import { Box, Card, CardContent, Typography, Avatar, Chip, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { MessageSquare } from 'lucide-react';

const ConnectList = () => {
    const [users, setUsers] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Fetch nearby users (default radius logic or global)
                // For list view, we might want global or a large radius default
                const res = await api.get('/api/users/global');
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, []);

    // Helper to check match (duplicated from Map, should be utility)
    const checkInterestMatch = (uInterests) => {
        if (!user?.interests || !uInterests) return false;
        const mySet = new Set(user.interests.map(i => typeof i === 'string' ? i.toLowerCase() : i.name.toLowerCase()));
        return uInterests.some(i => mySet.has(typeof i === 'string' ? i.toLowerCase() : i.name.toLowerCase()));
    };

    return (
        <div className="h-full w-full bg-surface-light dark:bg-slate-900 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                            color={isMatch && (typeof int === 'string' ? user.interests.includes(int) : true) ? "primary" : "default"} // Simple highlight logic
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
    );
};

const Social = () => {
    const [activeTab, setActiveTab] = useState('map');

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Tab Navigation Bar */}
            <div className="bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-gray-800 px-4">
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
            <div className="flex-1 relative overflow-hidden">
                {activeTab === 'map' ? (
                    <MapComponent />
                ) : (
                    <ConnectList />
                )}
            </div>
        </div>
    );
};

export default Social;
