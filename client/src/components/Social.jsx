import React, { useState, useEffect, useCallback } from 'react';
import MapComponent from './Map';
import api from '../utils/api';
import { Box, Card, CardContent, Typography, Avatar, Chip, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { MessageSquare } from 'lucide-react';
import M3LoadingIndicator from './M3LoadingIndicator';
import M3Chip, { M3ChipSet } from './M3Chip';
import M3SegmentedButton from './M3SegmentedButton';

const ConnectView = () => {
    const [users, setUsers] = useState([]);
    const [matchedUsers, setMatchedUsers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [actionLoading, setActionLoading] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const { user, userLocation } = useAuth();

    // Fetch Global Users (Discover), Friend Requests, Friends
    const fetchAll = useCallback(async () => {
        try {
            // If location available, use discover endpoint (nearest 50), else fallback to global
            const userEndpoint = userLocation ? '/api/users/discover' : '/api/users/global';
            const params = userLocation ? { params: { lat: userLocation.lat, lng: userLocation.lng } } : {};

            const [usersRes, pendingRes, friendsRes] = await Promise.all([
                api.get(userEndpoint, params),
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
    }, [userLocation?.lat, userLocation?.lng]);

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
            await api.delete(`/api/friends/${friendId}`);
            await fetchAll();
            await fetchMatches();
        } catch (err) {
            console.error('Failed to remove friend', err);
        }
        setActionLoading(null);
    };

    // User Item Renderer (Reusable) — squircle design
    const renderUserCard = (u) => {
        const isMatch = checkInterestMatch(u);
        const isFriend = friends.some(f => f._id === u._id);

        // Sort interests: Shared first
        const sortedInterests = [...(u.interests || [])].sort((a, b) => {
            const aName = typeof a === 'string' ? a : a.name;
            const bName = typeof b === 'string' ? b : b.name;
            const aShared = u.sharedInterests?.some(si => si.toLowerCase() === aName.toLowerCase());
            const bShared = u.sharedInterests?.some(si => si.toLowerCase() === bName.toLowerCase());
            return (bShared ? 1 : 0) - (aShared ? 1 : 0);
        });

        return (
            <div key={u._id} className="bg-white dark:bg-white/5 dark:backdrop-blur-2xl rounded-sq-2xl overflow-hidden shadow-xl border-[0.5px] border-white/30 dark:border-white/10 group hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:border-white/60 transition-all duration-500 flex flex-col h-full ring-1 ring-black/5 hover:-translate-y-1">
                <div className="p-6 flex flex-col items-center text-center flex-1">
                    <div className="relative mb-4 shrink-0">
                        <Avatar
                            src={u.profilePhoto}
                            sx={{ width: 96, height: 96, borderRadius: '24px', fontSize: '2rem' }}
                            variant="rounded"
                        />
                        {isMatch && !isFriend && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1.5 rounded-sq-lg shadow-lg border-2 border-white dark:border-[#1f1b24]" title="Matched Interests">
                                <span className="material-symbols-outlined text-sm font-bold block">star</span>
                            </div>
                        )}
                        {isFriend && (
                            <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-md border-2 border-white dark:border-[#1f1b24] ${u.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} title={u.isOnline ? "Online" : "Offline"}></div>
                        )}
                    </div>

                    <h3 className="text-xl font-black text-[#1a100f] dark:text-white mb-1 line-clamp-1">{u.displayName}</h3>
                    <p className="text-sm font-medium text-[#915b55] dark:text-[#CAC4D0] line-clamp-2 min-h-[2.5em] mb-3">
                        {u.bio || "No bio yet"}
                    </p>

                    {/* MATCHED INTERESTS BADGE / TEXT */}
                    {isMatch ? (
                        <div className="bg-green-100/80 dark:bg-green-900/40 px-3 py-1.5 rounded-full mb-4 border border-green-200 dark:border-green-800 shrink-0 backdrop-blur-sm">
                            <p className="text-xs font-black text-green-800 dark:text-green-300 uppercase tracking-widest flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm font-bold">stars</span>
                                {u.sharedInterests?.length || 0} SHARED INTERESTS
                            </p>
                        </div>
                    ) : (
                        <div className="h-8 mb-4 shrink-0"></div>
                    )}

                    <M3ChipSet className="justify-center mb-4 min-h-[40px] flex-wrap">
                        {sortedInterests.slice(0, 4).map((int, i) => {
                            const intStr = typeof int === 'string' ? int : int.name;
                            const isShared = u.sharedInterests?.some(si => si.toLowerCase() === intStr.toLowerCase());
                            return (
                                <M3Chip
                                    key={i}
                                    label={isShared ? `★ ${intStr}` : intStr}
                                    type={isShared ? "suggestion" : "assist"}
                                    highlighted={isShared}
                                    className={`scale-90 ${isShared ? 'font-bold ring-2 ring-green-500/20' : ''}`}
                                />
                            );
                        })}
                        {(sortedInterests.length || 0) > 4 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold self-center">+{sortedInterests.length - 4}</span>
                        )}
                    </M3ChipSet>

                    <div className="w-full mt-auto pt-2">
                        {isFriend ? (
                            <div className="w-full bg-primary/20 dark:bg-[#D0BCFF]/20 text-primary dark:text-[#D0BCFF] font-bold h-10 rounded-sq-lg flex items-center justify-center gap-2 text-sm backdrop-blur-md">
                                <span className="material-symbols-outlined text-lg">group</span>
                                Friends
                            </div>
                        ) : u.friendRequestSent ? (
                            <button disabled className="w-full bg-gray-100/50 dark:bg-white/10 text-gray-500 font-bold h-10 rounded-sq-lg flex items-center justify-center gap-2 text-sm cursor-not-allowed backdrop-blur-md">
                                <span className="material-symbols-outlined text-lg">schedule_send</span>
                                Request Sent
                            </button>
                        ) : u.friendRequestReceived ? (
                            <button
                                onClick={() => handleAcceptRequest(u._id)}
                                disabled={actionLoading === u._id}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-10 rounded-sq-lg shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50 transition-all active:scale-95 shimmer"
                            >
                                <span className="material-symbols-outlined text-lg">person_add</span>
                                Accept
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
                    <div className="bg-white dark:bg-white/5 dark:backdrop-blur-2xl rounded-sq-2xl p-8 shadow-xl border-[0.5px] border-white/30 dark:border-white/10 min-h-[320px] flex flex-col group ring-1 ring-black/5 hover:ring-white/20 hover:shadow-2xl transition-all duration-300">
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
                    <div className="bg-white dark:bg-white/5 dark:backdrop-blur-2xl rounded-sq-2xl p-8 shadow-xl border-[0.5px] border-white/30 dark:border-white/10 min-h-[320px] flex flex-col group ring-1 ring-black/5 hover:ring-white/20 hover:shadow-2xl transition-all duration-300">
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
                    <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl rounded-sq-xl p-4 shadow-sm border border-black/5 dark:border-white/5 mb-6 mx-2">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-500 rounded-sq-lg flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                                <span className="material-symbols-outlined text-xl font-bold">favorite</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-[#1a100f] dark:text-white tracking-tight leading-none">Matched Interests</h2>
                                <p className="text-xs font-bold text-green-500 uppercase tracking-widest mt-1">People with shared interests nearby (20km)</p>
                            </div>
                        </div>
                    </div>
                    {matchedUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {matchedUsers.map(u => renderUserCard(u))}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-white dark:bg-white/5 dark:backdrop-blur-2xl rounded-sq-2xl border-[0.5px] border-white/30 dark:border-white/10 shadow-xl">
                            <p className="text-[#5e413d] dark:text-[#CAC4D0] font-bold">No matches nearby yet. Try adding more interests!</p>
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
            {/* Tab Navigation Bar — Glass Segmented Container */}
            <div className="bg-transparent px-6 sticky top-0 z-30 flex justify-center h-16 items-center">
                <M3SegmentedButton
                    segments={[
                        { value: 'map', label: 'Map View', icon: 'map' },
                        { value: 'connect', label: 'Connect', icon: 'group' },
                    ]}
                    value={activeTab}
                    onChange={setActiveTab}
                />
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
