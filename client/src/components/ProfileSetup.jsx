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
        <div className="bg-transparent text-[#1a100f] dark:text-[#E6E1E5] min-h-full relative overflow-hidden transition-colors duration-300 font-display">
            <main className="relative z-10 flex flex-col items-center justify-center py-12 p-4">
                <div className="w-full max-w-2xl bg-white/80 dark:bg-[#141218]/80 backdrop-blur-xl rounded-[28px] shadow-2xl p-8 md:p-10 border border-white/20 dark:border-white/5 transition-all duration-300">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                            <span className="material-symbols-outlined text-3xl">edit_square</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1a100f] dark:text-[#E6E1E5]">Edit Profile</h1>
                        <p className="text-[#5e413d] dark:text-[#CAC4D0] mt-2 font-medium">Update your bio and interests to connect better.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Avatar */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-32 w-32 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center border-4 border-white dark:border-[#141218] shadow-lg overflow-hidden relative group cursor-pointer transition-transform hover:scale-105">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-[#915b55] dark:text-[#CAC4D0] text-5xl">person</span>
                                )}
                                <input className="absolute inset-0 opacity-0 cursor-pointer" type="file" accept="image/*" onChange={handleFileChange} />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-[#5e413d] dark:text-[#CAC4D0]">Update Profile Photo</p>

                            {/* URL Input */}
                            <div className="w-full max-w-sm">
                                <input
                                    type="text"
                                    placeholder="Or paste an image URL..."
                                    className="w-full bg-[#f2e9e9] dark:bg-[#231f29] border-none rounded-2xl px-4 py-2.5 text-sm text-[#1a100f] dark:text-[#E6E1E5] focus:ring-2 focus:ring-primary placeholder:text-[#915b55]/50 transition-all font-medium"
                                    onChange={(e) => setPreviewUrl(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="block text-sm font-bold text-[#1a100f] dark:text-[#E6E1E5]" htmlFor="bio">
                                    Bio <span className="text-primary text-xs ml-1 font-medium">(Required)</span>
                                </label>
                                <span className="text-xs font-bold text-[#915b55] dark:text-[#938F99]">{bio.length}/150</span>
                            </div>
                            <textarea
                                id="bio"
                                rows="3"
                                className="w-full bg-[#f2e9e9] dark:bg-[#231f29] border-none rounded-2xl px-4 py-4 text-[#1a100f] dark:text-[#E6E1E5] focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#2D2835] placeholder:text-[#915b55]/50 resize-none transition-all font-medium"
                                placeholder="Tell us about yourself... ⛰️💻"
                                value={bio}
                                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                                required
                            ></textarea>
                        </div>

                        {/* Interests */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-[#1a100f] dark:text-[#E6E1E5] ml-1">
                                Your Interests
                            </label>

                            {/* Custom Interest Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customInterest}
                                    onChange={(e) => setCustomInterest(e.target.value)}
                                    placeholder="Add custom (e.g. Design)"
                                    className="flex-1 bg-[#f2e9e9] dark:bg-[#231f29] border-none rounded-2xl px-4 py-3 text-sm text-[#1a100f] dark:text-[#E6E1E5] focus:ring-2 focus:ring-primary placeholder:text-[#915b55]/50 font-medium"
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomInterest(); } }}
                                />
                                <button type="button" onClick={addCustomInterest} className="px-6 py-3 bg-primary/10 dark:bg-primary/20 text-primary rounded-2xl text-sm font-bold hover:bg-primary hover:text-white transition-all">Add</button>
                            </div>

                            <div className="flex flex-wrap gap-2.5 justify-center bg-[#f2e9e9]/50 dark:bg-[#231f29]/30 p-6 rounded-[24px] border border-dashed border-[#be3627]/20 dark:border-white/10">
                                {INTEREST_OPTIONS.map((interest) => (
                                    <button
                                        key={interest}
                                        type="button"
                                        onClick={() => toggleInterest(interest)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all transform active:scale-95 ${selectedInterests.includes(interest)
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'bg-white dark:bg-[#231f29] text-[#5e413d] dark:text-[#CAC4D0] border border-[#be3627]/10 dark:border-white/5 hover:border-primary'
                                            }`}
                                    >
                                        {interest}
                                    </button>
                                ))}
                                {selectedInterests.filter(i => !INTEREST_OPTIONS.includes(i)).map(interest => (
                                    <button
                                        key={interest}
                                        type="button"
                                        onClick={() => toggleInterest(interest)}
                                        className="px-5 py-2.5 rounded-full text-sm font-bold transition-all transform active:scale-95 bg-primary text-white shadow-lg shadow-primary/30"
                                    >
                                        {interest} <span className="ml-1 opacity-70">×</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-4 px-4 rounded-full shadow-lg shadow-primary/30 text-base font-bold text-white bg-primary hover:brightness-110 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
                            >
                                {loading ? 'Saving Profile...' : 'Save Profile Details'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ProfileSetup;
