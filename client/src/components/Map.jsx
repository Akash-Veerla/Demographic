import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom';
import { Style, Circle as StyleCircle, Fill, Stroke, Text } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import api from '../utils/api';
import ChatOverlay from './ChatOverlay';
import { useTheme } from '@mui/material';

const MapComponent = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const mapRef = useRef();
    const [map, setMap] = useState(null);
    const [userSource] = useState(new VectorSource());
    const [routeSource] = useState(new VectorSource());

    const [radius, setRadius] = useState(15);
    const [nearbyUsersList, setNearbyUsersList] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [routeInstructions, setRouteInstructions] = useState([]);
    const [chatTarget, setChatTarget] = useState(null);
    const [socketReady, setSocketReady] = useState(false);
    const [discoveryMode, setDiscoveryMode] = useState(false);

    const { user } = useAuth();
    const socketRef = useRef();

    // Fetch Nearby Users
    const fetchNearbyUsers = useCallback(async () => {
        if (!user || !map) return;
        try {
            const center = toLonLat(map.getView().getCenter());
            const [lng, lat] = center;
            const res = await api.get('/api/users/nearby', {
                params: { lat, lng, radius: discoveryMode ? 50 : 15, interests: 'all' }
            });
            setNearbyUsersList(res.data || []);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }, [user, map, discoveryMode]);

    // OSRM Routing
    const getDirections = async (targetUser) => {
        if (!map || !targetUser.location?.coordinates) return;
        const center = toLonLat(map.getView().getCenter());
        const [myLng, myLat] = center;
        const [targetLng, targetLat] = targetUser.location.coordinates;
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${myLng},${myLat};${targetLng},${targetLat}?overview=full&geometries=geojson&steps=true`;

        try {
            const response = await fetch(osrmUrl);
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const coordinates = route.geometry.coordinates;
                const instructions = route.legs[0].steps.map(step => step.maneuver.instruction);
                setRouteInstructions(instructions);
                routeSource.clear();
                const routeFeature = new Feature({ geometry: new LineString(coordinates.map(coord => fromLonLat(coord))) });
                routeFeature.setStyle(new Style({
                    stroke: new Stroke({ color: isDark ? '#D0BCFF' : '#be3627', width: 5 })
                }));
                routeSource.addFeature(routeFeature);
                map.getView().fit(routeFeature.getGeometry().getExtent(), { padding: [100, 100, 100, 100], duration: 1000 });
            }
        } catch (err) {
            console.error("Routing error:", err);
        }
    };

    // Initial Map Setup
    useEffect(() => {
        const initialMap = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM(), className: 'map-tile-layer' }),
                new VectorLayer({ source: routeSource, zIndex: 7 }),
                new VectorLayer({ source: userSource, zIndex: 10 })
            ],
            view: new View({
                center: fromLonLat([80.6480, 16.5062]),
                zoom: 12
            }),
            controls: []
        });

        setMap(initialMap);

        initialMap.on('click', (e) => {
            const feature = initialMap.forEachFeatureAtPixel(e.pixel, f => f);
            if (feature && feature.get('type') === 'user') {
                setSelectedUser(feature.get('data'));
            } else {
                setSelectedUser(null);
                setRouteInstructions([]);
                routeSource.clear();
            }
        });

        initialMap.on('moveend', () => { fetchNearbyUsers(); });
        return () => initialMap.setTarget(null);
    }, []);

    // Selection listener from Social
    useEffect(() => {
        const handleSelect = (e) => {
            const u = e.detail;
            setSelectedUser(u);
            if (u.location?.coordinates && map) {
                map.getView().animate({
                    center: fromLonLat(u.location.coordinates),
                    zoom: 14,
                    duration: 1500
                });
            }
        };
        window.addEventListener('select_map_user', handleSelect);
        return () => window.removeEventListener('select_map_user', handleSelect);
    }, [map]);

    // Update Markers
    useEffect(() => {
        if (!map) return;
        userSource.clear();
        nearbyUsersList.forEach(u => {
            if (!u.location?.coordinates) return;
            const feature = new Feature({
                geometry: new Point(fromLonLat(u.location.coordinates)),
                type: 'user',
                data: u
            });
            const isSelected = selectedUser?._id === u._id;
            feature.setStyle(new Style({
                image: new StyleCircle({
                    radius: isSelected ? 12 : 8,
                    fill: new Fill({ color: isSelected ? (isDark ? '#D0BCFF' : '#be3627') : '#915b55' }),
                    stroke: new Stroke({ color: '#fff', width: isSelected ? 3 : 2 })
                }),
                text: isSelected ? new Text({
                    text: u.displayName,
                    offsetY: -20,
                    fill: new Fill({ color: isDark ? '#fff' : '#000' }),
                    font: 'bold 12px Outfit',
                    stroke: new Stroke({ color: isDark ? '#000' : '#fff', width: 2 })
                }) : null
            }));
            userSource.addFeature(feature);
        });
    }, [nearbyUsersList, selectedUser, isDark]);

    // Socket
    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        socketRef.current = io(apiUrl, { withCredentials: true });
        setSocketReady(true);
        if (user) socketRef.current.emit('register_user', user._id || user.id);
        socketRef.current.on('chat_request', ({ from, fromName, roomId }) => {
            setChatTarget({ _id: from, displayName: fromName || 'User', roomId: roomId });
            socketRef.current.emit('accept_chat', { roomId });
        });
        return () => socketRef.current.disconnect();
    }, [user]);

    return (
        <div className="relative h-full w-full overflow-hidden bg-[#e5e7eb] dark:bg-[#1a1a1a]">
            {/* Map Container */}
            <div
                ref={mapRef}
                className="absolute inset-0 w-full h-full"
                style={{
                    filter: isDark
                        ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)'
                        : 'grayscale(10%) contrast(1.1)'
                }}
            />

            {/* Top Search Bar (Centered like Nav) */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
                <div className="flex items-center bg-white/90 dark:bg-[#141218]/90 backdrop-blur-xl rounded-full p-1 shadow-2xl border border-white/20 dark:border-white/5">
                    <div className="flex-1 flex items-center pl-4">
                        <span className="material-symbols-outlined text-gray-400 mr-2">search</span>
                        <input
                            type="text"
                            placeholder="vijayawada"
                            className="bg-transparent border-none focus:ring-0 text-[#1a100f] dark:text-white font-bold text-sm w-full placeholder-gray-400"
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(e.target.value)}`);
                                    const data = await res.json();
                                    if (data?.[0]) {
                                        map.getView().animate({ center: fromLonLat([parseFloat(data[0].lon), parseFloat(data[0].lat)]), zoom: 12, duration: 1500 });
                                    }
                                }
                            }}
                        />
                    </div>
                    <button className="bg-[#4a7c7c] hover:bg-[#3d6666] text-white px-6 py-2 rounded-full font-bold text-sm transition-all shadow-md">
                        Search
                    </button>
                </div>
            </div>

            {/* Left: Location Details / User Card */}
            {selectedUser && (
                <div className="absolute top-24 left-6 z-20 w-80 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="bg-white/95 dark:bg-[#141218]/95 backdrop-blur-xl rounded-[28px] p-6 shadow-2xl border border-white/20 dark:border-white/5">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-[#4a7c7c] dark:text-[#D0BCFF] text-xl font-black">Location Details</h3>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-bold">Name:</span>
                                <span className="text-[#1a100f] dark:text-white font-black">{selectedUser.displayName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-bold">Lat/Lon:</span>
                                <span className="text-[#1a100f] dark:text-white font-bold">
                                    {selectedUser.location?.coordinates?.[1].toFixed(4)}, {selectedUser.location?.coordinates?.[0].toFixed(4)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-bold">Status:</span>
                                <span className="text-primary font-black uppercase text-[10px] tracking-widest bg-primary/10 px-2 py-0.5 rounded">Active</span>
                            </div>
                        </div>

                        {/* Route Instructions */}
                        {routeInstructions.length > 0 && (
                            <div className="mb-6 max-h-48 overflow-y-auto custom-scrollbar border-t border-gray-100 dark:border-white/10 pt-4">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Directions</p>
                                {routeInstructions.map((step, i) => (
                                    <div key={i} className="flex gap-2 mb-2 text-xs font-bold text-[#1a100f] dark:text-white bg-gray-50 dark:bg-white/5 p-2 rounded-lg">
                                        <span className="text-primary">{i + 1}.</span>
                                        <span>{step}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => getDirections(selectedUser)}
                                className="w-full bg-[#4a7c7c] hover:bg-[#3d6666] text-white py-3 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">directions</span>
                                Get Directions
                            </button>
                            <button
                                onClick={() => setChatTarget(selectedUser)}
                                className="w-full bg-white dark:bg-[#231f29] text-primary py-3 rounded-2xl font-black text-sm border border-primary/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">chat</span>
                                Chat
                            </button>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="w-full py-2 text-gray-400 hover:text-gray-600 dark:hover:text-white font-bold text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Center: Discovery Mode Toggle */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-white/90 dark:bg-[#141218]/90 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-2xl border border-white/20 dark:border-white/5 flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={discoveryMode}
                            onChange={() => setDiscoveryMode(!discoveryMode)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4a7c7c]"></div>
                    </label>
                    <span className="text-[#1a100f] dark:text-white font-black text-sm">Discovery Mode</span>
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
        </div>
    );
};

export default MapComponent;
