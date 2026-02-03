import React from 'react';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { Map as MapIcon, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 4, md: 8 },
                    textAlign: 'center',
                    borderRadius: '28px',
                    maxWidth: 500,
                    width: '100%',
                    background: theme => theme.palette.mode === 'dark' ? 'rgba(20, 18, 24, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(190, 54, 39, 0.1)'}`,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
                }}
            >
                <Box sx={{
                    display: 'inline-flex',
                    p: 2.5,
                    borderRadius: '24px',
                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(208, 188, 255, 0.1)' : 'rgba(190, 54, 39, 0.1)',
                    mb: 4,
                    color: 'primary.main'
                }}>
                    <MessageCircle size={48} strokeWidth={2.5} />
                </Box>

                <Typography variant="h4" fontWeight="900" gutterBottom sx={{
                    fontFamily: 'Outfit, sans-serif',
                    color: theme => theme.palette.mode === 'dark' ? '#E6E1E5' : '#1a100f',
                    letterSpacing: '-0.02em'
                }}>
                    Messages
                </Typography>
                <Typography variant="body1" sx={{
                    color: theme => theme.palette.mode === 'dark' ? '#CAC4D0' : '#5e413d',
                    mb: 5,
                    lineHeight: 1.6,
                    fontWeight: 500
                }}>
                    Connect with people nearby! Select a user on the Map to start a conversation.
                </Typography>

                <Button
                    variant="contained"
                    size="large"
                    startIcon={<MapIcon />}
                    onClick={() => navigate('/')}
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        fontWeight: '900',
                        px: 5,
                        py: 2,
                        borderRadius: '20px',
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        boxShadow: '0 8px 25px rgba(190, 54, 39, 0.3)',
                        '&:hover': {
                            bgcolor: 'primary.main',
                            filter: 'brightness(1.1)',
                            transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                >
                    Find People on Map
                </Button>
            </Paper>
        </Container>
    );
};

export default Chat;
