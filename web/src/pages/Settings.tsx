import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useProfile,
  useUploadProfilePicture,
  useDeleteProfilePicture,
  useUpdateUsername,
  useUsernameAvailability,
  sanitizeUsername,
  finalizeUsername,
} from "@/hooks/useProfile";
import {
  User,
  Camera,
  Trash2,
  Upload,
  AlertCircle,
  Check,
  Pencil,
} from "lucide-react";
import { z } from "zod";

const Settings: React.FC = () => {
  const { user } = useAuth();
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile(user?.id || "");
  const uploadProfilePicture = useUploadProfilePicture();
  const deleteProfilePicture = useDeleteProfilePicture();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const updateUsername = useUpdateUsername();
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const {
    sanitized: availabilitySanitized,
    available: usernameAvailable,
    error: availabilityError,
    loading: availabilityLoading,
  } = useUsernameAvailability(usernameInput, editingUsername);

  useEffect(() => {
    if (profile?.username || user?.username) {
      setUsernameInput(profile?.username || user?.username || "");
    }
  }, [profile?.username, user?.username]);

  const usernameSchema = z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(15, "Username must be at most 15 characters")
    .regex(
      /^[a-z0-9._-]+$/,
      "Only lowercase letters, numbers, or . _ - allowed",
    );

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(null);

    const sanitized = finalizeUsername(usernameInput);
    if (sanitized !== availabilitySanitized) {
      setUsernameError("Invalid username");
      return;
    }

    const result = usernameSchema.safeParse(sanitized);
    if (!result.success) {
      setUsernameError(result.error.issues[0]?.message || "Invalid username");
      return;
    }

    if (sanitized === (profile?.username || user?.username)) {
      return;
    }

    if (availabilityError) {
      setUsernameError(availabilityError);
      return;
    }

    if (usernameAvailable === false) {
      setUsernameError("Already taken");
      return;
    }

    updateUsername.mutate(sanitized, {
      onSuccess: () => {
        setUsernameSuccess("Username updated");
        setEditingUsername(false);
        setTimeout(() => setUsernameSuccess(null), 2500);
      },
      onError: (err: unknown) => {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to update username. Try again.";
        setUsernameError(msg);
      },
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Max 5MB because I don't want to be broke bc of large files :(
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
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
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm("Are you sure you want to delete your profile picture?")
    ) {
      return;
    }

    try {
      await deleteProfilePicture.mutateAsync();
    } catch (error) {
      console.error("Failed to delete profile picture:", error);
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
            <span className="ml-2 text-neutral-600 dark:text-neutral-400">
              Loading profile...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen pt-[73px] px-3 sm:px-4">
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
  const rawSanitized = sanitizeUsername(usernameInput);
  const edgeSeparator = /^[._-]|[._-]$/.test(rawSanitized);
  const isUnchangedUsername =
    editingUsername &&
    !edgeSeparator &&
    finalizeUsername(usernameInput) ===
      (profile?.username || user?.username || "");

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

        <div className="bg-white/70 dark:bg-neutral-800/70 rounded-2xl border border-neutral-200 dark:border-neutral-600 p-4 sm:p-6 mb-6">
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
                {(profile?.username || user?.username) && (
                  <span className="block text-xs text-neutral-400 dark:text-neutral-500">
                    @{profile?.username || user?.username}
                  </span>
                )}
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
                      <span className="text-sm text-red-700 dark:text-red-300">
                        {uploadError}
                      </span>
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
                        {uploadProfilePicture.isPending
                          ? "Uploading..."
                          : "Upload"}
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
                      {deleteProfilePicture.isPending
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-neutral-800/70 rounded-2xl border border-neutral-200 dark:border-neutral-600 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
            Profile Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Name
              </label>
              <p className="text-neutral-900 dark:text-white">
                {profile?.name || user?.name}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Username
              </label>
              {!editingUsername && (
                <div className="flex items-center gap-2">
                  <p className="text-neutral-900 dark:text-white">
                    @{profile?.username || user?.username}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUsername(true);
                      setUsernameInput(
                        profile?.username || user?.username || "",
                      );
                      setUsernameError(null);
                      setUsernameSuccess(null);
                    }}
                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {usernameSuccess && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> {usernameSuccess}
                    </p>
                  )}
                </div>
              )}
              {editingUsername && (
                <form onSubmit={handleUsernameSubmit} className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        @
                      </span>
                      <div className="relative flex-1 min-w-0">
                        <input
                          type="text"
                          value={usernameInput}
                          onChange={(e) => {
                            const sanitized = sanitizeUsername(e.target.value);
                            setUsernameInput(sanitized);
                            setUsernameError(null);
                            setUsernameSuccess(null);
                          }}
                          maxLength={15}
                          className="w-full bg-white/60 dark:bg-neutral-700/60 border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-600"
                          placeholder="username"
                          autoFocus
                          inputMode="text"
                          autoComplete="off"
                          spellCheck={false}
                        />
                        <span
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums select-none"
                          aria-live="polite"
                        >
                          {usernameInput.length}/15
                        </span>
                      </div>
                      <button
                        type="submit"
                        disabled={
                          updateUsername.isPending ||
                          availabilityLoading ||
                          usernameError !== null ||
                          availabilityError !== null ||
                          usernameAvailable === false ||
                          edgeSeparator ||
                          finalizeUsername(usernameInput) ===
                            (profile?.username || user?.username)
                        }
                        className="px-4 py-2 text-sm rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {updateUsername.isPending ? "Saving..." : "Save"}
                      </button>
                    </div>
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="min-h-[18px]">
                        {(() => {
                          if (usernameError) {
                            return (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />{" "}
                                {usernameError}
                              </p>
                            );
                          }
                          if (availabilityError) {
                            return (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />{" "}
                                {availabilityError}
                              </p>
                            );
                          }
                          if (edgeSeparator) {
                            return (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Cannot start
                                or end with . _ -
                              </p>
                            );
                          }
                          if (availabilityLoading) {
                            return (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Checking...
                              </p>
                            );
                          }
                          if (isUnchangedUsername) {
                            return (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                3–15 chars. a-z 0-9 . _ -
                              </p>
                            );
                          }
                          if (
                            usernameAvailable === false &&
                            finalizeUsername(usernameInput) !==
                              (profile?.username || user?.username)
                          ) {
                            return (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Already
                                taken
                              </p>
                            );
                          }
                          if (
                            usernameAvailable &&
                            finalizeUsername(usernameInput) !==
                              (profile?.username || user?.username)
                          ) {
                            return (
                              <p className="text-xs text-green-600 flex items-center gap-1">
                                <Check className="h-3 w-3" /> Available
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUsername(false);
                          setUsernameError(null);
                          setUsernameSuccess(null);
                          setUsernameInput(
                            profile?.username || user?.username || "",
                          );
                        }}
                        className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 underline decoration-dotted underline-offset-2 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email
              </label>
              <p className="text-neutral-900 dark:text-white">
                {profile?.email || user?.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Role
              </label>
              <p className="text-neutral-900 dark:text-white">
                {profile?.isAdmin || user?.isAdmin ? "Administrator" : "User"}
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
