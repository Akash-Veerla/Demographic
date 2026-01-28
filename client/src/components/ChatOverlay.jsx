import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, TextField, Button, IconButton, Divider, List, ListItem, ListItemText, useTheme } from '@mui/material';
import { X, Send } from 'lucide-react';

const ChatOverlay = ({ socket, user, targetUser, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [roomId, setRoomId] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket || !targetUser) return;

        // Initiate Chat (if starting fresh) OR set ID (if accepting)
        if (targetUser.roomId) {
            setRoomId(targetUser.roomId);
            // socket.emit('accept_chat', { roomId: targetUser.roomId }); // Already done in Map.jsx?
        } else {
            // targetUser is a MongoDB user object, likely has _id
            socket.emit('join_chat', { targetUserId: targetUser._id });
        }

        // Listeners
        const handleChatJoined = ({ roomId }) => {
            setRoomId(roomId);
        };

        const handleReceiveMessage = (data) => {
            setMessages(prev => [...prev, data]);
        };

        socket.on('chat_joined', handleChatJoined);
        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('chat_joined', handleChatJoined);
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket, targetUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (input.trim() && roomId) {
            socket.emit('send_message', {
                roomId,
                message: input,
                toName: targetUser.displayName
            });
            setInput('');
        }
    };

    const theme = useTheme(); // Import useTheme

    // ...

    return (
        <Paper sx={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 300,
            height: 400,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            boxShadow: 6,
            borderRadius: '24px', // M3 Large
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`
        }}>
            {/* Header */}
            <Box sx={{
                p: 2,
                bgcolor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Typography variant="subtitle1" fontWeight="600">{targetUser.displayName || targetUser.name}</Typography>
                <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
                    <X size={18} />
                </IconButton>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: theme.palette.background.default }}>
                {messages.length === 0 && (
                    <Typography variant="caption" color="textSecondary" align="center" display="block" sx={{ mt: 4 }}>
                        Start the conversation!
                    </Typography>
                )}
                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === user._id;
                    return (
                        <Box key={idx} sx={{
                            display: 'flex',
                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                            mb: 1.5
                        }}>
                            <Paper sx={{
                                p: '10px 16px',
                                maxWidth: '80%',
                                bgcolor: isMe ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
                                color: isMe ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                                borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                boxShadow: 0
                            }}>
                                {!isMe && <Typography variant="caption" display="block" sx={{ opacity: 0.7, mb: 0.5 }}>{msg.senderName}</Typography>}
                                <Typography variant="body2">{msg.text}</Typography>
                            </Paper>
                        </Box>
                    );
                })}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ p: 1, display: 'flex', gap: 1, bgcolor: 'white', borderTop: '1px solid #ddd' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <IconButton color="primary" onClick={handleSend} disabled={!roomId}>
                    <Send size={20} />
                </IconButton>
            </Box>
        </Paper>
    );
};

export default ChatOverlay;
