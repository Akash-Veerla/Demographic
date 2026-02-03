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
import { Style, Circle as StyleCircle, Fill, Stroke } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import api from '../utils/api';
import ChatOverlay from './ChatOverlay';

const MapComponent = () => {
    const mapRef = useRef();
    const [map, setMap] = useState(null);
    const [userSource] = useState(new VectorSource());
    const [routeSource] = useState(new VectorSource()); // For Route Lines
    const [viewState, setViewState] = useState({ center: fromLonLat([80.6480, 16.5062]), zoom: 9 });

    const [radius, setRadius] = useState(15);
    const [filterMode, setFilterMode] = useState('global'); // 'global' or 'relevant'

    // Missing States
    const [nearbyUsersList, setNearbyUsersList] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isArrivalMode, setIsArrivalMode] = useState(false);
    const [routeInstructions, setRouteInstructions] = useState([]);
    const [chatTarget, setChatTarget] = useState(null);
    const [socketReady, setSocketReady] = useState(false);

    const { user } = useAuth();
    const socketRef = useRef();

    // Helper to check match
    const checkInterestMatch = (uInterests) => {
        if (!user?.interests || !uInterests) return false;
        const mySet = new Set(user.interests.map(i => typeof i === 'string' ? i.toLowerCase() : i.name.toLowerCase()));
        return uInterests.some(i => mySet.has(typeof i === 'string' ? i.toLowerCase() : i.name.toLowerCase()));
    };

    const getFilteredUsers = useCallback(() => {
        if (filterMode === 'global') return nearbyUsersList;
        return nearbyUsersList.filter(u => checkInterestMatch(u.interests));
    }, [nearbyUsersList, filterMode, user]);

    // Update Map Markers when list or mode changes
    useEffect(() => {
        if (!map) return;
        userSource.clear();
        const filtered = getFilteredUsers();

        filtered.forEach(u => {
            if (!u.location?.coordinates) return;
            const [uLng, uLat] = u.location.coordinates;
            // Highlight match in Relevant mode or just always? 
            // Maybe different color for match?
            const isMatch = checkInterestMatch(u.interests);

            const feature = new Feature({
                geometry: new Point(fromLonLat([uLng, uLat])),
                type: 'user',
                data: u
            });
            feature.setStyle(new Style({
                image: new StyleCircle({
                    radius: 8,
                    fill: new Fill({ color: isMatch ? '#be3627' : '#5e413d' }), // Red for match, Dark for others (Light Mode logic mostly)
                    stroke: new Stroke({ color: '#fff', width: 2 })
                })
            }));
            userSource.addFeature(feature);
        });
    }, [nearbyUsersList, filterMode, map, userSource, getFilteredUsers]);

    // Fetch Nearby Users
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
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }, [user, map, radius]);

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
                routeFeature.setStyle(new Style({ stroke: new Stroke({ color: '#be3627', width: 4 }) }));
                routeSource.addFeature(routeFeature);
                const extent = routeFeature.getGeometry().getExtent();
                map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 });
            }
        } catch (err) {
            console.error("Routing error:", err);
            alert("Could not fetch directions.");
        }
    };

    // Initial Map Setup
    useEffect(() => {
        const initialMap = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM(), className: 'map-tile-layer' }),
                new VectorLayer({ source: routeSource, zIndex: 7 }), // Route layer
                new VectorLayer({ source: userSource, zIndex: 10 })
            ],
            view: new View({
                center: viewState.center,
                zoom: viewState.zoom
            }),
            controls: []
        });

        setMap(initialMap);

        initialMap.on('click', (e) => {
            const feature = initialMap.forEachFeatureAtPixel(e.pixel, f => f);
            if (feature && feature.get('type') === 'user') {
                const u = feature.get('data');
                setSelectedUser(u);
                setIsArrivalMode(true);
            } else {
                setSelectedUser(null);
                setRouteInstructions([]);
                routeSource.clear();
            }
        });

        initialMap.on('moveend', () => {
            fetchNearbyUsers();
        });

        return () => initialMap.setTarget(null);
    }, []);

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


    const toggleMode = () => {
        setIsArrivalMode(!isArrivalMode);
        if (!isArrivalMode) {
            // Reset selection when leaving arrival mode?
            // setSelectedUser(null);
        }
    };

    return (
        <div className="relative flex h-full w-full flex-col group/design-root overflow-hidden bg-background-light dark:bg-background-dark text-[#1c110d] dark:text-[#fcf9f8]">
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

                            {/* Top Place Search Bar (Floating) */}
                            <div className="pointer-events-auto absolute top-6 left-1/2 -translate-x-1/2 w-[400px] z-50">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-gray-400">search</span>
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-full leading-5 bg-white/90 dark:bg-[#141218]/90 text-[#1a100f] dark:text-[#E6E1E5] placeholder-[#915b55]/50 focus:outline-none focus:bg-white dark:focus:bg-[#231f29] focus:ring-2 focus:ring-primary shadow-xl sm:text-sm transition-all font-bold"
                                        placeholder="Search for a city or place..."
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                                const query = e.target.value;
                                                if (!query) return;
                                                // Nominatim Search
                                                try {
                                                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                                                    const data = await res.json();
                                                    if (data && data.length > 0) {
                                                        const { lat, lon } = data[0];
                                                        map.getView().animate({
                                                            center: fromLonLat([parseFloat(lon), parseFloat(lat)]),
                                                            zoom: 12,
                                                            duration: 2000
                                                        });
                                                    } else {
                                                        alert('Place not found');
                                                    }
                                                } catch (err) {
                                                    console.error("Search error", err);
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Top Sidebar & Zoom */}
                            <div className="flex justify-between items-start mt-16">
                                {/* Search Zone Sidebar */}
                                <div className="pointer-events-auto w-80 bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/20 dark:border-white/5 animate-in slide-in-from-left-4 fade-in duration-500">
                                    <div className="p-6 flex flex-col gap-5">
                                        <div className="flex items-center justify-between border-b border-[#be3627]/10 dark:border-white/5 pb-3">
                                            <h3 className="text-[#1a100f] dark:text-[#E6E1E5] text-lg font-bold leading-tight">Search Zone</h3>
                                            <div className="px-3 py-1 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">Active</div>
                                        </div>

                                        {/* Global / Relevant Toggle */}
                                        <div className="flex bg-[#f2e9e9] dark:bg-[#231f29] p-1 rounded-xl">
                                            <button
                                                onClick={() => setFilterMode('global')}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${filterMode === 'global' ? 'bg-white dark:bg-[#2D2835] shadow-sm text-primary' : 'text-[#915b55] dark:text-[#938F99]'}`}
                                            >
                                                Global
                                            </button>
                                            <button
                                                onClick={() => setFilterMode('relevant')}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${filterMode === 'relevant' ? 'bg-white dark:bg-[#2D2835] shadow-sm text-primary' : 'text-[#915b55] dark:text-[#938F99]'}`}
                                            >
                                                Relevant
                                            </button>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="relative flex-shrink-0 size-10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-primary font-bold text-sm">Calculating...</p>
                                                <p className="text-[#5e413d] dark:text-[#CAC4D0] text-sm leading-snug font-medium">
                                                    Scanning for active users and venues within the selected range.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-1">
                                            <div className="bg-[#f2e9e9] dark:bg-[#231f29] p-3 rounded-2xl">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#915b55] dark:text-[#938F99]">Est. Users</p>
                                                <p className="text-xl font-black text-[#1a100f] dark:text-white">{nearbyUsersList.length}</p>
                                            </div>
                                            <div className="bg-[#f2e9e9] dark:bg-[#231f29] p-3 rounded-2xl">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#915b55] dark:text-[#938F99]">Density</p>
                                                <p className="text-xl font-black text-[#1a100f] dark:text-white">{nearbyUsersList.length > 10 ? 'High' : 'Low'}</p>
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
                                <div className="pointer-events-auto w-full max-w-2xl bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl shadow-2xl rounded-[28px] p-8 border border-white/20 dark:border-white/5 animate-in slide-in-from-bottom-8 fade-in duration-500">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <p className="text-[#1a100f] dark:text-white text-xl font-bold tracking-tight">Adjust Range</p>
                                                <p className="text-sm font-medium text-[#5e413d] dark:text-[#CAC4D0]">Define the radius for your connection search.</p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-primary/10 dark:bg-primary/20 px-4 py-2 rounded-2xl border border-primary/20">
                                                <span className="material-symbols-outlined text-primary text-xl">radar</span>
                                                <span className="text-primary font-mono font-black text-xl">{radius} km</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Slider */}
                                    <div className="relative w-full h-10 flex items-center mt-2">
                                        <input
                                            type="range"
                                            min="1"
                                            max="50"
                                            value={radius}
                                            onChange={(e) => setRadius(parseInt(e.target.value))}
                                            className="w-full h-2.5 bg-[#f2e9e9] dark:bg-[#231f29] rounded-full appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#915b55] dark:text-[#938F99] -mt-2">
                                        <span>1 km</span>
                                        <span>25 km</span>
                                        <span>50 km</span>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={toggleMode}
                                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold h-12 px-10 rounded-full shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 group"
                                        >
                                            <span>Confirm Selection</span>
                                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-xl">arrow_forward</span>
                                        </button>
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
                        <div className="absolute top-6 left-6 bottom-6 w-[400px] z-20 flex flex-col pointer-events-none">
                            <div className="pointer-events-auto flex flex-col h-full bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-white/5 rounded-[32px] overflow-hidden">
                                {/* Sidebar Header */}
                                <div className="px-8 pt-10 pb-6">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-2.5 text-primary bg-primary/10 px-4 py-1.5 rounded-full w-fit">
                                            <span className="material-symbols-outlined text-sm font-black">flight_land</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Arrival Active</span>
                                        </div>
                                        <button onClick={toggleMode} className="text-[#915b55] dark:text-[#938F99] hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined font-bold">close</span>
                                        </button>
                                    </div>
                                    <h2 className="text-[#1a100f] dark:text-white text-[32px] font-black leading-tight tracking-tight mb-2">
                                        {selectedUser ? selectedUser.displayName : 'Local Area'}
                                    </h2>
                                    <p className="text-[#5e413d] dark:text-[#CAC4D0] text-sm font-bold tracking-tight">Explore connections around you</p>
                                </div>

                                {/* Local Search or Action Buttons */}
                                <div className="px-8 pb-6">
                                    {!selectedUser ? (
                                        <div className="flex flex-col gap-2">
                                            {/* User Search (Existing) */}
                                            <div className="flex w-full items-center rounded-2xl bg-[#f2e9e9] dark:bg-[#231f29] h-12 shadow-sm border border-[#be3627]/5 dark:border-white/5">
                                                <div className="text-primary pl-4 flex items-center">
                                                    <span className="material-symbols-outlined text-xl">person_search</span>
                                                </div>
                                                <input
                                                    className="w-full bg-transparent border-none focus:ring-0 text-[#1a100f] dark:text-[#E6E1E5] placeholder-[#915b55]/50 text-sm h-full px-3 font-bold"
                                                    placeholder="Filter users..."
                                                // Add filtering logic here if needed
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => getDirections(selectedUser)}
                                                className="flex-1 bg-primary text-white h-12 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 flex items-center justify-center gap-2 transition-all active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">directions</span>
                                                Get Directions
                                            </button>
                                            <button
                                                onClick={() => setChatTarget(selectedUser)}
                                                className="flex-1 bg-white dark:bg-[#231f29] text-primary h-12 rounded-2xl font-bold text-sm shadow-sm border border-primary/20 hover:bg-gray-50 dark:hover:bg-[#2D2835] flex items-center justify-center gap-2 transition-all active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">chat</span>
                                                Chat
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Directions or Users List */}
                                <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar">
                                    {routeInstructions.length > 0 && selectedUser ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center px-2 mt-2 mb-1">
                                                <div className="text-[10px] font-black text-primary uppercase tracking-widest">Route Instructions</div>
                                                <button onClick={() => { setRouteInstructions([]); routeSource.clear(); }} className="text-xs font-bold text-primary hover:underline">Clear</button>
                                            </div>
                                            {routeInstructions.map((step, i) => (
                                                <div key={i} className="flex gap-4 bg-[#f2e9e9] dark:bg-[#231f29] p-4 rounded-2xl text-sm border-l-4 border-primary shadow-sm">
                                                    <span className="font-black text-primary/40">{i + 1}</span>
                                                    <span className="text-[#1a100f] dark:text-[#E6E1E5] font-bold leading-snug">{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <div className="text-[10px] font-black text-[#915b55] dark:text-[#938F99] uppercase tracking-widest px-2 mt-2 mb-1">Nearby Professionals</div>

                                            {nearbyUsersList.map(u => (
                                                <div key={u._id} onClick={() => { setSelectedUser(u); setRouteInstructions([]); routeSource.clear(); }} className={`flex items-center gap-4 bg-white dark:bg-[#141218]/40 p-3.5 rounded-[24px] shadow-sm hover:shadow-md transition-all cursor-pointer group border border-transparent ${selectedUser?._id === u._id ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/20' : 'hover:border-[#be3627]/10'}`}>
                                                    <div className="relative shrink-0">
                                                        <div
                                                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-14 ring-2 ring-white dark:ring-[#231f29] shadow-md group-hover:scale-105 transition-transform"
                                                            style={{ backgroundImage: `url(${u.profilePhoto || 'https://ui-avatars.com/api/?name=' + u.displayName})` }}
                                                        ></div>
                                                        <div className="absolute bottom-0 right-0 size-4 bg-green-500 border-2 border-white dark:border-[#141218] rounded-full shadow-sm"></div>
                                                    </div>
                                                    <div className="flex flex-col justify-center flex-1 min-w-0">
                                                        <p className="text-[#1a100f] dark:text-white text-base font-black leading-tight truncate">{u.displayName}</p>
                                                        <p className="text-[#5e413d] dark:text-[#CAC4D0] text-xs font-bold truncate mt-0.5">{u.bio || 'Kon-nect Explorer'}</p>
                                                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-wider text-primary">
                                                            <span className="material-symbols-outlined text-[14px]">near_me</span>
                                                            <span>Connect Now</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer CTA */}
                                {!selectedUser && (
                                    <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-white/50 dark:bg-white/5">
                                        <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-full transition-all shadow-lg shadow-primary/30">
                                            <span className="material-symbols-outlined text-[20px]">hub</span>
                                            Broadcast Presence
                                        </button>
                                    </div>
                                )}
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
