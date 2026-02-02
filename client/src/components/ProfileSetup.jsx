import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateInterests, fetchCurrentUser } from '../store/authSlice';
import api from '../utils/api';

const INTEREST_OPTIONS = [
    "Technology", "Sports", "Music", "Travel", "Food", "Art",
    "Gaming", "Fitness", "Movies", "Reading", "Nature", "Photography"
];

const ProfileSetup = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);

    const [bio, setBio] = useState('');
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);

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
            if (selectedInterests.length >= 5) return; // Limit logic if needed, but 12 is small set
            setSelectedInterests([...selectedInterests, interest]);
        }
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
            if (previewUrl) {
                profileData.profilePhoto = previewUrl; // Sending Base64 for now
            }
            await api.post('/api/user/profile', profileData);

            // Update Interests
            await dispatch(updateInterests(selectedInterests)).unwrap();

            // Refresh User
            await dispatch(fetchCurrentUser());

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

            <nav className="relative z-10 w-full px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary tracking-tight">KON-NECT</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium opacity-70">Final Step</span>
                </div>
            </nav>

            <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <div className="w-full max-w-2xl bg-white dark:bg-card-dark rounded-card shadow-2xl p-8 md:p-10 border border-white/20 dark:border-gray-700/50 transition-all duration-300">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">Complete Your Profile</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Tell us a bit about yourself to get started connecting.</p>
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
                                Select Interests <span className="text-gray-400 font-normal text-xs ml-1">(Select at least one)</span>
                            </label>
                            <div className="flex flex-wrap gap-3 justify-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                {INTEREST_OPTIONS.map((interest) => (
                                    <button
                                        key={interest}
                                        type="button"
                                        onClick={() => toggleInterest(interest)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                                            selectedInterests.includes(interest)
                                                ? 'bg-primary text-white shadow-md shadow-primary/30'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary'
                                        }`}
                                    >
                                        {interest}
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
                                {loading ? 'Saving Profile...' : 'Finish Setup'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ProfileSetup;
