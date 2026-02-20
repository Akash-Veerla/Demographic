import React from 'react';
import MapComponent from './Map';

const MapStandalone = () => {
    return (
        <div className="flex flex-col h-full w-full relative transition-colors duration-300">
            {/* Header Optional */}
            <div className="flex-1 relative w-full">
                <div className="w-full relative overflow-hidden shadow-inner" style={{ height: 'calc(100vh - 4.5rem)' }}>
                    <MapComponent />
                </div>
            </div>
        </div>
    );
};

export default MapStandalone;
