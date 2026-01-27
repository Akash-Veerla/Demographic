import React from 'react';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { Map as MapIcon, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="md" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
            <Paper
                elevation={10}
                sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 4,
                    maxWidth: 500,
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white'
                }}
            >
                <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '50%', bgcolor: 'rgba(56, 189, 248, 0.1)', mb: 3 }}>
                    <MessageCircle size={48} color="#38bdf8" />
                </Box>

                <Typography variant="h4" fontWeight="800" gutterBottom sx={{ color: 'white' }}>
                    Messages
                </Typography>
                <Typography variant="body1" paragraph sx={{ color: 'rgba(255,255,255,0.6)', mb: 4 }}>
                    Connect with people nearby! Select a user on the Map to start a conversation.
                </Typography>

                <Button
                    variant="contained"
                    size="large"
                    startIcon={<MapIcon />}
                    onClick={() => navigate('/')}
                    sx={{
                        bgcolor: '#38bdf8',
                        color: '#0f172a',
                        fontWeight: 'bold',
                        px: 4,
                        py: 1.5,
                        '&:hover': { bgcolor: '#7dd3fc' }
                    }}
                >
                    Find People on Map
                </Button>
            </Paper>
        </Container>
    );
};

export default Chat;
