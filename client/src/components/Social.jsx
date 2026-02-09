import React, { useState, useEffect } from 'react';
import MapComponent from './Map';
import api from '../utils/api';
import { Box, Card, CardContent, Typography, Avatar, Chip, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { MessageSquare } from 'lucide-react';

const ConnectView = () => {
    const [users, setUsers] = useState([]);
    const { user } = useAuth();
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

    const handleConnectClick = (targetUser) => {
        window.dispatchEvent(new CustomEvent('map_connect_user', { detail: targetUser }));
    };

    return (
        <div className="h-full w-full p-4 space-y-4 animate-fade-in relative z-10">
            <div className="max-w-[1600px] mx-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Friend Requests */}
                    <div className="bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl rounded-[28px] p-8 shadow-xl border border-white/20 dark:border-white/5 min-h-[320px] flex flex-col group">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-2xl text-primary transition-transform group-hover:scale-110">
                                    <span className="material-symbols-outlined text-2xl font-bold">person_add</span>
                                </div>
                                <h2 className="text-xl font-black text-[#1a100f] dark:text-white tracking-tight">Friend Requests</h2>
                            </div>
                            <span className="text-xs font-black bg-primary/10 text-primary px-4 py-1.5 rounded-full uppercase tracking-wider">{pendingRequests.length}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#be3627]/10 dark:border-white/5 rounded-3xl bg-white/40 dark:bg-white/5">
                            <div className="w-20 h-20 bg-[#f2e9e9] dark:bg-[#231f29] rounded-full flex items-center justify-center mb-4 text-[#915b55] dark:text-[#938F99] shadow-inner">
                                <span className="material-symbols-outlined text-3xl">inbox</span>
                            </div>
                            <p className="text-[#5e413d] dark:text-[#CAC4D0] font-bold">Inbox is empty</p>
                            <p className="text-xs text-[#915b55] dark:text-[#938F99] mt-1 font-medium italic">New requests will appear here</p>
                        </div>
                    </div>

                    {/* My Connections */}
                    <div className="bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl rounded-[28px] p-8 shadow-xl border border-white/20 dark:border-white/5 min-h-[320px] flex flex-col group">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-2xl text-primary transition-transform group-hover:scale-110">
                                    <span className="material-symbols-outlined text-2xl font-bold">group</span>
                                </div>
                                <h2 className="text-xl font-black text-[#1a100f] dark:text-white tracking-tight">My Connections</h2>
                            </div>
                            <span className="text-xs font-black bg-primary/10 text-primary px-4 py-1.5 rounded-full uppercase tracking-wider">{friends.length}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#be3627]/10 dark:border-white/5 rounded-3xl bg-white/40 dark:bg-white/5">
                            <div className="w-20 h-20 bg-[#f2e9e9] dark:bg-[#231f29] rounded-full flex items-center justify-center mb-4 text-[#915b55] dark:text-[#938F99] shadow-inner">
                                <span className="material-symbols-outlined text-3xl">diversity_3</span>
                            </div>
                            <p className="text-[#5e413d] dark:text-[#CAC4D0] font-bold">No connections yet</p>
                            <p className="text-xs text-[#915b55] dark:text-[#938F99] mt-1 font-medium italic">Expand your map to find people</p>
                        </div>
                    </div>
                </div>

                {/* Discover Suggestions */}
                <div className="pt-4">
                    <div className="flex items-center gap-4 mb-8 ml-2">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <span className="material-symbols-outlined text-xl font-bold">explore</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#1a100f] dark:text-white tracking-tight leading-none">Discover People</h2>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Recommended for you</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.filter(u => u._id !== user?._id).map(u => {
                            const isMatch = checkInterestMatch(u.interests);
                            return (
                                <div key={u._id} className="bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl rounded-[28px] p-6 shadow-xl border border-white/20 dark:border-white/5 flex flex-col items-center text-center gap-5 transition-transform hover:-translate-y-1 duration-300">
                                    <div className="relative">
                                        <Avatar src={u.profilePhoto} sx={{ width: 90, height: 90, border: isMatch ? '4px solid #be3627' : '4px solid transparent', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }} />
                                        {isMatch && (
                                            <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-1 shadow-md border-2 border-white dark:border-[#141218]">
                                                <span className="material-symbols-outlined text-[14px] font-black">star</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>{u.displayName}</Typography>
                                        <Typography variant="body2" sx={{ fontStyle: 'italic', fontWeight: 600, color: 'text.secondary' }}>{u.bio || 'Interests seeker'}</Typography>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {u.interests?.slice(0, 5).map((int, i) => (
                                            <span
                                                key={i}
                                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${isMatch && (typeof int === 'string' ? user.interests.some(mi => (typeof mi === 'string' ? mi.toLowerCase() : mi.name.toLowerCase()) === int.toLowerCase()) : true)
                                                    ? 'bg-primary/10 border-primary/20 text-primary'
                                                    : 'bg-[#f2e9e9] dark:bg-[#231f29] border-transparent text-[#915b55] dark:text-[#938F99]'
                                                    }`}
                                            >
                                                {typeof int === 'string' ? int : int.name}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 w-full mt-2">
                                        <button
                                            onClick={() => handleConnectClick(u)}
                                            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-3 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">share_location</span>
                                            Connect
                                        </button>
                                    </div>
                                </div>
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

    useEffect(() => {
        const handleMapConnect = (e) => {
            setActiveTab('map');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('select_map_user', { detail: e.detail }));
            }, 500);
        };
        window.addEventListener('map_connect_user', handleMapConnect);
        return () => window.removeEventListener('map_connect_user', handleMapConnect);
    }, []);

    return (
        <div className="flex flex-col h-full w-full relative transition-colors duration-300">
            {/* Tab Navigation Bar - Sticky */}
            <div className="bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl border-b border-[#be3627]/10 dark:border-white/5 px-6 sticky top-0 z-30 flex justify-center h-16 items-center">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-full p-1 border border-slate-200 dark:border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`px-8 py-2 rounded-full text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'map' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-[#5e413d] dark:text-[#CAC4D0] hover:text-[#1a100f] dark:hover:text-[#E6E1E5]'}`}
                    >
                        Map View
                    </button>
                    <button
                        onClick={() => setActiveTab('connect')}
                        className={`px-8 py-2 rounded-full text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'connect' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-[#5e413d] dark:text-[#CAC4D0] hover:text-[#1a100f] dark:hover:text-[#E6E1E5]'}`}
                    >
                        Connect
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative w-full">
                {activeTab === 'map' ? (
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
