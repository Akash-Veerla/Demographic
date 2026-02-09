import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point, LineString, Circle as GeomCircle } from 'ol/geom';
import { Style, Circle as StyleCircle, Fill, Stroke, Text } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import api from '../utils/api';
import ChatOverlay from './ChatOverlay';
import { useTheme } from '@mui/material';

const TIPS = [
    { icon: 'person', text: 'Click on user pins to see details' },
    { icon: 'push_pin', text: 'Right click anywhere to drop a pin' },
    { icon: 'navigation', text: 'Get real-time directions' },
    { icon: 'chat', text: 'Chat with nearby connections' },
    { icon: 'travel_explore', text: 'Use Discovery Mode to find interests' },
];

const MapComponent = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const mapRef = useRef();
    const [map, setMap] = useState(null);

    // Sources
    const [userSource] = useState(new VectorSource());
    const [routeSource] = useState(new VectorSource());
    const [radiusSource] = useState(new VectorSource());
    const [destinationSource] = useState(new VectorSource()); // For Dropped Pins
    const [clusterSource] = useState(new VectorSource()); // For Easter Egg

    // State
    const [userLocation, setUserLocation] = useState(null); // Init as null, fetch via geolocation
    const [nearbyUsersList, setNearbyUsersList] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    // Navigation State
    const [routeInstructions, setRouteInstructions] = useState([]);
    const [isNavigating, setIsNavigating] = useState(false);
    const [destinationPin, setDestinationPin] = useState(null); // { coords: [lng, lat] }

    const [chatTarget, setChatTarget] = useState(null);
    const [socketReady, setSocketReady] = useState(false);
    const [discoveryMode, setDiscoveryMode] = useState(false);
    const [isGlobalMode, setIsGlobalMode] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Tips Carousel State
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    const socketRef = useRef();

    // -------------------------------------------------------------------------
    // 0. Tips Carousel Effect
    // -------------------------------------------------------------------------
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // -------------------------------------------------------------------------
    // 1. Initial Map Setup & Geolocation
    // -------------------------------------------------------------------------
    useEffect(() => {
        const initialMap = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM(), className: 'map-tile-layer' }),
                new VectorLayer({ source: clusterSource, zIndex: 4 }), // Easter Egg layer
                new VectorLayer({ source: radiusSource, zIndex: 5 }),
                new VectorLayer({ source: routeSource, zIndex: 7 }),
                new VectorLayer({ source: destinationSource, zIndex: 8 }),
                new VectorLayer({ source: userSource, zIndex: 10 })
            ],
            view: new View({
                center: fromLonLat([80.6480, 16.5062]), // Default fallback
                zoom: 12
            }),
            controls: []
        });

        setMap(initialMap);

        // Get User Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const center = fromLonLat([longitude, latitude]);
                    setUserLocation(center);
                    initialMap.getView().animate({ center, zoom: 14 });

                    // Update backend immediately
                    if (socketRef.current) {
                        socketRef.current.emit('update_location', { lat: latitude, lng: longitude });
                    }
                },
                (error) => {
                    console.error("Geolocation error:", error);
                },
                { enableHighAccuracy: true }
            );
        }

        // Click Listener for Users
        initialMap.on('click', (e) => {
            const feature = initialMap.forEachFeatureAtPixel(e.pixel, f => f);
            if (feature) {
                if (feature.get('type') === 'user') {
                    const userData = feature.get('data');
                    setSelectedUser(userData);
                    setDestinationPin(null); // Clear manual pin if user selected
                    // Move map
                    initialMap.getView().animate({ center: feature.getGeometry().getCoordinates(), zoom: 16, duration: 800 });
                }
            } else {
                // Deselect if clicking empty space (unless we are just dropping a pin context menu)
                setSelectedUser(null);
            }
        });

        // Context Menu (Right Click) for Pin Drop
        initialMap.getViewport().addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const pixel = initialMap.getEventPixel(e);
            const coord = initialMap.getCoordinateFromPixel(pixel); // Web Mercator
            const lonLat = toLonLat(coord);

            // Drop Destination Pin
            destinationSource.clear();
            const pinFeature = new Feature({
                geometry: new Point(coord),
                type: 'destination'
            });
            pinFeature.setStyle(new Style({
                image: new StyleCircle({
                    radius: 8,
                    fill: new Fill({ color: '#ef4444' }),
                    stroke: new Stroke({ color: '#fff', width: 3 })
                }),
                text: new Text({
                    text: '📍 Dest',
                    offsetY: -20,
                    font: 'bold 14px Outfit',
                    fill: new Fill({ color: '#ef4444' }),
                    stroke: new Stroke({ color: '#fff', width: 3 })
                })
            }));
            destinationSource.addFeature(pinFeature);
            setDestinationPin({ coordinates: lonLat });
            setSelectedUser(null); // Deselect user to show Pin panel
            setIsNavigating(false); // Reset nav state until confirmed
            setRouteInstructions([]);
            routeSource.clear();
        });

        return () => initialMap.setTarget(null);
    }, []);

    // -------------------------------------------------------------------------
    // 2. Fetch Users & Polling
    // -------------------------------------------------------------------------
    const fetchNearbyUsers = useCallback(async () => {
        if (!user || !map || !userLocation) return;
        try {
            if (isGlobalMode) {
                const res = await api.get('/api/users/global', { params: { interests: 'all' } });
                setNearbyUsersList(res.data || []);
            } else {
                const center = toLonLat(userLocation);
                const [lng, lat] = center;
                const radius = discoveryMode ? 10 : 20;
                const res = await api.get('/api/users/nearby', {
                    params: { lat, lng, radius, interests: 'all' }
                });
                setNearbyUsersList(res.data || []);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }, [user, map, discoveryMode, isGlobalMode, userLocation]);

    useEffect(() => {
        if (!map) return;
        const listener = () => fetchNearbyUsers();
        map.on('moveend', listener);
        fetchNearbyUsers();
        return () => map.un('moveend', listener);
    }, [map, fetchNearbyUsers]);

    // -------------------------------------------------------------------------
    // 3. Render Users on Map (Marker Branding)
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!map) return;
        userSource.clear();

        // A. Add "Me" Marker (White, Top Z)
        if (userLocation) {
            const meFeature = new Feature({ geometry: new Point(userLocation), type: 'me' });
            meFeature.setStyle(new Style({
                image: new StyleCircle({
                    radius: 14,
                    fill: new Fill({ color: '#ffffff' }),
                    stroke: new Stroke({ color: '#000000', width: 3 }),
                }),
                text: new Text({
                    text: 'You',
                    offsetY: -24,
                    fill: new Fill({ color: isDark ? '#fff' : '#000' }),
                    font: 'bold 13px Outfit',
                    stroke: new Stroke({ color: isDark ? '#000' : '#fff', width: 3 })
                }),
                zIndex: 999
            }));
            userSource.addFeature(meFeature);
        }

        // B. Add Other Users
        nearbyUsersList.forEach(u => {
            if (!u.location?.coordinates) return;
            if (u.location.coordinates[0] === 0 && u.location.coordinates[1] === 0) return;

            const feature = new Feature({
                geometry: new Point(fromLonLat(u.location.coordinates)),
                type: 'user',
                data: u
            });

            // Branding Logic
            const isOnline = u.isOnline;
            const isBusy = u.availabilityStatus === 'Busy';
            const isOffline = !u.isActive || !isOnline; // Strict offline definition

            // Mutual Match Check
            const myInterests = user?.interests || [];
            const theirInterests = u.interests || [];
            const isMutual = myInterests.some(i => theirInterests.includes(i));

            let markerColor = '#fbbf24'; // Neutral Default (Yellow)
            let zIndex = 10;
            let styles = [];

            if (isOffline) {
                markerColor = '#000000'; // Black (Offline)
            } else if (isBusy) {
                markerColor = '#9ca3af'; // Grey (Busy)
            } else if (isMutual) {
                markerColor = '#22c55e'; // Green (Mutual)
            }

            // Base Marker Style
            const isSelected = selectedUser?._id === u._id;
            styles.push(new Style({
                image: new StyleCircle({
                    radius: isSelected ? 12 : 8,
                    fill: new Fill({ color: markerColor }),
                    stroke: new Stroke({ color: '#fff', width: isSelected ? 3 : 2 })
                }),
                text: isSelected ? new Text({
                    text: u.displayName,
                    offsetY: -20,
                    fill: new Fill({ color: isDark ? '#fff' : '#000' }),
                    font: 'bold 12px Outfit',
                    stroke: new Stroke({ color: isDark ? '#000' : '#fff', width: 3 })
                }) : null,
                zIndex: 10
            }));

            // Busy Badge Overlay - Updated for Material You
            if (isBusy && isOnline) {
                styles.push(new Style({
                    text: new Text({
                        text: 'Busy',
                        offsetY: -24, // Float above
                        font: 'bold 10px Outfit',
                        fill: new Fill({ color: isDark ? '#E6E1E5' : '#1D1B20' }), // On Surface
                        backgroundFill: new Fill({ color: isDark ? '#49454F' : '#E7E0EC' }), // Surface Container High
                        padding: [4, 8, 4, 8],
                    }),
                    zIndex: 11
                }));
            }

            feature.setStyle(styles);
            userSource.addFeature(feature);
        });

        // C. Discovery Circle
        radiusSource.clear();
        if (discoveryMode && !isGlobalMode && userLocation) {
            const circleFeature = new Feature({
                geometry: new GeomCircle(userLocation, 10000)
            });
            circleFeature.setStyle(new Style({
                stroke: new Stroke({ color: theme.palette.primary.main, width: 2, lineDash: [10, 10] }),
                fill: new Fill({ color: isDark ? 'rgba(208, 188, 255, 0.05)' : 'rgba(190, 54, 39, 0.05)' })
            }));
            radiusSource.addFeature(circleFeature);
        }

    }, [nearbyUsersList, selectedUser, isDark, discoveryMode, isGlobalMode, map, userLocation, theme, user]);

    // -------------------------------------------------------------------------
    // 4. Routing & Navigation
    // -------------------------------------------------------------------------
    const getDirections = async (targetCoords) => {
        if (!map || !targetCoords) return;

        let startCoords;
        if (userLocation) {
            startCoords = toLonLat(userLocation);
        } else {
            startCoords = toLonLat(map.getView().getCenter());
        }

        const [myLng, myLat] = startCoords;
        const [targetLng, targetLat] = targetCoords;
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${myLng},${myLat};${targetLng},${targetLat}?overview=full&geometries=geojson&steps=true`;

        try {
            const response = await fetch(osrmUrl);
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const coordinates = route.geometry.coordinates;
                const instructions = route.legs[0].steps.map(step => step.maneuver.instruction);

                // Pivot UI State
                setRouteInstructions(instructions);
                setIsNavigating(true);
                setSelectedUser(null);
                setDestinationPin(null);

                routeSource.clear();
                const routeFeature = new Feature({ geometry: new LineString(coordinates.map(coord => fromLonLat(coord))) });
                routeFeature.setStyle(new Style({
                    stroke: new Stroke({ color: theme.palette.primary.main, width: 6 }) // Primary Color Route
                }));
                routeSource.addFeature(routeFeature);

                // Fly To Route Bounds (with padding for side sheet)
                map.getView().fit(routeFeature.getGeometry().getExtent(), {
                    padding: [100, 100, 100, 400],
                    duration: 1500
                });
            }
        } catch (err) {
            console.error("Routing error:", err);
            setAlertMessage("Failed to calculate route.");
        }
    };

    const clearRoute = () => {
        setRouteInstructions([]);
        setIsNavigating(false);
        routeSource.clear();
        setDestinationPin(null);
        destinationSource.clear();
    };

    const startNavigation = () => {
        if (destinationPin) {
            getDirections(destinationPin.coordinates);
        } else if (selectedUser) {
            // Notify via socket
            if (socketRef.current) {
                socketRef.current.emit('getting_directions', { targetUserId: selectedUser._id });
            }
            getDirections(selectedUser.location.coordinates);
        }
    };

    // -------------------------------------------------------------------------
    // 5. Easter Eggs & Clusters
    // -------------------------------------------------------------------------

    // Trigger from Search Bar
    useEffect(() => {
        if (searchQuery === 'SHOW-CLUSTER-CENTERS') {
            window.dispatchEvent(new Event('show_cluster_centers'));
            setSearchQuery(''); // Clear it
        }
    }, [searchQuery]);

    // Listener for Cluster Event (from Logo or Search)
    useEffect(() => {
        const handleShowClusters = () => {
            if (!map || nearbyUsersList.length === 0) return;

            // 1. Group users by interest[0] (Simpler clustering)
            const clusters = {};
            nearbyUsersList.forEach(u => {
                const mainInterest = u.interests?.[0] || 'Uncategorized';
                if (!clusters[mainInterest]) clusters[mainInterest] = [];
                clusters[mainInterest].push(u);
            });

            clusterSource.clear();

            Object.entries(clusters).forEach(([interest, users]) => {
                if (users.length < 2) return; // Minimal cluster

                // Calculate Centroid
                let sumLat = 0, sumLng = 0;
                users.forEach(u => {
                    sumLng += u.location.coordinates[0];
                    sumLat += u.location.coordinates[1];
                });
                const avgLng = sumLng / users.length;
                const avgLat = sumLat / users.length;
                const center = fromLonLat([avgLng, avgLat]);

                // Render Centroid Circle
                const centerFeature = new Feature({ geometry: new Point(center) });
                centerFeature.setStyle(new Style({
                    image: new StyleCircle({
                        radius: 20, // Large Pulsing Appearance (Static for now)
                        stroke: new Stroke({ color: '#ef4444', width: 2 }),
                        fill: new Fill({ color: 'rgba(239, 68, 68, 0.2)' })
                    }),
                    text: new Text({
                        text: interest,
                        font: 'bold 12px Outfit',
                        fill: new Fill({ color: '#ef4444' }),
                        stroke: new Stroke({ color: '#fff', width: 3 }),
                        offsetY: 0
                    })
                }));
                clusterSource.addFeature(centerFeature);

                // Render Lines to Users
                users.forEach(u => {
                    const line = new Feature({
                        geometry: new LineString([center, fromLonLat(u.location.coordinates)])
                    });
                    line.setStyle(new Style({
                        stroke: new Stroke({ color: 'rgba(239, 68, 68, 0.3)', width: 1 })
                    }));
                    clusterSource.addFeature(line);
                });
            });

            // Auto-clear after 10 seconds?
            setTimeout(() => clusterSource.clear(), 10000);

            // Zoom out to see clusters
            map.getView().animate({ zoom: map.getView().getZoom() - 1, duration: 1000 });
        };

        window.addEventListener('show_cluster_centers', handleShowClusters);
        return () => window.removeEventListener('show_cluster_centers', handleShowClusters);
    }, [map, nearbyUsersList, clusterSource]);


    // -------------------------------------------------------------------------
    // 6. Socket & Search Helpers
    // -------------------------------------------------------------------------
    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        socketRef.current = io(apiUrl, { withCredentials: true });
        setSocketReady(true);
        if (user) {
            socketRef.current.emit('register_user', user._id || user.id);
            if (user.location?.coordinates && (user.location.coordinates[0] !== 0)) {
                socketRef.current.emit('update_location', {
                    lng: user.location.coordinates[0],
                    lat: user.location.coordinates[1]
                });
            }
        }
        socketRef.current.on('chat_request', ({ from, fromName, roomId }) => {
            setChatTarget({ _id: from, displayName: fromName || 'User', roomId: roomId });
            socketRef.current.emit('accept_chat', { roomId });
        });
        socketRef.current.on('directions_alert', ({ message }) => {
            setAlertMessage(message);
        });
        return () => socketRef.current.disconnect();
    }, [user]);

    const handleSearchSelect = (place) => {
        const coords = [parseFloat(place.lon), parseFloat(place.lat)];
        map.getView().animate({ center: fromLonLat(coords), zoom: 14, duration: 1500 });
        setSearchQuery(place.display_name.split(',')[0]);
        setShowSuggestions(false);
    };

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 2 && showSuggestions && searchQuery !== 'SHOW-CLUSTER-CENTERS') {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
                    setSearchResults(await res.json());
                } catch (err) { console.error(err); }
            } else if (searchQuery.length === 0) {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, showSuggestions]);

    // Selection listener from Social
    useEffect(() => {
        const handleSelect = (e) => {
            const u = e.detail;
            setSelectedUser(u);
            setDestinationPin(null);
            if (u.location?.coordinates && map) {
                map.getView().animate({
                    center: fromLonLat(u.location.coordinates),
                    zoom: 16,
                    duration: 1500
                });
            }
        };
        window.addEventListener('select_map_user', handleSelect);
        return () => window.removeEventListener('select_map_user', handleSelect);
    }, [map]);


    return (
        <div className="relative h-full w-full bg-transparent p-4 overflow-hidden">
            {/* Map Container */}
            <div
                ref={mapRef}
                className="absolute inset-4 rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/5"
                style={{
                    filter: isDark
                        ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)'
                        : 'grayscale(10%) contrast(1.1)'
                }}
            />

            {/* A. Tips Carousel (Top Left of Search) */}
            <div className="absolute top-6 left-6 z-20 hidden lg:block">
                <div className="bg-white/90 dark:bg-[#141218]/90 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-xl animate-bounce">
                        {TIPS[currentTipIndex].icon}
                    </span>
                    <span
                        key={currentTipIndex}
                        className="text-xs font-bold text-[#1a100f] dark:text-white animate-in slide-in-from-bottom-2 fade-in duration-500"
                    >
                        {TIPS[currentTipIndex].text}
                    </span>
                </div>
            </div>

            {/* B. Top Search Bar */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4 transition-all duration-300">
                <div className="relative">
                    <div className="flex items-center bg-white/90 dark:bg-[#141218]/90 backdrop-blur-xl rounded-full p-1 shadow-2xl border border-white/20 dark:border-white/5">
                        <div className="flex-1 flex items-center pl-4">
                            <span className="material-symbols-outlined text-gray-400 mr-2">search</span>
                            <input
                                type="text"
                                placeholder={searchQuery === 'SHOW-CLUSTER-CENTERS' ? "Activating Easter Egg..." : "Search places"}
                                className="bg-transparent border-none focus:ring-0 text-[#1a100f] dark:text-white font-bold text-sm w-full placeholder-gray-400"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                            />
                        </div>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="p-2 text-gray-400 hover:text-gray-600">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        )}
                    </div>
                    {/* Suggestions */}
                    {showSuggestions && searchResults.length > 0 && (
                        <div className="absolute top-full text-left mt-2 w-full bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            {searchResults.map((place) => (
                                <button key={place.place_id} onClick={() => handleSearchSelect(place)} className="w-full text-left px-4 py-3 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0">
                                    <p className="text-sm font-bold text-[#1a100f] dark:text-white truncate">{place.display_name.split(',')[0]}</p>
                                    <p className="text-xs text-gray-500 truncate">{place.display_name}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* C. Top Right Controls (Discovery) */}
            <div className="absolute top-6 right-6 z-20 flex gap-4 hidden md:flex">
                <div className={`bg-white/90 dark:bg-[#141218]/90 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-2xl border border-white/20 dark:border-white/5 flex items-center gap-3 transition-all ${isGlobalMode ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={discoveryMode} disabled={isGlobalMode} onChange={() => setDiscoveryMode(!discoveryMode)} />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <span className="text-[#1a100f] dark:text-white font-bold text-xs">Discovery (10km)</span>
                </div>
                <div className={`bg-white/90 dark:bg-[#141218]/90 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-2xl border border-white/20 dark:border-white/5 flex items-center gap-3 ${discoveryMode ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isGlobalMode} disabled={discoveryMode} onChange={() => setIsGlobalMode(!isGlobalMode)} />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <span className="text-[#1a100f] dark:text-white font-bold text-xs">Global View</span>
                </div>
            </div>

            {/* D. Map Controls (Bottom Right) */}
            <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
                <button
                    onClick={() => {
                        if (navigator.geolocation && map) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                                const coords = fromLonLat([pos.coords.longitude, pos.coords.latitude]);
                                map.getView().animate({ center: coords, zoom: 15, duration: 1000 });
                            });
                        }
                    }}
                    className="p-3 bg-white/90 dark:bg-[#141218]/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/5 text-[#1a100f] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95"
                    title="Locate Me"
                >
                    <span className="material-symbols-outlined">my_location</span>
                </button>
                <button
                    onClick={() => map && map.getView().animate({ zoom: map.getView().getZoom() + 1, duration: 300 })}
                    className="p-3 bg-white/90 dark:bg-[#141218]/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/5 text-[#1a100f] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95"
                    title="Zoom In"
                >
                    <span className="material-symbols-outlined">add</span>
                </button>
                <button
                    onClick={() => map && map.getView().animate({ zoom: map.getView().getZoom() - 1, duration: 300 })}
                    className="p-3 bg-white/90 dark:bg-[#141218]/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/5 text-[#1a100f] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95"
                    title="Zoom Out"
                >
                    <span className="material-symbols-outlined">remove</span>
                </button>
            </div>


            {/* Alert Message Toast */}
            {alertMessage && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 pointer-events-none">
                    <div className="bg-primary text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20 pointer-events-auto">
                        <span className="material-symbols-outlined fill-current">directions_car</span>
                        <span className="font-bold text-sm">{alertMessage}</span>
                        <button onClick={() => setAlertMessage(null)} className="ml-2 hover:opacity-80"><span className="material-symbols-outlined text-sm">close</span></button>
                    </div>
                </div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* UI PANELS: Detail View vs Navigation View */}
            {/* ----------------------------------------------------------------------- */}

            {/* E. User / Pin Detail Panel (Side Sheet on Desktop, Bottom Sheet on Mobile) */}
            <div className={`
                fixed z-30 bg-white/95 dark:bg-[#141218]/95 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-white/5 transition-transform duration-300 ease-in-out
                ${(selectedUser || destinationPin) && !isNavigating ? 'translate-x-0 translate-y-0' : 'translate-y-[110%] md:translate-y-0 md:translate-x-[110%]'}
                md:top-4 md:right-4 md:w-96 md:h-[calc(100vh-2rem)] md:rounded-[28px]
                bottom-0 left-0 right-0 w-full rounded-t-[28px] max-h-[85vh]
                flex flex-col
            `}>
                {/* Header */}
                <div className="p-6 pb-2 shrink-0 flex justify-between items-start">
                    <h3 className="text-primary text-2xl font-black tracking-tight">
                        {destinationPin ? 'Dropped Pin' : 'User Details'}
                    </h3>
                    <button
                        onClick={() => { setSelectedUser(null); setDestinationPin(null); }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl opacity-60">close</span>
                    </button>
                </div>

                {/* Content (Scrollable) */}
                <div className="p-6 pt-2 overflow-y-auto custom-scrollbar grow">
                    {selectedUser ? (
                        <div className="space-y-6">
                            {/* Scale bio text responsive */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Name</span>
                                <span className="text-3xl font-black text-[#1a100f] dark:text-white">{selectedUser.displayName}</span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Status</span>
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold uppercase text-xs tracking-wider px-3 py-1 rounded-full ${selectedUser.isOnline ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-500 bg-gray-100 dark:bg-white/10'}`}>
                                        {selectedUser.isOnline ? 'Online' : 'Offline'}
                                    </span>
                                    {selectedUser.availabilityStatus && (
                                        <span className="font-bold uppercase text-xs tracking-wider px-3 py-1 rounded-full text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">
                                            {selectedUser.availabilityStatus}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {selectedUser.interests && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Interests</span>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedUser.interests.map((int, i) => (
                                            <span key={i} className="text-xs font-bold px-2 py-1 bg-primary/5 text-primary rounded-md border border-primary/10">
                                                {typeof int === 'string' ? int : int.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedUser.bio && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Bio</span>
                                    <p className="tex-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {selectedUser.bio}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="aspect-video bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 border-dashed">
                                <span className="material-symbols-outlined text-4xl text-primary/40">location_on</span>
                            </div>
                            <p className="text-sm font-medium text-gray-500 text-center">
                                You placed a pin here. Would you like to navigate to this location?
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions Footer */}
                <div className="p-6 pt-4 bg-white/50 dark:bg-[#141218]/50 backdrop-blur-md border-t border-gray-100 dark:border-white/5 shrink-0 flex flex-col gap-3">
                    <button
                        onClick={startNavigation}
                        className="w-full bg-primary hover:brightness-110 text-white py-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:animate-bounce">directions</span>
                        Get Directions
                    </button>
                    {selectedUser && (
                        <button
                            onClick={() => setChatTarget(selectedUser)}
                            className="w-full bg-white dark:bg-[#231f29] text-primary py-4 rounded-2xl font-black text-sm border border-primary/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-xl">chat</span>
                            Chat
                        </button>
                    )}
                </div>
            </div>


            {/* F. Navigation Panel (Replaces Detail Panel when navigating) */}
            <div className={`
                fixed z-30 bg-white/95 dark:bg-[#141218]/95 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-white/5 transition-transform duration-300 ease-in-out
                ${isNavigating ? 'translate-x-0 translate-y-0' : 'translate-y-[110%] md:translate-y-0 md:translate-x-[110%]'}
                md:top-4 md:right-4 md:w-80 md:rounded-[28px]
                bottom-0 left-0 right-0 w-full rounded-t-[28px]
                flex flex-col
            `}>
                {/* Header Only - Directions Removed */}
                <div className="p-6 shrink-0 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined">navigation</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[#1a100f] dark:text-white leading-none">Navigating</h3>
                            <p className="text-xs font-bold text-gray-400 mt-1">Follow route on map</p>
                        </div>
                    </div>
                    <button onClick={clearRoute} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full font-bold text-xs hover:bg-red-100 transition-colors">
                        End Trip
                    </button>
                </div>
            </div>

            {/* Chat Overlay */}
            {chatTarget && socketReady && (
                <ChatOverlay
                    socket={socketRef.current}
                    user={user}
                    targetUser={chatTarget}
                    onClose={() => setChatTarget(null)}
                />
            )}
        </div >
    );
};

export default MapComponent;
