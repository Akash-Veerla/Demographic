import React, { useState, useEffect, useCallback } from 'react';
import MapComponent from './Map';
import api from '../utils/api';
import { Box, Card, CardContent, Typography, Avatar, Chip, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { MessageSquare } from 'lucide-react';
import M3LoadingIndicator from './M3LoadingIndicator';

const ConnectView = () => {
    const [users, setUsers] = useState([]);
    const [matchedUsers, setMatchedUsers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [actionLoading, setActionLoading] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const { user, userLocation } = useAuth();

    // Fetch Global Users, Friend Requests, Friends
    const fetchAll = useCallback(async () => {
        try {
            const [usersRes, pendingRes, friendsRes] = await Promise.all([
                api.get('/api/users/global'),
                api.get('/api/friend-requests/pending'),
                api.get('/api/friends')
            ]);
            setUsers(usersRes.data);
            setPendingRequests(pendingRes.data);
            setFriends(friendsRes.data);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setInitialLoading(false);
        }
    }, []);

    // Fetch Matched Users (Nearby + Shared Interests) - uses stable userLocation
    const fetchMatches = useCallback(async () => {
        if (!userLocation) return;
        try {
            const res = await api.get('/api/users/nearby', { params: { lat: userLocation.lat, lng: userLocation.lng } });
            setMatchedUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch matched users", err);
        }
    }, [userLocation?.lat, userLocation?.lng]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    const checkInterestMatch = (u) => {
        return (u.sharedInterests?.length || 0) > 0;
    };

    const handleConnectClick = (targetUser) => {
        window.dispatchEvent(new CustomEvent('map_connect_user', { detail: targetUser }));
    };

    const handleSendRequest = async (toUserId) => {
        setActionLoading(toUserId);
        try {
            await api.post('/api/friend-request/send', { toUserId });
            await fetchAll();
            await fetchMatches();
        } catch (err) {
            console.error('Failed to send friend request', err);
        }
        setActionLoading(null);
    };

    const handleAcceptRequest = async (requestId) => {
        setActionLoading(requestId);
        try {
            await api.post('/api/friend-request/accept', { requestId });
            await fetchAll();
            await fetchMatches();
        } catch (err) {
            console.error('Failed to accept request', err);
        }
        setActionLoading(null);
    };

    const handleRejectRequest = async (requestId) => {
        setActionLoading(requestId);
        try {
            await api.post('/api/friend-request/reject', { requestId });
            await fetchAll();
        } catch (err) {
            console.error('Failed to reject request', err);
        }
        setActionLoading(null);
    };

    const handleRemoveFriend = async (friendId) => {
        setActionLoading(friendId);
        try {
            await api.post('/api/friends/remove', { friendId });
            await fetchAll();
            await fetchMatches();
        } catch (err) {
            console.error('Failed to remove friend', err);
        }
        setActionLoading(null);
    };

    // User Item Renderer (Reusable) — squircle design
    const renderUserCard = (u) => {
        const isMatch = checkInterestMatch(u) || u.matchScore > 0;
        const isFriend = u.isFriend;
        return (
            <div key={u._id} className={`bg-white dark:bg-[#141218] rounded-sq-2xl p-6 shadow-xl border transition-transform hover:-translate-y-1 duration-300 ${isFriend ? 'border-primary/30 dark:border-[#D0BCFF]/30' : 'border-white/20 dark:border-white/5'}`}>
                <div className="flex flex-col items-center text-center gap-5">
                    <div className="relative">
                        <Avatar
                            src={u.profilePhoto}
                            sx={{
                                width: 90, height: 90,
                                borderRadius: '24px',
                                border: isFriend ? '4px solid var(--color-primary)' : isMatch ? '4px solid #22c55e' : '4px solid transparent',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                            }}
                            variant="rounded"
                        />
                        {isFriend && (
                            <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-sq-sm border-3 border-white dark:border-[#141218] ${u.isOnline ? 'bg-primary dark:bg-[#D0BCFF]' : 'bg-gray-400'}`} />
                        )}
                        {!isFriend && isMatch && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-sq-sm p-1 shadow-md border-2 border-white dark:border-[#141218]">
                                <span className="material-symbols-outlined text-[14px] font-black">star</span>
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>{u.displayName}</Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', fontWeight: 600, color: 'text.secondary' }}>{u.bio || 'Interests seeker'}</Typography>
                        {isFriend ? (
                            <span className={`inline-block text-[10px] font-black px-3 py-1 rounded-sq-md uppercase tracking-wider ${u.isOnline ? 'text-primary bg-primary/10 dark:text-[#D0BCFF] dark:bg-[#D0BCFF]/10' : 'text-gray-500 bg-gray-100 dark:bg-white/10'}`}>
                                {u.isOnline ? '● Online' : '○ Offline'} · ★ Friend
                            </span>
                        ) : isMatch ? (
                            <span className="inline-block text-[10px] font-black text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-sq-md uppercase tracking-wider">
                                ★ {u.matchScore} shared interest{u.matchScore !== 1 ? 's' : ''}
                            </span>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {u.interests?.slice(0, 5).map((int, i) => {
                            const intStr = typeof int === 'string' ? int : int.name;
                            const isShared = u.sharedInterests?.some(si => si.toLowerCase() === intStr.toLowerCase());
                            return (
                                <span
                                    key={i}
                                    className={`px-3 py-1 rounded-sq-md text-[10px] font-black uppercase tracking-widest border transition-colors ${isShared
                                        ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                                        : 'bg-[#f2e9e9] dark:bg-[#231f29] border-transparent text-[#915b55] dark:text-[#938F99]'
                                        }`}
                                >
                                    {isShared && '★ '}{intStr}
                                </span>
                            );
                        })}
                    </div>

                    <div className="flex gap-2 w-full mt-2">
                        {isFriend ? (
                            <div className="w-full bg-primary/10 dark:bg-[#D0BCFF]/10 text-primary dark:text-[#D0BCFF] font-bold h-10 rounded-sq-lg flex items-center justify-center gap-2 text-sm">
                                <span className="material-symbols-outlined text-lg">group</span>
                                Friends
                            </div>
                        ) : u.friendRequestSent ? (
                            <button disabled className="w-full bg-gray-100 dark:bg-white/10 text-gray-500 font-bold h-10 rounded-sq-lg flex items-center justify-center gap-2 text-sm cursor-not-allowed">
                                <span className="material-symbols-outlined text-lg">schedule_send</span>
                                Request Sent
                            </button>
                        ) : u.friendRequestReceived ? (
                            <button
                                onClick={async () => {
                                    const match = pendingRequests.find(r => (r.from?._id || r.from) === u._id);
                                    if (match) await handleAcceptRequest(match._id);
                                }}
                                disabled={actionLoading === u._id}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-10 rounded-sq-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-lg">person_add</span>
                                Accept Request
                            </button>
                        ) : (
                            <button
                                onClick={() => handleSendRequest(u._id)}
                                disabled={actionLoading === u._id}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-10 rounded-sq-lg shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-lg">{isMatch ? 'person_add' : 'share_location'}</span>
                                {isMatch ? 'Add Friend' : 'Connect'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Filter global users, sort by matchScore descending
    const matchedIds = new Set(matchedUsers.map(u => u._id));
    const discoverUsers = users
        .filter(u => u._id !== user?._id && !matchedIds.has(u._id))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, 50);

    if (initialLoading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center gap-4 py-32 animate-fade-in">
                <M3LoadingIndicator size={56} />
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Loading people...</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full p-4 space-y-8 animate-fade-in relative z-10 pb-24">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Friend Requests */}
                    <div className="bg-white dark:bg-[#141218] rounded-sq-2xl p-8 shadow-xl border border-white/20 dark:border-white/5 min-h-[320px] flex flex-col group">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-sq-lg text-primary transition-transform group-hover:scale-110">
                                    <span className="material-symbols-outlined text-2xl font-bold">person_add</span>
                                </div>
                                <h2 className="text-xl font-black text-[#1a100f] dark:text-white tracking-tight">Friend Requests</h2>
                            </div>
                            <span className="text-xs font-black bg-primary/10 text-primary px-4 py-1.5 rounded-sq-md uppercase tracking-wider">{pendingRequests.length}</span>
                        </div>
                        {pendingRequests.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-sq-xl bg-secondary/5 dark:bg-white/5">
                                <div className="w-20 h-20 bg-[#f2e9e9] dark:bg-[#231f29] rounded-sq-xl flex items-center justify-center mb-4 text-[#915b55] dark:text-[#938F99] shadow-inner">
                                    <span className="material-symbols-outlined text-3xl">inbox</span>
                                </div>
                                <p className="text-[#5e413d] dark:text-[#CAC4D0] font-bold">Inbox is empty</p>
                                <p className="text-xs text-[#915b55] dark:text-[#938F99] mt-1 font-medium italic">New requests will appear here</p>
                            </div>
                        ) : (
                            <div className="flex-1 space-y-3 overflow-y-auto max-h-[280px] custom-scrollbar">
                                {pendingRequests.map(req => (
                                    <div key={req._id} className="flex items-center gap-3 p-3 rounded-sq-xl bg-secondary/5 dark:bg-white/5 border border-white/10 dark:border-white/5">
                                        <Avatar src={req.from?.profilePhoto} sx={{ width: 48, height: 48, borderRadius: '16px' }} variant="rounded" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#1a100f] dark:text-white truncate">{req.from?.displayName}</p>
                                            <p className="text-xs text-gray-500 truncate">{req.from?.bio || 'Wants to connect'}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => handleAcceptRequest(req._id)}
                                                disabled={actionLoading === req._id}
                                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-sq-md text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(req._id)}
                                                disabled={actionLoading === req._id}
                                                className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-sq-md text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* My Connections (Friends List) */}
                    <div className="bg-white dark:bg-[#141218] rounded-sq-2xl p-8 shadow-xl border border-white/20 dark:border-white/5 min-h-[320px] flex flex-col group">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-sq-lg text-primary transition-transform group-hover:scale-110">
                                    <span className="material-symbols-outlined text-2xl font-bold">group</span>
                                </div>
                                <h2 className="text-xl font-black text-[#1a100f] dark:text-white tracking-tight">My Connections</h2>
                            </div>
                            <span className="text-xs font-black bg-primary/10 text-primary px-4 py-1.5 rounded-sq-md uppercase tracking-wider">{friends.length}</span>
                        </div>
                        {friends.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-sq-xl bg-secondary/5 dark:bg-white/5">
                                <div className="w-20 h-20 bg-[#f2e9e9] dark:bg-[#231f29] rounded-sq-xl flex items-center justify-center mb-4 text-[#915b55] dark:text-[#938F99] shadow-inner">
                                    <span className="material-symbols-outlined text-3xl">diversity_3</span>
                                </div>
                                <p className="text-[#5e413d] dark:text-[#CAC4D0] font-bold">No connections yet</p>
                                <p className="text-xs text-[#915b55] dark:text-[#938F99] mt-1 font-medium italic">Expand your map to find people</p>
                            </div>
                        ) : (
                            <div className="flex-1 space-y-3 overflow-y-auto max-h-[280px] custom-scrollbar">
                                {friends.map(friend => (
                                    <div key={friend._id} className="flex items-center gap-3 p-3 rounded-sq-xl bg-secondary/5 dark:bg-white/5 border border-white/10 dark:border-white/5">
                                        <div className="relative">
                                            <Avatar src={friend.profilePhoto} sx={{ width: 48, height: 48, borderRadius: '16px', border: friend.isOnline ? '3px solid' : 'none', borderColor: 'var(--color-primary)' }} variant="rounded" />
                                            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-sq-xs border-2 border-white dark:border-[#141218] ${friend.isOnline ? 'bg-primary dark:bg-[#D0BCFF]' : 'bg-gray-400'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#1a100f] dark:text-white truncate">{friend.displayName}</p>
                                            <p className={`text-xs font-bold ${friend.isOnline ? 'text-primary dark:text-[#D0BCFF]' : 'text-gray-400'}`}>
                                                {friend.isOnline ? '● Online' : '○ Offline'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => handleConnectClick(friend)}
                                                className="p-2 bg-primary/10 text-primary rounded-sq-md hover:bg-primary/20 transition-all active:scale-95"
                                                title="View on map"
                                            >
                                                <span className="material-symbols-outlined text-lg">share_location</span>
                                            </button>
                                            <button
                                                onClick={() => handleRemoveFriend(friend._id)}
                                                disabled={actionLoading === friend._id}
                                                className="p-2 bg-gray-100 dark:bg-white/10 text-gray-500 rounded-sq-md hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all active:scale-95 disabled:opacity-50"
                                                title="Remove friend"
                                            >
                                                <span className="material-symbols-outlined text-lg">person_remove</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 1. Matched Interests Section */}
                <div className="pt-2">
                    <div className="flex items-center gap-4 mb-6 ml-2">
                        <div className="w-10 h-10 bg-green-500 rounded-sq-lg flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                            <span className="material-symbols-outlined text-xl font-bold">favorite</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#1a100f] dark:text-white tracking-tight leading-none">Matched Interests</h2>
                            <p className="text-xs font-bold text-green-500 uppercase tracking-widest mt-1">People with shared interests nearby (20km)</p>
                        </div>
                    </div>
                    {matchedUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {matchedUsers.map(u => renderUserCard(u))}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-white/50 dark:bg-[#141218]/50 rounded-sq-2xl border border-dashed border-gray-300 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400 font-bold">No matches nearby yet. Try adding more interests!</p>
                        </div>
                    )}
                </div>

                {/* 2. Discover People Section */}
                <div className="pt-4">
                    <div className="flex items-center gap-4 mb-6 ml-2">
                        <div className="w-10 h-10 bg-primary rounded-sq-lg flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <span className="material-symbols-outlined text-xl font-bold">explore</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#1a100f] dark:text-white tracking-tight leading-none">Discover People</h2>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Recommended for you · Sorted by match</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {discoverUsers.map(u => renderUserCard(u))}
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
            {/* Tab Navigation Bar - Sticky, squircle buttons */}
            <div className="bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl border-b border-[#be3627]/10 dark:border-white/5 px-6 sticky top-0 z-30 flex justify-center h-14 items-center">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-sq-xl p-1 border border-slate-200 dark:border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`px-8 py-2 rounded-sq-lg text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'map' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-[#5e413d] dark:text-[#CAC4D0] hover:text-[#1a100f] dark:hover:text-[#E6E1E5]'}`}
                    >
                        Map View
                    </button>
                    <button
                        onClick={() => setActiveTab('connect')}
                        className={`px-8 py-2 rounded-sq-lg text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'connect' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-[#5e413d] dark:text-[#CAC4D0] hover:text-[#1a100f] dark:hover:text-[#E6E1E5]'}`}
                    >
                        Connect
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative w-full">
                {activeTab === 'map' ? (
                    <div className="w-full relative overflow-hidden shadow-inner" style={{ height: 'calc(100vh - 7rem)' }}>
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
