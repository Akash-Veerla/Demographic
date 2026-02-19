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
            width: 320,
            height: 480,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            borderRadius: '24px',
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.1)' : 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(24px)',
            border: '0.5px solid rgba(255,255,255,0.3)',
            animation: 'fadeInUp 0.3s ease-out'
        }}>
            {/* Header */}
            <Box sx={{
                p: 2,
                bgcolor: 'rgba(var(--primary-main-rgb), 0.2)',
                backdropFilter: 'blur(10px)',
                color: 'text.primary',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '0.5px solid rgba(255,255,255,0.1)'
            }}>
                <Typography variant="subtitle1" fontWeight="800" sx={{ letterSpacing: '-0.3px' }}>{targetUser.displayName || targetUser.name}</Typography>
                <IconButton size="small" onClick={onClose} sx={{ color: 'text.primary' }}>
                    <X size={18} />
                </IconButton>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'transparent' }}>
                {messages.length === 0 && (
                    <Typography variant="caption" color="textSecondary" align="center" display="block" sx={{ mt: 4, fontWeight: 'bold' }}>
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
                                bgcolor: isMe ? 'primary.main' : 'rgba(255,255,255,0.1)',
                                color: isMe ? 'white' : 'text.primary',
                                backdropFilter: isMe ? 'none' : 'blur(4px)',
                                borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                boxShadow: isMe ? '0 4px 12px rgba(var(--primary-main-rgb),0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
                                border: isMe ? 'none' : '0.5px solid rgba(255,255,255,0.2)'
                            }}>
                                {!isMe && <Typography variant="caption" display="block" sx={{ opacity: 0.8, mb: 0.5, fontWeight: 'black' }}>{msg.senderName}</Typography>}
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>{msg.text}</Typography>
                            </Paper>
                        </Box>
                    );
                })}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ p: 2, display: 'flex', gap: 1, bgcolor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            borderRadius: '16px',
                            '& fieldset': { border: '0.5px solid rgba(255,255,255,0.2)' },
                            '&:hover fieldset': { border: '0.5px solid rgba(255,255,255,0.4)' }
                        }
                    }}
                />
                <IconButton
                    color="primary"
                    onClick={handleSend}
                    disabled={!roomId}
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.05)' },
                        '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                        transition: 'all 0.2s'
                    }}
                >
                    <Send size={18} />
                </IconButton>
            </Box>
        </Paper>
    );
};

export default ChatOverlay;
