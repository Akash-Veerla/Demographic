import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const INTEREST_OPTIONS = [
    "Technology", "Sports", "Music", "Travel", "Food", "Art",
    "Gaming", "Fitness", "Movies", "Reading", "Nature", "Photography"
];

const ProfileSetup = () => {
    const navigate = useNavigate();
    const { user, updateInterests, updateProfile, fetchCurrentUser, loading: authLoading } = useAuth();

    const [bio, setBio] = useState('');
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [customInterest, setCustomInterest] = useState(''); // For adding new ones
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    // Pre-fill data
    useEffect(() => {
        if (user) {
            if (user.bio) setBio(user.bio);
            if (user.interests) {
                // Normalize interests to strings if they are objects
                const normalized = user.interests.map(i => typeof i === 'string' ? i : i.name);
                setSelectedInterests(normalized);
            }
            if (user.profilePhoto) setPreviewUrl(user.profilePhoto);
        }
    }, [user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleInterest = (interest) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter(i => i !== interest));
        } else {
            // if (selectedInterests.length >= 10) return; 
            setSelectedInterests([...selectedInterests, interest]);
        }
    };

    const addCustomInterest = () => {
        const trimmed = customInterest.trim();
        if (!trimmed) return;
        // Check case insensitive duplicate
        const exists = selectedInterests.some(i => i.toLowerCase() === trimmed.toLowerCase());
        if (exists) {
            alert("Interest already added!");
            return;
        }
        setSelectedInterests([...selectedInterests, trimmed]);
        setCustomInterest('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedInterests.length === 0) {
            alert("Please select at least one interest.");
            return;
        }

        setLoading(true);
        try {
            // Update Profile (Bio & Photo)
            const profileData = { bio };
            if (previewUrl && previewUrl !== user?.profilePhoto) {
                profileData.profilePhoto = previewUrl; // Sending Base64
            }
            await updateProfile(profileData);

            // Update Interests
            await updateInterests(selectedInterests);

            // Refresh User
            await fetchCurrentUser();

            navigate('/');
        } catch (err) {
            console.error("Setup failed:", err);
            alert("Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-on-surface dark:text-on-surface-dark min-h-screen relative overflow-hidden transition-colors duration-300 font-display">
            {/* Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <img
                    alt="Blurred map background"
                    className="w-full h-full object-cover opacity-30 dark:opacity-20 blur-sm scale-105"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCS6GoskmyxK8SP6pZ3Wtx0NktvgHQhO_ZVdtwy--qKkYx-tovexcnp2EHy5vG0Lb8Akyc0citr1OoO4P2vs86_JBOC9Re6mw23vZ-qO-IJr4Nw83W_8r_rpIgy7OGvD88hrfvp8j3AWr16IBxXwRf03ugnhT-q6EwalUsxO7egqQoSyPmNmdVgvaaDlHOk-9CWB1NndI1GjaJo2B4Jvkg74YcnXDQv8Ge7tHaVXRgZ45dnF3oTJTDFmvgYz9U4pvGaq47-COga1mDq"
                />
                <div className="absolute inset-0 bg-background-light/40 dark:bg-background-dark/60 backdrop-blur-[2px]"></div>
            </div>

            <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <div className="w-full max-w-2xl bg-white dark:bg-card-dark rounded-card shadow-2xl p-8 md:p-10 border border-white/20 dark:border-gray-700/50 transition-all duration-300">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">Edit Profile</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Update your details and interests.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Avatar */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-28 w-28 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-4 border-white dark:border-gray-600 shadow-lg overflow-hidden relative group cursor-pointer">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-5xl">person</span>
                                )}
                                <input className="absolute inset-0 opacity-0 cursor-pointer" type="file" accept="image/*" onChange={handleFileChange} />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="material-symbols-outlined text-white">edit</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">Upload a profile photo</p>

                            {/* URL Input Toggle */}
                            <div className="w-full max-w-sm mt-2">
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Or paste an image URL..."
                                        className="flex-1 rounded-input border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2"
                                        onChange={(e) => setPreviewUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200" htmlFor="bio">
                                    Bio <span className="text-primary text-xs ml-1">(Required, Text & Emojis)</span>
                                </label>
                                <span className="text-xs text-gray-400">{bio.length}/150</span>
                            </div>
                            <textarea
                                id="bio"
                                rows="3"
                                className="w-full rounded-input border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-colors p-3"
                                placeholder="I love hiking and coding... ⛰️💻"
                                value={bio}
                                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                                required
                            ></textarea>
                        </div>

                        {/* Interests */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Select Interests
                            </label>

                            {/* Custom Interest Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customInterest}
                                    onChange={(e) => setCustomInterest(e.target.value)}
                                    placeholder="Add custom interest (e.g. Pottery)"
                                    className="flex-1 rounded-input border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomInterest(); } }}
                                />
                                <button type="button" onClick={addCustomInterest} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600">Add</button>
                            </div>

                            <div className="flex flex-wrap gap-3 justify-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                {/* Only show options that aren't already selected to avoid duplicates in view, or just show all options + selected ones */}
                                {INTEREST_OPTIONS.map((interest) => (
                                    <button
                                        key={interest}
                                        type="button"
                                        onClick={() => toggleInterest(interest)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${selectedInterests.includes(interest)
                                            ? 'bg-primary text-white shadow-md shadow-primary/30'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary'
                                            }`}
                                    >
                                        {interest}
                                    </button>
                                ))}
                                {/* Show selected custom interests that are NOT in options */}
                                {selectedInterests.filter(i => !INTEREST_OPTIONS.includes(i)).map(interest => (
                                    <button
                                        key={interest}
                                        type="button"
                                        onClick={() => toggleInterest(interest)}
                                        className="px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 bg-primary text-white shadow-md shadow-primary/30"
                                        title="Click to remove"
                                    >
                                        {interest} <span className="ml-1 opacity-70">×</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-full shadow-lg text-base font-bold text-white bg-primary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ProfileSetup;
