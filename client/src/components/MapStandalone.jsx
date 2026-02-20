import React from 'react';
import MapComponent from './Map';

const MapStandalone = () => {
    return (
        <div className="flex flex-col w-[98%] max-w-[1400px] mx-auto relative transition-colors duration-300 h-[calc(100vh-88px)] pb-6">
            <div className="w-full h-full relative overflow-hidden shadow-inner">
                <MapComponent />
            </div>
        </div>
    );
};

export default MapStandalone;
