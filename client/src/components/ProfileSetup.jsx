import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateInterests, fetchCurrentUser } from '../store/authSlice';
import api from '../utils/api';

const ProfileSetup = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);

    const [bio, setBio] = useState('');
    const [interestInput, setInterestInput] = useState('');
    const [interests, setInterests] = useState([]);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

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

    const handleAddInterest = () => {
        if (interestInput.trim() && !interests.includes(interestInput.trim())) {
            if (interests.length >= 7) return; // Max 7
            setInterests([...interests, interestInput.trim()]);
            setInterestInput('');
        }
    };

    const handleRemoveInterest = (interest) => {
        setInterests(interests.filter(i => i !== interest));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Update Profile (Bio & Photo)
            const profileData = { bio };
            if (previewUrl) {
                profileData.profilePhoto = previewUrl; // Sending Base64
            }
            await api.post('/api/user/profile', profileData);

            // Update Interests
            if (interests.length > 0) {
                await dispatch(updateInterests(interests)).unwrap();
            }

            // Refresh User
            await dispatch(fetchCurrentUser());

            navigate('/');
        } catch (err) {
            console.error("Setup failed:", err);
            alert("Failed to save profile. Please try again.");
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

            {/* Nav */}
            <nav className="relative z-10 w-full px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary tracking-tight">KON-NECT</span>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 rounded-full bg-white/50 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 transition-colors">
                        <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">brightness_4</span>
                    </button>
                    <span className="text-sm font-medium opacity-70">Step 2 of 3</span>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <div className="w-full max-w-lg bg-white dark:bg-card-dark rounded-card shadow-2xl p-8 md:p-10 border border-white/20 dark:border-gray-700/50 transition-all duration-300">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">Complete Your Profile</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Tell us a bit about yourself to get started connecting.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Profile Picture
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer group relative overflow-hidden">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors text-3xl">add_a_photo</span>
                                    )}
                                    <input className="absolute inset-0 opacity-0 cursor-pointer" type="file" accept="image/*" onChange={handleFileChange} />
                                </div>
                                <div className="flex-1">
                                    <label className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-input font-medium text-sm text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer transition-colors" htmlFor="file-upload">
                                        Choose file
                                    </label>
                                    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                                        {profilePhoto ? profilePhoto.name : "No file chosen"}
                                    </span>
                                    <input id="file-upload" className="hidden" type="file" accept="image/*" onChange={handleFileChange} />
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200" htmlFor="bio">
                                    Bio <span className="text-primary text-xs ml-1">(Required)</span>
                                </label>
                                <span className="text-xs text-gray-400">{bio.length}/150</span>
                            </div>
                            <textarea
                                id="bio"
                                rows="3"
                                className="w-full rounded-input border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-colors"
                                placeholder="I love hiking and coding..."
                                value={bio}
                                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                                required
                            ></textarea>
                        </div>

                        {/* Interests */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200" htmlFor="interests">
                                Interests <span className="text-gray-400 font-normal text-xs ml-1">(Type & Enter, Max 7)</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="interests"
                                    type="text"
                                    className="flex-1 rounded-input border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                                    placeholder="Add interest..."
                                    value={interestInput}
                                    onChange={(e) => setInterestInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddInterest}
                                    className="px-5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-input font-medium text-primary hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors shadow-sm"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3 min-h-[40px]">
                                {interests.map((interest, idx) => (
                                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-container">
                                        {interest}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveInterest(interest)}
                                            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary hover:bg-primary/20 hover:text-primary-800 focus:outline-none"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-input shadow-lg text-sm font-bold text-white bg-primary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:scale-[1.01] active:scale-[0.99]"
                            >
                                Save & Continue
                            </button>
                        </div>
                    </form>
                </div>
                <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <a href="/" className="hover:text-primary transition-colors">Skip for now</a>
                </div>
            </main>
        </div>
    );
};

export default ProfileSetup;
