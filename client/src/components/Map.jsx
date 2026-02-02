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
import { Style, Circle as StyleCircle, Fill, Stroke } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Added for profile link
import io from 'socket.io-client';
import api from '../utils/api';
import ChatOverlay from './ChatOverlay'; // We might need to adapt this UI too, or keep it as legacy overlay
// import { ColorModeContext } from '../App'; // Tailwind handles mode now, but we might toggle it

const MapComponent = () => {
    const mapRef = useRef();
    const [map, setMap] = useState(null);
    const [userSource] = useState(new VectorSource());
    const [selfSource] = useState(new VectorSource());
    const [viewState, setViewState] = useState({ center: fromLonLat([80.6480, 16.5062]), zoom: 9 });

    const [radius, setRadius] = useState(15);
    const [nearbyUsersList, setNearbyUsersList] = useState([]); // For Sidebar List
    const [selectedUser, setSelectedUser] = useState(null);
    const [chatTarget, setChatTarget] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isArrivalMode, setIsArrivalMode] = useState(false); // Toggle between Radius view and Arrival view

    const { user } = useSelector(state => state.auth);
    const socketRef = useRef(null);
    const [socketReady, setSocketReady] = useState(false);
    const navigate = useNavigate();

    // Fetch Logic
    const fetchNearbyUsers = useCallback(async () => {
        if (!user || !map) return;
        try {
            const center = toLonLat(map.getView().getCenter());
            const [lng, lat] = center;

            const res = await api.get('/api/users/nearby', {
                params: { lat, lng, radius, interests: 'all' }
            });
            const users = res.data || [];

            setNearbyUsersList(users);

            // Update Map Markers
            userSource.clear();
            users.forEach(u => {
                if (!u.location?.coordinates) return;
                const [uLng, uLat] = u.location.coordinates;
                const feature = new Feature({
                    geometry: new Point(fromLonLat([uLng, uLat])),
                    type: 'user',
                    data: u
                });

                // Simple dot style for map, sidebar has details
                feature.setStyle(new Style({
                    image: new StyleCircle({
                        radius: 8,
                        fill: new Fill({ color: '#f46734' }), // Primary color
                        stroke: new Stroke({ color: '#fff', width: 2 })
                    })
                }));
                userSource.addFeature(feature);
            });

        } catch (err) {
            console.error("Fetch error:", err);
        }
    }, [user, map, radius, userSource]);

    // Initial Map Setup
    useEffect(() => {
        const initialMap = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM(), className: 'map-tile-layer' }),
                new VectorLayer({ source: selfSource, zIndex: 5 }),
                new VectorLayer({ source: userSource, zIndex: 10 })
            ],
            view: new View({
                center: viewState.center,
                zoom: viewState.zoom
            }),
            controls: [] // No default controls
        });

        setMap(initialMap);

        initialMap.on('click', (e) => {
            const feature = initialMap.forEachFeatureAtPixel(e.pixel, f => f);
            if (feature && feature.get('type') === 'user') {
                setSelectedUser(feature.get('data'));
                setIsArrivalMode(true); // Switch to sidebar view
            } else {
                setSelectedUser(null);
                // Optional: click map to go back to radius mode?
                // setIsArrivalMode(false);
            }
        });

        initialMap.on('moveend', () => {
            fetchNearbyUsers();
        });

        return () => initialMap.setTarget(null);
    }, []);

    // Radius Circle Visual
    useEffect(() => {
        if (!map) return;
        selfSource.clear();
        const center = map.getView().getCenter(); // Use map center for radius search visual
        // Or use myLocation if tracked. For now, map center matches the "Search Zone" concept.

        // In "Search Zone" mode, the radius is around the center
        // Draw circle
        // 1 degree lat ~= 111km.
        // Projection math is complex for exact meters in Web Mercator, simplified scale:
        const resolution = map.getView().getResolution();
        // Just use a simple feature if needed, but the UI has a CSS overlay circle!
        // So we might NOT need an OpenLayers circle if the CSS circle corresponds to the map center.
        // Screen 4 has a CSS circle: <div class="w-[500px] h-[500px] ...">
        // This is static in pixels. Map radius is in meters.
        // We should probably rely on the CSS visual for the "vibe" and the slider for the "logic".
    }, [map, radius, selfSource]);

    // Polling
    useEffect(() => {
        if (map) fetchNearbyUsers();
        const interval = setInterval(() => { if (map) fetchNearbyUsers(); }, 15000);
        return () => clearInterval(interval);
    }, [fetchNearbyUsers, map]);

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

    // UI Handlers
    const toggleMode = () => setIsArrivalMode(!isArrivalMode);

    return (
        <div className="relative flex h-screen w-full flex-col group/design-root overflow-hidden bg-background-light dark:bg-background-dark text-[#1c110d] dark:text-[#fcf9f8]">
            {/* Header Removed (Handled by Layout.jsx) */}
            <main className="relative flex-1 w-full h-full overflow-hidden bg-[#e5e7eb] dark:bg-[#1a1a1a]">
                {/* Map Container - Applied Grayscale Filter */}
                <div
                    ref={mapRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ filter: 'grayscale(20%) opacity(0.9)' }}
                />

                {/* Map Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10 pointer-events-none"></div>

                {/* --- UI Overlays --- */}

                {!isArrivalMode ? (
                    /* RADIUS MODE */
                    <>
                        {/* Center Circle Animation */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center">
                            <div className="w-[500px] h-[500px] rounded-full bg-primary/20 border-2 border-primary shadow-[0_0_40px_rgba(244,103,52,0.2)] animate-pulse flex items-center justify-center relative">
                                <div className="absolute inset-0 rounded-full border border-primary/40 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                <div className="relative z-20 -mt-8">
                                    <span className="material-symbols-outlined text-6xl text-primary drop-shadow-lg filter">location_on</span>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/30 blur-sm rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Controls Container */}
                        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6">
                            {/* Top Sidebar & Zoom */}
                            <div className="flex justify-between items-start">
                                {/* Search Zone Sidebar */}
                                <div className="pointer-events-auto w-80 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md shadow-lg rounded-xl overflow-hidden border border-white/20 dark:border-white/5 animate-in slide-in-from-left-4 fade-in duration-500">
                                    <div className="p-5 flex flex-col gap-4">
                                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                                            <h3 className="text-[#1c110d] dark:text-white text-lg font-bold leading-tight">Search Zone</h3>
                                            <div className="px-2 py-1 bg-primary/10 rounded text-primary text-xs font-bold uppercase tracking-wider">Active</div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="relative flex-shrink-0 size-10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-primary font-semibold text-sm">Calculating...</p>
                                                <p className="text-[#9c5f49] dark:text-[#ccaca2] text-sm leading-snug">
                                                    Scanning for active users and venues within the selected range.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="bg-[#f4eae7]/50 dark:bg-[#3a2822]/50 p-3 rounded-lg">
                                                <p className="text-xs text-[#9c5f49] dark:text-[#ccaca2]">Est. Users</p>
                                                <p className="text-lg font-bold text-[#1c110d] dark:text-white">{nearbyUsersList.length}</p>
                                            </div>
                                            <div className="bg-[#f4eae7]/50 dark:bg-[#3a2822]/50 p-3 rounded-lg">
                                                <p className="text-xs text-[#9c5f49] dark:text-[#ccaca2]">Density</p>
                                                <p className="text-lg font-bold text-[#1c110d] dark:text-white">{nearbyUsersList.length > 10 ? 'High' : 'Low'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Zoom Controls */}
                                <div className="pointer-events-auto flex flex-col gap-2">
                                    <div className="bg-background-light dark:bg-background-dark shadow-md rounded-lg flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800">
                                        <button
                                            onClick={() => map.getView().setZoom(map.getView().getZoom() + 1)}
                                            className="size-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 transition-colors text-[#1c110d] dark:text-white border-b border-gray-100 dark:border-gray-800"
                                        >
                                            <span className="material-symbols-outlined">add</span>
                                        </button>
                                        <button
                                            onClick={() => map.getView().setZoom(map.getView().getZoom() - 1)}
                                            className="size-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 transition-colors text-[#1c110d] dark:text-white"
                                        >
                                            <span className="material-symbols-outlined">remove</span>
                                        </button>
                                    </div>
                                    <button onClick={toggleMode} className="size-10 bg-background-light dark:bg-background-dark shadow-md rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-primary border border-gray-100 dark:border-gray-800">
                                        <span className="material-symbols-outlined">near_me</span>
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Radius Slider */}
                            <div className="flex justify-center w-full pb-4">
                                <div className="pointer-events-auto w-full max-w-2xl bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-6 border border-white/20 dark:border-white/5 animate-in slide-in-from-bottom-8 fade-in duration-500">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <p className="text-[#1c110d] dark:text-white text-lg font-bold">Adjust Range</p>
                                                <p className="text-sm text-[#9c5f49] dark:text-[#ccaca2]">Define the radius for your connection search.</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-[#f4eae7] dark:bg-[#3a2822] px-3 py-1.5 rounded-lg border border-primary/20">
                                                <span className="material-symbols-outlined text-primary text-sm">radar</span>
                                                <span className="text-primary font-mono font-bold text-lg">{radius} km</span>
                                            </div>
                                        </div>
                                        {/* Slider */}
                                        <div className="relative w-full h-8 flex items-center">
                                            <input
                                                type="range"
                                                min="1"
                                                max="50"
                                                value={radius}
                                                onChange={(e) => setRadius(parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs font-medium text-[#9c5f49] dark:text-[#ccaca2] -mt-2">
                                            <span>1 km</span>
                                            <span>25 km</span>
                                            <span>50 km</span>
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button
                                                onClick={toggleMode}
                                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 group"
                                            >
                                                <span>Confirm Selection</span>
                                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-xl">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* ARRIVAL / SEARCH MODE */
                    <>
                        {/* Static Ripple Effect (Simulated) */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 translate-x-[180px]">
                            <div className="absolute w-[600px] h-[600px] rounded-full border border-primary/10 bg-primary/5 opacity-40"></div>
                            <div className="absolute w-[350px] h-[350px] rounded-full border border-primary/30 bg-primary/10 opacity-60"></div>
                            <div className="absolute w-[140px] h-[140px] rounded-full border-2 border-primary/50 bg-primary/20 opacity-80 animate-pulse"></div>
                            <div className="relative flex flex-col items-center justify-center -mt-8">
                                <div className="size-12 bg-primary rounded-full shadow-glow flex items-center justify-center text-white z-20">
                                    <span className="material-symbols-outlined text-[28px] fill-current">location_on</span>
                                </div>
                                <div className="w-4 h-2 bg-black/30 rounded-[100%] blur-[2px] mt-1"></div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="absolute top-6 left-6 bottom-6 w-[380px] z-20 flex flex-col">
                            <div className="flex flex-col h-full bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md shadow-sidebar border border-white/50 dark:border-white/10 rounded-[28px] overflow-hidden">
                                {/* Sidebar Header */}
                                <div className="px-6 pt-8 pb-4">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2 text-primary/80 bg-primary/10 px-3 py-1 rounded-full w-fit">
                                            <span className="material-symbols-outlined text-sm">flight_land</span>
                                            <span className="text-xs font-bold uppercase tracking-wider">Arrival Complete</span>
                                        </div>
                                        <button onClick={toggleMode} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>
                                    <h2 className="text-[#1c0d10] dark:text-white text-[28px] font-bold leading-tight tracking-tight mb-2">
                                        Arrived
                                    </h2>
                                    <p className="text-[#9c4957] text-sm font-medium">Explore local connections</p>
                                </div>

                                {/* Local Search */}
                                <div className="px-6 pb-4">
                                    <div className="flex w-full items-center rounded-xl bg-white dark:bg-[#2f151b] h-12 shadow-sm border border-gray-100 dark:border-none">
                                        <div className="text-[#9c4957] pl-4 flex items-center">
                                            <span className="material-symbols-outlined">person_search</span>
                                        </div>
                                        <input className="w-full bg-transparent border-none focus:ring-0 text-[#1c0d10] dark:text-white placeholder:text-[#9c4957]/70 text-sm h-full px-3" placeholder="Find people nearby..." />
                                    </div>
                                </div>

                                {/* Users List */}
                                <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
                                    <div className="flex flex-col gap-3">
                                        <div className="text-xs font-bold text-[#9c4957] uppercase tracking-wider px-2 mt-2 mb-1">Nearby Locals</div>

                                        {nearbyUsersList.map(u => (
                                            <div key={u._id} onClick={() => setChatTarget(u)} className="flex items-center gap-4 bg-white dark:bg-[#2f151b] p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                                                <div className="relative shrink-0">
                                                    <div
                                                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-14 ring-2 ring-transparent group-hover:ring-primary/20 transition-all"
                                                        style={{ backgroundImage: `url(${u.profilePhoto || 'https://ui-avatars.com/api/?name=' + u.displayName})` }}
                                                    ></div>
                                                    <div className="absolute bottom-0 right-0 size-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                                </div>
                                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                                    <p className="text-[#1c0d10] dark:text-white text-base font-bold leading-snug truncate">{u.displayName}</p>
                                                    <p className="text-[#9c4957] text-sm font-normal truncate">{u.bio || 'Kon-nect User'}</p>
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                                        <span className="material-symbols-outlined text-[14px]">near_me</span>
                                                        <span>~ km away</span>
                                                    </div>
                                                </div>
                                                <button className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-[20px]">chat</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer CTA */}
                                <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-white/50 dark:bg-white/5">
                                    <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-full transition-all shadow-lg shadow-primary/30">
                                        <span className="material-symbols-outlined text-[20px]">hub</span>
                                        Broadcast Presence
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>

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
