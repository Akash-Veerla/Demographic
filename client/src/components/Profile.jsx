import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Paper, Typography, Avatar, Container, Chip, Button, Divider, TextField } from '@mui/material';
import { Edit, Mail, MapPin } from 'lucide-react';
import api from '../utils/api';

const Profile = () => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ displayName: '', bio: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                bio: user.bio || ''
            });
        }
    }, [user]);

    const handleSave = async () => {
        try {
            // We need a way to update Redux. 
            // For now, let's call API then refetch user or manually update
            const { data } = await api.post('/api/user/profile', formData);
            dispatch({ type: 'auth/updateInterests/fulfilled', payload: data }); // Re-use existing reducer action that updates user
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile", err);
        }
    };

    if (!user) return null;

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper
                elevation={10}
                sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 3, // ~12px (matches theme)
                    background: 'rgba(30, 41, 59, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white'
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    <Box sx={{
                        p: 0.5,
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #38bdf8, #818cf8)',
                        mb: 2
                    }}>
                        <Avatar
                            src={user.profilePhoto}
                            sx={{ width: 100, height: 100, border: '4px solid #1e293b', fontSize: '2.5rem', bgcolor: '#334155' }}
                        >
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                        </Avatar>
                    </Box>

                    {isEditing ? (
                        <TextField
                            fullWidth
                            variant="outlined"
                            label="Display Name"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            sx={{ mb: 2, '& input': { color: 'white' } }}
                        />
                    ) : (
                        <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>
                            {user.displayName}
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'rgba(255,255,255,0.6)' }}>
                        <Mail size={16} />
                        <Typography variant="body2">
                            {user.email}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />

                <Box sx={{ textAlign: 'left', mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ color: '#38bdf8', mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Bio</Typography>

                    {isEditing ? (
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            sx={{
                                bgcolor: 'rgba(0,0,0,0.2)',
                                '& textarea': { color: 'white' }
                            }}
                        />
                    ) : (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                bgcolor: 'rgba(0,0,0,0.2)',
                                borderRadius: 2,
                                minHeight: '60px',
                                color: 'rgba(255,255,255,0.9)'
                            }}
                        >
                            <Typography variant="body1">
                                {user.bio || "No bio yet. Tell us about yourself!"}
                            </Typography>
                        </Paper>
                    )}
                </Box>

                <Box sx={{ textAlign: 'left', mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ color: '#38bdf8', mb: 2, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Interests</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {user.interests && user.interests.length > 0 ? (
                            user.interests.map((int, index) => (
                                <Chip
                                    key={index}
                                    label={typeof int === 'string' ? int : int.name}
                                    sx={{
                                        color: 'white',
                                        bgcolor: 'rgba(56, 189, 248, 0.1)',
                                        border: '1px solid rgba(56, 189, 248, 0.3)',
                                        borderRadius: '6px' // Sharper
                                    }}
                                />
                            ))
                        ) : (
                            <Typography variant="body2" color="rgba(255,255,255,0.5)">No interests selected.</Typography>
                        )}
                    </Box>
                </Box>

                {isEditing ? (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => setIsEditing(false)}
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleSave}
                            sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#7dd3fc' } }}
                        >
                            Save Changes
                        </Button>
                    </Box>
                ) : (
                    <Button
                        variant="contained"
                        startIcon={<Edit size={18} />}
                        fullWidth
                        onClick={() => setIsEditing(true)}
                        sx={{
                            bgcolor: '#38bdf8',
                            color: '#0f172a',
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: '#7dd3fc' }
                        }}
                    >
                        Edit Profile
                    </Button>
                )}
            </Paper>
        </Container>
    );
};

export default Profile;
