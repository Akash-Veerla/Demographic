import React, { useState } from 'react';
import MapComponent from './Map';

const FriendRequests = () => {
    return (
        <div className="h-full w-full bg-surface-light dark:bg-surface-container-dark p-6 overflow-y-auto">
             <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline/10 dark:border-outline-dark/10">
                    <span className="material-symbols-outlined text-primary text-2xl">people</span>
                    <h2 className="text-xl font-display font-bold text-on-surface dark:text-on-surface-dark">Friend Requests</h2>
                    <span className="ml-auto bg-primary-container dark:bg-primary-container-dark text-on-primary-container dark:text-on-primary-container-dark text-xs font-bold px-2.5 py-1 rounded-full">0</span>
                </div>

                <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-surface-dark rounded-3xl border border-white/50 dark:border-white/5 shadow-sm">
                    <div className="w-20 h-20 bg-surface-container dark:bg-surface-container-light/10 rounded-full flex items-center justify-center mb-4 text-secondary dark:text-gray-500">
                        <span className="material-symbols-outlined text-4xl">mark_email_read</span>
                    </div>
                    <p className="text-secondary dark:text-gray-400 font-medium text-lg">No pending requests.</p>
                    <p className="text-sm text-secondary/70 dark:text-gray-500 mt-2 max-w-xs mx-auto">
                        Check back later or switch to the Map tab to discover people nearby!
                    </p>
                </div>
             </div>
        </div>
    );
};

const Social = () => {
    const [activeTab, setActiveTab] = useState('map');

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Tab Navigation Bar - Styled to blend with Global Nav */}
            <div className="bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-gray-800 px-4">
                <div className="max-w-7xl mx-auto flex gap-6">
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-all duration-200 flex items-center gap-2 ${
                            activeTab === 'map'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">map</span>
                        Map
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-all duration-200 flex items-center gap-2 ${
                            activeTab === 'requests'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        Friend Requests
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden">
                {activeTab === 'map' ? (
                    <MapComponent />
                ) : (
                    <FriendRequests />
                )}
            </div>
        </div>
    );
};

export default Social;
