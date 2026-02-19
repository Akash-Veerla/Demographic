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
import M3SearchBar from './M3SearchBar';
import M3FAB from './M3FAB';
import M3Chip from './M3Chip';
import M3Switch from './M3Switch';
import M3Snackbar from './M3Snackbar';
import { useTheme } from '@mui/material';

const TIPS = [
    { icon: 'person', text: 'Click on user pins to see details' },
    { icon: 'push_pin', text: 'Right click anywhere to drop a pin' },
    { icon: 'navigation', text: 'Get real-time directions to users' },
    { icon: 'person_add', text: 'Send friend requests to connect' },
    { icon: 'group', text: 'Friends can see each other\'s online status' },
];

const MapComponent = () => {
    const { user, userLocation: storedLocation } = useAuth();
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
    const [isGlobalMode, setIsGlobalMode] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Tips Carousel State
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [isTipVisible, setIsTipVisible] = useState(true);

    const socketRef = useRef();

    // -------------------------------------------------------------------------
    // 0. Tips Carousel Effect (Smooth Transition)
    // -------------------------------------------------------------------------
    useEffect(() => {
        const interval = setInterval(() => {
            setIsTipVisible(false);
            setTimeout(() => {
                setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
                setIsTipVisible(true);
            }, 500); // Wait for fade out
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

        // Center map using stored location from AuthContext (no re-fetch)
        if (storedLocation) {
            const center = fromLonLat([storedLocation.lng, storedLocation.lat]);
            setUserLocation(center);
            initialMap.getView().animate({ center, zoom: 14, duration: 300 });
            // Also emit to socket for nearby user broadcast
            if (socketRef.current) {
                socketRef.current.emit('update_location', { lat: storedLocation.lat, lng: storedLocation.lng });
            }
        } else if (navigator.geolocation) {
            // Fallback: only fetch geolocation if no stored location
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const center = fromLonLat([longitude, latitude]);
                    setUserLocation(center);
                    initialMap.getView().animate({ center, zoom: 14 });
                    if (socketRef.current) {
                        socketRef.current.emit('update_location', { lat: latitude, lng: longitude });
                    }
                },
                (error) => console.error("Geolocation error:", error),
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
                    radius: 9,
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
                const res = await api.get('/api/users/global');
                setNearbyUsersList(res.data || []);
            } else {
                const center = toLonLat(userLocation);
                const [lng, lat] = center;
                const res = await api.get('/api/users/nearby', {
                    params: { lat, lng }
                });
                setNearbyUsersList(res.data || []);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }, [user, map, isGlobalMode, userLocation]);

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

        // B. Add Other Users — color-coded by relationship
        nearbyUsersList.forEach(u => {
            if (!u.location?.coordinates) return;
            if (u.location.coordinates[0] === 0 && u.location.coordinates[1] === 0) return;

            const feature = new Feature({
                geometry: new Point(fromLonLat(u.location.coordinates)),
                type: 'user',
                data: u
            });

            const isFriend = u.isFriend;
            const hasSharedInterests = (u.sharedInterests?.length || 0) > 0;

            // Marker color logic:
            // Friends: Red (light) / Purple (dark) — with online glow if online
            // Matched interests: Green
            // No match: Gray
            let markerColor;
            if (isFriend) {
                markerColor = isDark ? '#D0BCFF' : '#be3627'; // Purple (dark) / Red (light)
            } else if (hasSharedInterests) {
                markerColor = '#22c55e'; // Green
            } else {
                markerColor = '#9ca3af'; // Gray
            }

            let styles = [];

            // Base Marker Style
            const isSelected = selectedUser?._id === u._id;
            styles.push(new Style({
                image: new StyleCircle({
                    radius: isSelected ? 12 : (isFriend ? 10 : 8),
                    fill: new Fill({ color: markerColor }),
                    stroke: new Stroke({
                        color: isFriend && u.isOnline ? (isDark ? '#D0BCFF' : '#be3627') : '#fff',
                        width: isFriend && u.isOnline ? 4 : 2
                    })
                }),
                text: isSelected ? new Text({
                    text: u.displayName,
                    offsetY: 25, // Name below marker
                    fill: new Fill({ color: isDark ? '#fff' : '#000' }),
                    font: 'bold 12px Outfit',
                    stroke: new Stroke({ color: isDark ? '#000' : '#fff', width: 3 }),
                    padding: [2, 4, 2, 4],
                    backgroundFill: new Fill({ color: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)' }), // Legibility background
                }) : null,
                zIndex: isFriend ? 50 : 10
            }));

            // Badge: Friend online/offline, or match count
            if (isFriend) {
                styles.push(new Style({
                    text: new Text({
                        text: u.isOnline ? '● Online' : '○ Offline',
                        offsetY: -30, // Status above
                        font: 'bold 10px Outfit',
                        fill: new Fill({ color: u.isOnline ? (isDark ? '#D0BCFF' : '#be3627') : '#9ca3af' }),
                        backgroundFill: new Fill({ color: isDark ? '#1D1B20' : '#fff' }),
                        padding: [3, 6, 3, 6],
                    }),
                    zIndex: 51
                }));
            } else if (hasSharedInterests) {
                styles.push(new Style({
                    text: new Text({
                        text: `★ ${u.matchScore || u.sharedInterests.length}`,
                        offsetY: -30, // Star above
                        font: 'bold 10px Outfit',
                        fill: new Fill({ color: isDark ? '#86EFAC' : '#166534' }),
                        backgroundFill: new Fill({ color: isDark ? '#14532D' : '#DCFCE7' }),
                        padding: [3, 6, 3, 6],
                    }),
                    zIndex: 11
                }));
            }

            feature.setStyle(styles);
            userSource.addFeature(feature);
        });

        // C. Radius circle removed (server handles 20km filtering)
        radiusSource.clear();

    }, [nearbyUsersList, selectedUser, isDark, isGlobalMode, map, userLocation, theme, user]);

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
        <div className="relative h-full w-full bg-transparent p-2 overflow-hidden">
            {/* Map Container */}
            <div
                ref={mapRef}
                className="absolute inset-2 rounded-sq-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/5"
                style={{
                    filter: isDark
                        ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)'
                        : 'grayscale(10%) contrast(1.1)'
                }}
            />

            {/* A. Tips Carousel (Mobile: Top Left of Search, Desktop: Top Left) */}
            <div className={`absolute left-4 md:top-6 md:left-6 z-20 transition-all duration-500 ease-in-out ${currentTipIndex >= 0 ? 'block' : 'hidden'} top-24`}>
                <div className={`bg-white dark:bg-[#1C1B1F]/10 dark:backdrop-blur-2xl px-4 py-2 rounded-sq-xl shadow-xl border-[0.5px] border-white/30 dark:border-white/10 flex items-center gap-3 transition-opacity duration-500 ${isTipVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="material-symbols-outlined text-primary text-xl animate-bounce">
                        {TIPS[currentTipIndex].icon}
                    </span>
                    <span
                        key={currentTipIndex}
                        className="text-xs font-bold text-[#1a100f] dark:text-white"
                    >
                        {TIPS[currentTipIndex].text}
                    </span>
                </div>
            </div>

            {/* B. Top Search Bar — M3 Search Component */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4 transition-all duration-300">
                <M3SearchBar
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onClear={() => setSearchQuery('')}
                    placeholder={searchQuery === 'SHOW-CLUSTER-CENTERS' ? 'Activating Easter Egg...' : 'Search places'}
                    suggestions={searchResults}
                    showSuggestions={showSuggestions && searchResults.length > 0}
                    onSuggestionSelect={(place) => handleSearchSelect(place)}
                    renderSuggestion={(place, index, onSelect) => (
                        <button
                            key={place.place_id}
                            onClick={onSelect}
                            className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-primary/8 dark:hover:bg-[#D0BCFF]/8 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl text-[#49454F] dark:text-[#CAC4D0]">location_on</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#1a100f] dark:text-[#E6E1E5] truncate">{place.display_name.split(',')[0]}</p>
                                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] truncate">{place.display_name}</p>
                            </div>
                        </button>
                    )}
                />
            </div>

            {/* C. Top Right Controls (Global View) - Repositioned for mobile */}
            <div className="absolute top-24 right-4 md:top-6 md:right-6 z-20 flex gap-4">
                <div className="bg-white dark:bg-[#1C1B1F]/10 dark:backdrop-blur-2xl px-4 py-3 rounded-sq-xl shadow-xl border-[0.5px] border-white/30 dark:border-white/10 flex items-center gap-3 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
                    <M3Switch
                        checked={isGlobalMode}
                        onChange={() => setIsGlobalMode(!isGlobalMode)}
                        showIcons
                        label="Global View"
                    />
                </div>
            </div>

            {/* D. Map Controls (Bottom Right) — M3 FABs */}
            <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-2">
                <M3FAB
                    icon="my_location"
                    size="small"
                    variant="surface"
                    ariaLabel="Locate Me"
                    onClick={() => {
                        if (navigator.geolocation && map) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                                const coords = fromLonLat([pos.coords.longitude, pos.coords.latitude]);
                                map.getView().animate({ center: coords, zoom: 15, duration: 1000 });
                            });
                        }
                    }}
                />
                <M3FAB
                    icon="add"
                    size="small"
                    variant="surface"
                    ariaLabel="Zoom In"
                    onClick={() => map && map.getView().animate({ zoom: map.getView().getZoom() + 1, duration: 300 })}
                />
                <M3FAB
                    icon="remove"
                    size="small"
                    variant="surface"
                    ariaLabel="Zoom Out"
                    onClick={() => map && map.getView().animate({ zoom: map.getView().getZoom() - 1, duration: 300 })}
                />
            </div>


            {/* Alert Message Snackbar — M3 */}
            <M3Snackbar
                message={alertMessage}
                icon="directions_car"
                show={!!alertMessage}
                variant="info"
                duration={6000}
                onDismiss={() => setAlertMessage(null)}
            />

            {/* ----------------------------------------------------------------------- */}
            {/* UI PANELS: Detail View vs Navigation View */}
            {/* Using explicit hidden/pointer-events-none logic to prevent "ghost" elements */}
            {/* ----------------------------------------------------------------------- */}

            {/* E. User / Pin Detail Panel */}
            <div className={`
                absolute z-30 bg-white dark:bg-[#1C1B1F]/10 dark:backdrop-blur-2xl shadow-2xl border-[0.5px] border-white/30 dark:border-white/10 transition-all duration-500 ease-in-out
                ${(selectedUser || destinationPin) && !isNavigating ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-[120%] opacity-0 pointer-events-none'}
                md:top-24 md:left-6 md:w-80 md:rounded-sq-2xl md:h-auto md:max-h-[calc(100%-7rem)]
                bottom-0 left-0 right-0 w-full rounded-t-sq-2xl h-fit max-h-[60vh]
                flex flex-col overflow-hidden ring-1 ring-black/5 hover:border-white/50 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]
            `}>
                {/* Header */}
                <div className="px-5 pt-5 pb-2 shrink-0 flex justify-between items-start">
                    <div className="min-w-0 flex-1 mr-3">
                        <h3 className="text-2xl font-black tracking-tight text-[#1a100f] dark:text-white truncate">
                            {selectedUser ? selectedUser.displayName : (destinationPin ? 'Dropped Pin' : 'Details')}
                        </h3>
                        <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">
                            {selectedUser ? 'User Details' : 'Location'}
                        </p>
                    </div>
                    <button
                        onClick={() => { setSelectedUser(null); setDestinationPin(null); }}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 rounded-sq-sm transition-colors shrink-0"
                    >
                        <span className="material-symbols-outlined text-lg opacity-60">close</span>
                    </button>
                </div>

                {/* Content (Scrollable) */}
                <div className="px-5 pb-4 overflow-y-auto custom-scrollbar grow">
                    {selectedUser ? (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Status</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {selectedUser.isFriend ? (
                                        <>
                                            <span className={`font-bold uppercase text-xs tracking-wider px-2.5 py-1 rounded-sq-md ${selectedUser.isOnline ? 'text-primary bg-primary/10 dark:text-[#D0BCFF] dark:bg-[#D0BCFF]/10' : 'text-gray-500 bg-gray-100 dark:bg-white/10'}`}>
                                                {selectedUser.isOnline ? '● Online' : '○ Offline'}
                                            </span>
                                            <span className="font-bold uppercase text-xs tracking-wider px-2.5 py-1 rounded-sq-md text-primary bg-primary/10 dark:text-[#D0BCFF] dark:bg-[#D0BCFF]/10">
                                                ★ Friend
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            {selectedUser.sharedInterests && selectedUser.sharedInterests.length > 0 && (
                                                <span className="font-bold uppercase text-xs tracking-wider px-2.5 py-1 rounded-sq-md text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                                                    ★ {selectedUser.matchScore} Match{selectedUser.matchScore !== 1 ? 'es' : ''}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {selectedUser.interests && (
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Interests</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedUser.interests.slice(0, 10).map((int, i) => {
                                            const interestStr = typeof int === 'string' ? int : int.name;
                                            const isShared = selectedUser.sharedInterests?.some(si => si.toLowerCase() === interestStr.toLowerCase());
                                            return (
                                                <M3Chip
                                                    key={i}
                                                    label={isShared ? `★ ${interestStr}` : interestStr}
                                                    type="suggestion"
                                                    highlighted={isShared}
                                                    className="!h-7 !text-xs !px-2.5"
                                                />
                                            );
                                        })}
                                        {selectedUser.interests.length > 10 && (
                                            <M3Chip
                                                label={`+${selectedUser.interests.length - 10} more`}
                                                type="suggestion"
                                                className="!h-7 !text-xs !px-2.5 opacity-60"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedUser.bio && (
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Bio</span>
                                    <div className="max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {selectedUser.bio}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-2">
                            <p className="text-xs font-medium text-gray-500 text-center leading-relaxed">
                                You dropped a pin here. Tap <strong>Directions</strong> below to navigate.
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions Footer */}
                <div className="px-4 py-3 bg-white/50 dark:bg-[#141218]/50 backdrop-blur-md border-t border-gray-100 dark:border-white/5 shrink-0 flex flex-col gap-2">
                    {selectedUser && !selectedUser.isFriend && (
                        selectedUser.friendRequestSent ? (
                            <button disabled className="w-full bg-gray-100 dark:bg-white/10 text-gray-500 h-9 rounded-sq-lg font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                                <span className="material-symbols-outlined text-base">schedule_send</span>
                                Request Sent
                            </button>
                        ) : selectedUser.friendRequestReceived ? (
                            <button
                                onClick={async () => {
                                    try {
                                        const pendingRes = await api.get('/api/friend-requests/pending');
                                        const match = pendingRes.data.find(r => r.from._id === selectedUser._id || r.from === selectedUser._id);
                                        if (match) {
                                            await api.post('/api/friend-request/accept', { requestId: match._id });
                                            setAlertMessage('Friend request accepted!');
                                            setSelectedUser(prev => ({ ...prev, isFriend: true, friendRequestReceived: false }));
                                            fetchNearbyUsers();
                                        }
                                    } catch (err) {
                                        setAlertMessage(err.response?.data?.error || 'Failed to accept');
                                    }
                                }}
                                className="w-full bg-green-500 hover:bg-green-600 text-white h-9 rounded-sq-lg font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">person_add</span>
                                Accept Request
                            </button>
                        ) : (
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await api.post('/api/friend-request/send', { toUserId: selectedUser._id });
                                        setAlertMessage(res.data.message);
                                        setSelectedUser(prev => ({ ...prev, friendRequestSent: true }));
                                        fetchNearbyUsers();
                                    } catch (err) {
                                        setAlertMessage(err.response?.data?.error || 'Failed to send request');
                                    }
                                }}
                                className="w-full bg-primary hover:brightness-110 text-white h-9 rounded-sq-lg font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">person_add</span>
                                Send Friend Request
                            </button>
                        )
                    )}
                    {selectedUser && selectedUser.isFriend && (
                        <div className="w-full bg-primary/10 dark:bg-[#D0BCFF]/10 text-primary dark:text-[#D0BCFF] h-9 rounded-sq-lg font-bold text-xs flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-base">group</span>
                            Friends
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={startNavigation}
                            className="flex-1 bg-primary hover:brightness-110 text-white h-9 rounded-sq-lg font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-base">directions</span>
                            Directions
                        </button>
                        {selectedUser && selectedUser.isFriend && (
                            <button
                                onClick={() => setChatTarget(selectedUser)}
                                className="flex-1 bg-white dark:bg-white/10 dark:backdrop-blur-xl text-primary dark:text-[#D0BCFF] h-9 rounded-sq-lg font-bold text-xs border border-primary/20 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-base">chat</span>
                                Chat
                            </button>
                        )}
                    </div>
                </div>
            </div>


            {/* F. Navigation Panel (Replaces Detail Panel when navigating) */}
            {/* F. Navigation Panel (Replaces Detail Panel when navigating) */}
            <div className={`
                fixed z-[100] bg-white dark:bg-[#1C1B1F]/10 dark:backdrop-blur-2xl shadow-2xl border border-white/20 dark:border-white/10 transition-all duration-500 ease-in-out
                ${isNavigating ? 'translate-x-0 translate-y-0 opacity-100 pointer-events-auto' : 'md:-translate-x-[120%] translate-y-[120%] opacity-0 pointer-events-none'}
                md:top-6 md:left-8 md:w-80 md:rounded-sq-2xl h-fit
                bottom-0 left-0 right-0 w-full rounded-t-sq-2xl
                flex flex-col ring-1 ring-black/5
            `}>
                {/* Header Only - Directions Removed */}
                <div className="p-6 shrink-0 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sq-lg bg-green-500 text-white flex items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined">navigation</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[#1a100f] dark:text-white leading-none">Navigating</h3>
                            <p className="text-xs font-bold text-gray-400 mt-1">Follow route on map</p>
                        </div>
                    </div>
                    <button onClick={clearRoute} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-sq-lg font-bold text-xs hover:bg-red-100 transition-colors cursor-pointer">
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
