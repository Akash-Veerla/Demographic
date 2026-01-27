import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Box, Paper, InputBase, IconButton, List, ListItem, ListItemText, Divider, Typography, Button, Avatar, Slider } from '@mui/material';
import { Search, Crosshair, MessageSquare } from 'lucide-react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import ChatOverlay from './ChatOverlay';
import api from '../utils/api';

const MapComponent = () => {
    const mapRef = useRef();
    const [map, setMap] = useState(null);
    const [userSource] = useState(new VectorSource());
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    // Dynamic Radius State
    const [radius, setRadius] = useState(10); // Default 10km

    const { user } = useSelector(state => state.auth);
    const socketRef = useRef(null);
    const [socketReady, setSocketReady] = useState(false);

    // Popover State
    const [selectedUser, setSelectedUser] = useState(null);
    // Chat State
    const [chatTarget, setChatTarget] = useState(null);

    // Fetch Users based on dynamic radius
    const fetchNearbyUsers = useCallback(async (centerLat, centerLng) => {
        if (!centerLat || !centerLng) return;
        try {
            const res = await api.get('/api/users/nearby', {
                params: {
                    lat: centerLat,
                    lng: centerLng,
                    radius: radius,
                    interests: 'all' // or pass user.interests
                }
            });
            const users = res.data;
            userSource.clear();
            users.forEach(u => {
                if (!u.location || !u.location.coordinates) return;
                const [lng, lat] = u.location.coordinates;

                const feature = new Feature({
                    geometry: new Point(fromLonLat([lng, lat])),
                    type: 'user',
                    data: u
                });

                // Style for User Pin
                feature.setStyle(new Style({
                    image: new Circle({
                        radius: 8,
                        fill: new Fill({ color: '#1976d2' }),
                        stroke: new Stroke({ color: 'white', width: 2 })
                    }),
                    text: new Text({
                        text: u.displayName,
                        offsetY: -15,
                        font: '12px Roboto, sans-serif',
                        fill: new Fill({ color: '#333' }),
                        backgroundFill: new Fill({ color: 'rgba(255,255,255,0.8)' }),
                        padding: [2, 2, 2, 2]
                    })
                }));
                userSource.addFeature(feature);
            });

        } catch (err) {
            console.error("Failed to fetch nearby users:", err);
        }
    }, [radius, userSource]);

    // Initial Map Setup
    useEffect(() => {
        // Default Center (Vijayawada/AP)
        const initialCenter = fromLonLat([80.6480, 16.5062]);

        const initialMap = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM() }),
                new VectorLayer({ source: userSource, zIndex: 10 })
            ],
            view: new View({
                center: initialCenter,
                zoom: 9
            })
        });

        setMap(initialMap);

        // Click Handler for Pins
        initialMap.on('click', (e) => {
            const feature = initialMap.forEachFeatureAtPixel(e.pixel, (f) => f);
            if (feature && feature.get('type') === 'user') {
                setSelectedUser(feature.get('data'));
            } else {
                setSelectedUser(null);
            }
        });

        // Listen for map move end to re-fetch users? 
        // Or just fetch based on current user location?
        // Let's fetch based on map center for exploration
        initialMap.on('moveend', () => {
            const center = toLonLat(initialMap.getView().getCenter());
            fetchNearbyUsers(center[1], center[0]);
        });

        // Initial fetch if we have user location
        if (user && user.location && user.location.coordinates) {
            const [lng, lat] = user.location.coordinates;
            initialMap.getView().animate({ center: fromLonLat([lng, lat]), zoom: 11 });
            fetchNearbyUsers(lat, lng);
        }

        return () => initialMap.setTarget(null);
    }, [userSource, fetchNearbyUsers, user]); // Re-run if user/fetchNearbyUsers changes

    // Socket for Chat
    useEffect(() => {
        const apiUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'; // Make sure port matches
        socketRef.current = io(apiUrl, { withCredentials: true });
        setSocketReady(true);

        if (user) {
            socketRef.current.emit('register_user', user._id || user.id);
        }

        socketRef.current.on('chat_request', ({ from, fromName, roomId }) => {
            setChatTarget({
                _id: from,
                displayName: fromName || 'User',
                roomId: roomId
            });
            socketRef.current.emit('accept_chat', { roomId });
        });

        return () => socketRef.current.disconnect();
    }, [user]);

    // Search Logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 2) {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
                    const data = await res.json();
                    setSuggestions(data);
                } catch (err) {
                    console.error(err);
                }
            } else {
                setSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSelectLocation = (place) => {
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        const coord = fromLonLat([lon, lat]);
        map.getView().animate({ center: coord, zoom: 12 });
        setSuggestions([]);
        setSearchQuery(place.display_name.split(',')[0]);
        // Trigger fetch
        fetchNearbyUsers(lat, lon);
    };

    const handleStartChat = () => {
        if (selectedUser) {
            setChatTarget(selectedUser);
            setSelectedUser(null);
        }
    };

    return (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Search Bar */}
            <Box sx={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100, width: '90%', maxWidth: 400 }}>
                <Paper component="form" sx={{ p: '2px 4px', display: 'flex', alignItems: 'center' }} onSubmit={(e) => e.preventDefault()}>
                    <InputBase sx={{ ml: 1, flex: 1 }} placeholder="Search Location" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <IconButton type="button" sx={{ p: '10px' }}> <Search /> </IconButton>
                </Paper>
                {suggestions.length > 0 && (
                    <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                        <List dense>
                            {suggestions.map((place) => (
                                <React.Fragment key={place.place_id}>
                                    <ListItem button onClick={() => handleSelectLocation(place)}>
                                        <ListItemText primary={place.display_name} />
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                )}
            </Box>

            {/* Radius Slider Control */}
            <Paper sx={{
                position: 'absolute',
                bottom: 30,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                width: '80%',
                maxWidth: 400,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    Discovery Radius: {radius} km
                </Typography>
                <Slider
                    value={radius}
                    onChange={(e, newVal) => setRadius(newVal)}
                    onChangeCommitted={(e, newVal) => {
                        // Re-fetch when slider stops moving
                        const center = toLonLat(map.getView().getCenter());
                        fetchNearbyUsers(center[1], center[0]);
                    }}
                    min={1}
                    max={10}
                    step={1}
                    valueLabelDisplay="auto"
                    marks={[
                        { value: 1, label: '1km' },
                        { value: 5, label: '5km' },
                        { value: 10, label: '10km' },
                    ]}
                />
            </Paper>

            <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>

            {/* User Popover */}
            {selectedUser && (
                <Paper sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 200, p: 3, minWidth: 300, textAlign: 'center', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Avatar src={selectedUser.profilePhoto} sx={{ width: 64, height: 64 }} />
                        <Typography variant="h5">{selectedUser.displayName}</Typography>
                        {selectedUser.bio && <Typography variant="body2" color="text.secondary">{selectedUser.bio}</Typography>}
                    </Box>
                    <Box sx={{ mt: 1, mb: 3 }}>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>Interests</Typography>
                        {selectedUser.interests && selectedUser.interests.map((int, i) => (
                            <Typography key={i} variant="caption" sx={{ display: 'inline-block', bgcolor: '#e0f7fa', borderRadius: 1, px: 1, mx: 0.5, my: 0.2 }}>
                                {int.name || int}
                            </Typography>
                        ))}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                        <Button variant="contained" startIcon={<MessageSquare size={16} />} onClick={handleStartChat}>
                            Chat
                        </Button>
                        <Button variant="outlined" onClick={() => setSelectedUser(null)}>Close</Button>
                    </Box>
                </Paper>
            )}

            {/* Chat Overlay */}
            {chatTarget && socketReady && (
                <ChatOverlay
                    socket={socketRef.current}
                    user={user}
                    targetUser={chatTarget}
                    onClose={() => setChatTarget(null)}
                />
            )}

            <IconButton sx={{ position: 'absolute', bottom: 120, right: 20, bgcolor: 'white' }} onClick={() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                    map.getView().animate({ center: fromLonLat([pos.coords.longitude, pos.coords.latitude]), zoom: 12 });
                    fetchNearbyUsers(pos.coords.latitude, pos.coords.longitude);
                });
            }}>
                <Crosshair color="#1976d2" />
            </IconButton>
        </Box>
    );
};

export default MapComponent;
