import React from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Globe } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#f0f2f5',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
            <Container maxWidth="md">
                <Paper elevation={3} sx={{ p: 5, borderRadius: 4, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                        <MapPin size={48} color="#1976d2" />
                        <Users size={48} color="#1976d2" />
                    </Box>

                    <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                        KON-NECT
                    </Typography>

                    <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4 }}>
                        Discover people nearby, connect based on shared interests, and expand your social circle globally.
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 6 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Globe size={32} color="#555" />
                            <Typography variant="subtitle1" sx={{ mt: 1 }}>Global Reach</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <MapPin size={32} color="#555" />
                            <Typography variant="subtitle1" sx={{ mt: 1 }}>Dynamic Radius</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Users size={32} color="#555" />
                            <Typography variant="subtitle1" sx={{ mt: 1 }}>Interest Matching</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/login')}
                            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                        >
                            Login
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/register')}
                            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                        >
                            Register
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Landing;
