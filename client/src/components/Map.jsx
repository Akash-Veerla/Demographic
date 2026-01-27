import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point, Circle as GeomCircle } from 'ol/geom';
import { Style, Circle as StyleCircle, Fill, Stroke, Text } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Box, Paper, InputBase, IconButton, List, ListItem, ListItemText, Divider, Typography, Button, Avatar, Slider, Snackbar, Alert, Switch, useTheme } from '@mui/material';
import { Search, Crosshair, MessageSquare, Globe, Palette } from 'lucide-react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import ChatOverlay from './ChatOverlay';
import api from '../utils/api';
import { ColorModeContext } from '../App';

const MapComponent = () => {
    const mapRef = useRef();
    const [map, setMap] = useState(null);
    const [userSource] = useState(new VectorSource());
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [radius, setRadius] = useState(10);
    const [showGlobalAlert, setShowGlobalAlert] = useState(false);

    // New State for Filters
    const [showGlobalUsers, setShowGlobalUsers] = useState(false);

    const { user } = useSelector(state => state.auth);
    const socketRef = useRef(null);
    const [socketReady, setSocketReady] = useState(false);

    // Theme & Context
    const theme = useTheme();
    const { toggleColorMode, setAccent, mode } = useContext(ColorModeContext);

    // Popover State
    const [selectedUser, setSelectedUser] = useState(null);
    // Chat State
    const [chatTarget, setChatTarget] = useState(null);

    // Helper to check interest match
    const checkInterestMatch = (userInterests, myInterests) => {
        if (!userInterests || !myInterests) return false;
        const set1 = new Set(myInterests.map(i => typeof i === 'string' ? i : i.name));
        return userInterests.some(i => set1.has(typeof i === 'string' ? i : i.name));
    };

    // My Location & Radius Source
    const [selfSource] = useState(new VectorSource());

    // Fetch Users based on dynamic radius
    const fetchNearbyUsers = useCallback(async (centerLat, centerLng, forceGlobal = false) => {
        if (!centerLat || !centerLng) return;
        try {
            let users = [];

            if (!forceGlobal) {
                const res = await api.get('/api/users/nearby', {
                    params: {
                        lat: centerLat,
                        lng: centerLng,
                        radius: radius,
                        interests: 'all' // We fetch all first, then style/filter client side for smoothness
                    }
                });
                users = res.data;
            }

            // Fallback to Global if no users found
            if (users.length === 0) {
                if (!forceGlobal) setShowGlobalAlert(true);
                const resGlobal = await api.get('/api/users/global');
                users = resGlobal.data;
            } else {
                setShowGlobalAlert(false);
            }

            userSource.clear();

            users.forEach(u => {
                if (!u.location || !u.location.coordinates) return;
                const [lng, lat] = u.location.coordinates;

                const feature = new Feature({
                    geometry: new Point(fromLonLat([lng, lat])),
                    type: 'user',
                    data: u
                });

                // Style Logic
                const isMatch = user && checkInterestMatch(u.interests, user.interests);

                // If "Show Compatible Only" is ON (showGlobalUsers === false) AND not a match, skip adding
                // EXCEPTION: Always show matched users. If toggled to Global, show everyone.
                if (!showGlobalUsers && !isMatch) return;

                // Online Status Logic (15 mins threshold)
                const isOnline = u.lastLogin && (new Date() - new Date(u.lastLogin)) < (15 * 60 * 1000);

                // Colors
                let color = theme.palette.text.disabled;
                let strokeColor = theme.palette.background.paper;

                if (isOnline) {
                    color = isMatch ? theme.palette.success.main : theme.palette.warning.main;
                } else {
                    // Offline users: Greyed out
                    color = theme.palette.grey[500];
                }

                feature.setStyle(new Style({
                    image: new StyleCircle({
                        radius: 8,
                        fill: new Fill({ color: color }),
                        stroke: new Stroke({ color: strokeColor, width: 2 })
                    }),
                    text: new Text({
                        text: u.displayName,
                        offsetY: -20,
                        font: 'bold 13px Inter, sans-serif',
                        fill: new Fill({ color: theme.palette.text.primary }),
                        stroke: new Stroke({ color: theme.palette.background.paper, width: 3 })
                    })
                }));
                userSource.addFeature(feature);
            });

        } catch (err) {
            console.error("Failed to fetch nearby users:", err);
        }
    }, [radius, userSource, user, showGlobalUsers, theme]);

    // Initial Map Setup (Run ONCE)
    useEffect(() => {
        const initialCenter = fromLonLat([80.6480, 16.5062]);

        const initialMap = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM(),
                    className: 'map-tile-layer'
                }),
                new VectorLayer({ source: userSource, zIndex: 10 }),
                new VectorLayer({ source: selfSource, zIndex: 5 })
            ],
            view: new View({
                center: initialCenter,
                zoom: 9
            })
        });

        setMap(initialMap);

        // Implicit Location Update
        if (navigator.geolocation && user) {
            navigator.geolocation.watchPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                // Emit location update
                if (socketRef.current && socketRef.current.connected) {
                    socketRef.current.emit('update_location', { lat: latitude, lng: longitude });
                }

                const userCoord = fromLonLat([longitude, latitude]);
                selfSource.clear();

                // 1. My Location Marker
                const selfFeature = new Feature({ geometry: new Point(userCoord) });
                selfFeature.setStyle(new Style({
                    image: new StyleCircle({
                        radius: 12,
                        fill: new Fill({ color: theme.palette.primary.main }),
                        stroke: new Stroke({ color: '#fff', width: 3 })
                    })
                }));
                selfSource.addFeature(selfFeature);

                // 2. Radius Circle - GREEN TRANSPARENT
                const scale = 1 / Math.cos(latitude * Math.PI / 180);
                const circleFeature = new Feature({
                    geometry: new GeomCircle(userCoord, (radius * 1000) * scale)
                });
                circleFeature.setStyle(new Style({
                    fill: new Fill({ color: 'rgba(34, 197, 94, 0.2)' }), // Green-ish transparent
                    stroke: new Stroke({ color: 'rgba(34, 197, 94, 0.6)', width: 1.5 })
                }));
                selfSource.addFeature(circleFeature);

            }, (err) => console.error("Location access error", err), {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000
            });

            // Initial Center
            navigator.geolocation.getCurrentPosition(pos => {
                const { latitude, longitude } = pos.coords;
                initialMap.getView().animate({ center: fromLonLat([longitude, latitude]), zoom: 11 });
                fetchNearbyUsers(latitude, longitude);
            });
        }

    }, []);

    // Update markers when radius or filters change
    useEffect(() => {
        if (!map) return;
        const center = toLonLat(map.getView().getCenter());
        fetchNearbyUsers(center[1], center[0]);
    }, [radius, showGlobalUsers, theme, fetchNearbyUsers]);

    // Map Event Listeners
    useEffect(() => {
        if (!map) return;

        const clickHandler = (e) => {
            const feature = map.forEachFeatureAtPixel(e.pixel, (f) => f);
            if (feature && feature.get('type') === 'user') {
                setSelectedUser(feature.get('data'));
            } else {
                setSelectedUser(null);
            }
        };

        const moveHandler = () => {
            const center = toLonLat(map.getView().getCenter());
            fetchNearbyUsers(center[1], center[0]);
        };

        map.on('click', clickHandler);
        map.on('moveend', moveHandler);

        return () => {
            map.un('click', clickHandler);
            map.un('moveend', moveHandler);
        };
    }, [map, fetchNearbyUsers]);

    // Socket
    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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

    const handleSelectLocation = (place) => {
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        const coord = fromLonLat([lon, lat]);
        map.getView().animate({ center: coord, zoom: 12 });
        setSuggestions([]);
        setSearchQuery(place.display_name.split(',')[0]);
        fetchNearbyUsers(lat, lon);
    };

    const handleStartChat = () => {
        if (selectedUser) {
            setChatTarget(selectedUser);
            setSelectedUser(null);
        }
    };

    const colors = ['red', 'green', 'blue', 'violet', 'indigo', 'orange', 'yellow'];

    return (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>

            {/* Theme & Filter Controls (Top Right) */}
            <Paper sx={{
                position: 'absolute', top: 20, right: 20, zIndex: 100, p: 2,
                display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end',
                borderRadius: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" fontWeight="bold">Show All Users</Typography>
                    <Switch
                        checked={showGlobalUsers}
                        onChange={(e) => setShowGlobalUsers(e.target.checked)}
                        size="small"
                    />
                </Box>
                <Divider sx={{ width: '100%' }} />
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {colors.map(c => (
                        <Box
                            key={c}
                            onClick={() => setAccent(c)}
                            sx={{
                                width: 20, height: 20, borderRadius: '50%', cursor: 'pointer',
                                bgcolor: c === 'white' ? '#fff' : (c === 'yellow' ? '#eab308' : c),
                                border: '1px solid rgba(0,0,0,0.1)',
                                transform: 'scale(1)',
                                transition: 'transform 0.1s',
                                '&:hover': { transform: 'scale(1.2)' },
                                boxShadow: theme.palette.mode === 'dark' ? '0 0 4px rgba(255,255,255,0.2)' : 'none'
                            }}
                        />
                    ))}
                </Box>
                <Button size="small" onClick={toggleColorMode} startIcon={<Palette size={14} />} sx={{ width: '100%' }}>
                    {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Button>
            </Paper>

            {/* Search Bar - Theme Aware */}
            <Box sx={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100, width: '90%', maxWidth: 400 }}>
                <Paper component="form" sx={{
                    p: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: 3
                }} onSubmit={(e) => e.preventDefault()}>
                    <InputBase
                        sx={{ ml: 1, flex: 1 }}
                        placeholder="Search Location"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <IconButton type="button" sx={{ p: '10px', color: 'primary.main' }}> <Search /> </IconButton>
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

            {/* Radius Slider Control - Theme Aware */}
            <Paper sx={{
                position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
                width: '80%', maxWidth: 400, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center',
                borderRadius: 4
            }}>
                <Typography variant="body2" color="primary" fontWeight="bold">
                    Discovery Radius: {radius} km
                </Typography>
                <Slider
                    value={radius}
                    onChange={(e, newVal) => setRadius(newVal)}
                    min={1} max={10} step={1}
                    valueLabelDisplay="auto"
                />
            </Paper>

            {/* Global Fallback Alert */}
            <Snackbar open={showGlobalAlert} autoHideDuration={6000} onClose={() => setShowGlobalAlert(false)}>
                <Alert severity="info" variant="filled">
                    No matching users nearby. Showing global community.
                </Alert>
            </Snackbar>

            {/* Map Container - Dynamic Dark Mode Filter */}
            <div ref={mapRef} style={{ width: '100%', height: '100%', filter: mode === 'dark' ? 'grayscale(100%) invert(100%) contrast(90%) brightness(120%) hue-rotate(180deg)' : 'none' }}></div>

            {/* User Popover - Theme Aware */}
            {selectedUser && (
                <Paper sx={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 200,
                    p: 4, minWidth: 320, textAlign: 'center', borderRadius: 4,
                }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Avatar src={selectedUser.profilePhoto} sx={{ width: 80, height: 80, border: `3px solid ${theme.palette.primary.main}` }} />
                        <Typography variant="h5" fontWeight="bold">{selectedUser.displayName}</Typography>
                        {selectedUser.bio && <Typography variant="body2" color="text.secondary">{selectedUser.bio}</Typography>}
                    </Box>
                    <Box sx={{ mt: 1, mb: 3 }}>
                        <Typography variant="caption" display="block" color="primary" sx={{ mb: 1, fontWeight: 'bold' }}>INTERESTS</Typography>
                        {selectedUser.interests && selectedUser.interests.map((int, i) => (
                            <Typography key={i} variant="caption" sx={{
                                display: 'inline-block',
                                bgcolor: theme.palette.action.hover,
                                color: theme.palette.text.primary,
                                borderRadius: 1, px: 1, mx: 0.5, my: 0.2
                            }}>
                                {int.name || int}
                            </Typography>
                        ))}
                    </Box>
                    {/* Buttons centered */}
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

            <IconButton sx={{ position: 'absolute', bottom: 120, right: 20, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.default' } }} onClick={() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                    if (map) {
                        map.getView().animate({ center: fromLonLat([pos.coords.longitude, pos.coords.latitude]), zoom: 12 });
                    }
                });
            }}>
                <Crosshair />
            </IconButton>
        </Box>
    );
};

export default MapComponent;
