import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProfile, useUploadProfilePicture, useDeleteProfilePicture } from '@/hooks/useProfile';
import { User, Camera, Trash2, Upload, AlertCircle, Check } from 'lucide-react';

const Settings: React.FC = () => {
    const { user } = useAuth();
    const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
    const uploadProfilePicture = useUploadProfilePicture();
    const deleteProfilePicture = useDeleteProfilePicture();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file');
            return;
        }

        // Max 5MB because I don't want to be broke bc of large files :(
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File size must be less than 5MB');
            return;
        }

        setSelectedFile(file);
        setUploadError(null);

        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            await uploadProfilePicture.mutateAsync(selectedFile);

            setSelectedFile(null);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'Upload failed');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete your profile picture?')) {
            return;
        }

        try {
            await deleteProfilePicture.mutateAsync();
        } catch (error) {
            console.error('Failed to delete profile picture:', error);
        }
    };

    const clearSelection = () => {
        setSelectedFile(null);
        setUploadError(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    if (profileLoading) {
        return (
            <div className="min-h-screen pt-[73px] px-4">
                <div className="max-w-2xl mx-auto py-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <span className="ml-2 text-neutral-600 dark:text-neutral-400">Loading profile...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (profileError) {
        return (
            <div className="min-h-screen pt-[73px] px-4">
                <div className="max-w-2xl mx-auto py-8">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-red-700 dark:text-red-300">
                                Failed to load profile: {profileError.message}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentProfilePicture = profile?.profilePictureUrl || user?.profileImg;

    return (
        <div className="min-h-screen pt-[73px] px-4">
            <div className="max-w-2xl mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                        Settings
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400">
                        Manage your profile and preferences
                    </p>
                </div>

                <div className="bg-white/70 dark:bg-neutral-800/70 rounded-2xl border border-neutral-200 dark:border-neutral-600 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Profile Picture
                    </h2>

                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                {currentProfilePicture ? (
                                    <img
                                        src={previewUrl || currentProfilePicture}
                                        alt="Profile"
                                        className="h-24 w-24 rounded-full object-cover border-4 border-neutral-200 dark:border-neutral-600"
                                    />
                                ) : (
                                    <div className="h-24 w-24 rounded-full bg-purple-100 dark:bg-purple-900 border-4 border-neutral-200 dark:border-neutral-600 flex items-center justify-center">
                                        <User className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                    </div>
                                )}

                                {previewUrl && (
                                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                                        <Check className="h-3 w-3 text-white" />
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                                {profile?.name || user?.name}
                            </p>
                        </div>

                        <div className="flex-1">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Choose new profile picture
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="block w-full text-sm text-neutral-500 dark:text-neutral-400
                             file:mr-4 file:py-2 file:px-4
                             file:rounded-full file:border-0
                             file:text-sm file:font-semibold
                             file:bg-purple-50 file:text-purple-700
                             hover:file:bg-purple-100 dark:file:bg-purple-900 dark:file:text-purple-300
                             dark:hover:file:bg-purple-800"
                                    />
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                        PNG, JPG, GIF up to 5MB
                                    </p>
                                </div>

                                {uploadError && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                        <div className="flex items-center">
                                            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                                            <span className="text-sm text-red-700 dark:text-red-300">{uploadError}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    {selectedFile && (
                                        <>
                                            <button
                                                onClick={handleUpload}
                                                disabled={uploadProfilePicture.isPending}
                                                className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {uploadProfilePicture.isPending ? (
                                                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Camera className="h-4 w-4 mr-2" />
                                                )}
                                                {uploadProfilePicture.isPending ? 'Uploading...' : 'Upload'}
                                            </button>

                                            <button
                                                onClick={clearSelection}
                                                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}

                                    {currentProfilePicture && !selectedFile && (
                                        <button
                                            onClick={handleDelete}
                                            disabled={deleteProfilePicture.isPending}
                                            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            {deleteProfilePicture.isPending ? 'Deleting...' : 'Delete'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-neutral-800/70 rounded-2xl border border-neutral-200 dark:border-neutral-600 p-6">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                        Profile Information
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Name
                            </label>
                            <p className="text-neutral-900 dark:text-white">{profile?.name || user?.name}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Email
                            </label>
                            <p className="text-neutral-900 dark:text-white">{profile?.email || user?.email}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Role
                            </label>
                            <p className="text-neutral-900 dark:text-white">
                                {(profile?.isAdmin || user?.isAdmin) ? 'Administrator' : 'User'}
                            </p>
                        </div>

                        {profile?.createdAt && (
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Member Since
                                </label>
                                <p className="text-neutral-900 dark:text-white">
                                    {new Date(profile.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
