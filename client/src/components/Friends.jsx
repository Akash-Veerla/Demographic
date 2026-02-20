import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Avatar } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import M3LoadingIndicator from './M3LoadingIndicator';
import { useNavigate } from 'react-router-dom';

const Friends = () => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [actionLoading, setActionLoading] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchAll = useCallback(async () => {
        try {
            const [pendingRes, friendsRes, unreadRes] = await Promise.all([
                api.get('/api/friend-requests/pending'),
                api.get('/api/friends'),
                api.get('/api/messages/unread/count') // New API we just added
            ]);
            setPendingRequests(pendingRes.data);
            setFriends(friendsRes.data);
            setUnreadCounts(unreadRes.data || {});
        } catch (err) {
            console.error("Failed to fetch friends data:", err);
        } finally {
            setInitialLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
        // Set up polling for new messages count or rely on socket below
        const interval = setInterval(fetchAll, 10000); // Polling every 10s as a resilient fallback
        return () => clearInterval(interval);
    }, [fetchAll]);

    const handleAcceptRequest = async (requestId) => {
        setActionLoading(requestId);
        try {
            await api.post('/api/friend-request/accept', { requestId });
            await fetchAll();
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
        if (!window.confirm("Are you sure you want to unfriend?")) return;
        setActionLoading(friendId);
        try {
            await api.delete(`/api/friends/${friendId}`);
            await fetchAll();
        } catch (err) {
            console.error('Failed to remove friend', err);
        }
        setActionLoading(null);
    };

    const handleChatClick = (friend) => {
        // Room ID deterministic generation
        const roomId = [user._id, friend._id].sort().join('_');
        navigate(`/chat/${roomId}`, { state: { friend } });
    };

    if (initialLoading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center gap-4 py-32 animate-fade-in">
                <M3LoadingIndicator size={56} />
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Loading friends...</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full p-4 space-y-8 animate-fade-in relative z-10 pb-24">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* 1. Header Area */}
                <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl rounded-sq-xl p-4 shadow-sm border border-black/5 dark:border-white/5 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary rounded-sq-lg flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <span className="material-symbols-outlined text-xl font-bold">diversity_3</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#1a100f] dark:text-white tracking-tight leading-none">Friends Network</h2>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Manage Connections & Chat</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Friend Requests */}
                    <div className="bg-white dark:bg-white/5 dark:backdrop-blur-2xl rounded-sq-2xl p-8 shadow-xl border-[0.5px] border-white/30 dark:border-white/10 min-h-[320px] flex flex-col group ring-1 ring-black/5">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-sq-lg text-primary transition-transform">
                                    <span className="material-symbols-outlined text-2xl font-bold">inbox</span>
                                </div>
                                <h2 className="text-xl font-black text-[#1a100f] dark:text-white tracking-tight">Requests</h2>
                            </div>
                            <span className="text-xs font-black bg-primary/10 text-primary px-4 py-1.5 rounded-sq-md uppercase tracking-wider">{pendingRequests.length}</span>
                        </div>
                        {pendingRequests.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-sq-xl bg-secondary/5 dark:bg-white/5">
                                <p className="text-[#5e413d] dark:text-[#CAC4D0] font-bold">Inbox is empty</p>
                                <p className="text-xs text-[#915b55] dark:text-[#938F99] mt-1 font-medium italic">No new requests</p>
                            </div>
                        ) : (
                            <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] custom-scrollbar">
                                {pendingRequests.map(req => (
                                    <div key={req._id} className="flex items-center gap-3 p-3 rounded-sq-xl bg-secondary/5 dark:bg-white/5 border border-white/10 dark:border-white/5">
                                        <Avatar src={req.from?.profilePhoto} sx={{ width: 48, height: 48, borderRadius: '16px' }} variant="rounded" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#1a100f] dark:text-white truncate">{req.from?.displayName}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => handleAcceptRequest(req._id)}
                                                disabled={actionLoading === req._id}
                                                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-sq-md text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(req._id)}
                                                disabled={actionLoading === req._id}
                                                className="px-3 py-2 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-sq-md text-xs font-bold hover:bg-gray-300 dark:hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* My Connections (Friends List) with Chat Buttons */}
                    <div className="bg-white dark:bg-white/5 dark:backdrop-blur-2xl rounded-sq-2xl p-8 shadow-xl border-[0.5px] border-white/30 dark:border-white/10 min-h-[320px] flex flex-col group ring-1 ring-black/5">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-sq-lg text-primary transition-transform">
                                    <span className="material-symbols-outlined text-2xl font-bold">group</span>
                                </div>
                                <h2 className="text-xl font-black text-[#1a100f] dark:text-white tracking-tight">Connections</h2>
                            </div>
                            <span className="text-xs font-black bg-primary/10 text-primary px-4 py-1.5 rounded-sq-md uppercase tracking-wider">{friends.length}</span>
                        </div>

                        {friends.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-sq-xl bg-secondary/5 dark:bg-white/5">
                                <p className="text-[#5e413d] dark:text-[#CAC4D0] font-bold">No connections yet</p>
                                <p className="text-xs text-[#915b55] dark:text-[#938F99] mt-1 font-medium italic">Discover people on the map</p>
                            </div>
                        ) : (
                            <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] custom-scrollbar">
                                {friends.map(friend => {
                                    const unread = unreadCounts[friend._id] || 0;
                                    return (
                                        <div key={friend._id} className="flex items-center gap-3 p-3 rounded-sq-xl bg-secondary/5 dark:bg-white/5 border border-white/10 dark:border-white/5 relative group/item">
                                            <div className="relative">
                                                <Avatar src={friend.profilePhoto} sx={{ width: 48, height: 48, borderRadius: '16px', border: friend.isOnline ? '2px solid' : 'none', borderColor: 'var(--color-primary)' }} variant="rounded" />
                                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-sq-xs border-2 border-white dark:border-[#141218] ${friend.isOnline ? 'bg-primary dark:bg-[#D0BCFF]' : 'bg-gray-400'}`} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#1a100f] dark:text-white truncate">{friend.displayName}</p>
                                                <p className={`text-xs font-bold leading-tight ${unread > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                                                    {unread > 0 ? `${unread} new messages` : 'No new messages'}
                                                </p>
                                            </div>

                                            <div className="flex gap-2 shrink-0">
                                                {/* Start Persistent Chat */}
                                                <button
                                                    onClick={() => handleChatClick(friend)}
                                                    className="p-2.5 bg-primary hover:bg-primary/90 text-white rounded-sq-md transition-all active:scale-95 shadow-md flex items-center justify-center relative"
                                                    title="Chat"
                                                >
                                                    <span className="material-symbols-outlined text-sm font-bold">chat</span>
                                                    {unread > 0 && (
                                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                        </span>
                                                    )}
                                                </button>

                                                {/* Remove Friend */}
                                                <button
                                                    onClick={() => handleRemoveFriend(friend._id)}
                                                    disabled={actionLoading === friend._id}
                                                    className="p-2.5 bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sq-md transition-all active:scale-95"
                                                    title="Remove friend"
                                                >
                                                    <span className="material-symbols-outlined text-sm">person_remove</span>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Friends;
