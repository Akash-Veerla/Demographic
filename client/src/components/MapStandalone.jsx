import React from 'react';
import MapComponent from './Map';

const MapStandalone = () => {
    return (
        <div className="flex flex-col h-full w-[98%] max-w-[1400px] mx-auto relative transition-colors duration-300">
            <div className="flex-1 relative w-full h-[calc(100dvh-5rem)] pb-4">
                <div className="w-full h-full relative overflow-hidden shadow-inner">
                    <MapComponent />
                </div>
            </div>
        </div>
    );
};

export default MapStandalone;
