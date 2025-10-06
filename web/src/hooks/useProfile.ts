import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import {
  profileApi,
  type UpdateProfilePictureRequest,
  type UserProfile,
} from "@/api/profile";

export const profileKeys = {
  all: ["profile"] as const,
  profile: () => [...profileKeys.all, "current"] as const,
  userProfilePicture: (userId: string) =>
    [...profileKeys.all, "picture", userId] as const,
};

export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: profileKeys.profile(),
    queryFn: profileApi.getProfile,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUserProfilePicture = (userId: string) => {
  return useQuery({
    queryKey: profileKeys.userProfilePicture(userId),
    queryFn: () => profileApi.getUserProfilePicture(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
};

export const useUsersProfilePictures = (userIds: string[]) => {
  return useQuery({
    queryKey: [...profileKeys.all, "pictures", userIds.sort()],
    queryFn: async () => {
      const results: Record<string, string | null> = {};
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const profilePicture =
              await profileApi.getUserProfilePicture(userId);
            results[userId] = profilePicture.profilePictureUrl;
          } catch {
            results[userId] = null;
          }
        }),
      );
      return results;
    },
    enabled: userIds.length > 0,
    staleTime: 1000 * 60 * 10,
  });
};

export const useUpdateProfilePicture = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfilePictureRequest) =>
      profileApi.updateProfilePicture(data),
    onSuccess: (updatedProfile: UserProfile) => {
      queryClient.setQueryData(profileKeys.profile(), updatedProfile);
      const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      if (currentUser.id === updatedProfile.id) {
        const updatedUser = {
          ...currentUser,
          profileImg: updatedProfile.profilePictureUrl,
        };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }
    },
  });
};

export const useUploadProfilePicture = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadProfilePicture(file),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.profile() });
      const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      const updatedUser = {
        ...currentUser,
        profileImg: response.profilePictureUrl,
      };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      window.location.reload();
    },
  });
};

export const useDeleteProfilePicture = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.deleteProfilePicture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.profile() });
      const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      const updatedUser = {
        ...currentUser,
        profileImg: undefined,
      };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      window.location.reload();
    },
  });
};

export const sanitizeUsername = (raw: string) => {
  if (!raw) return "";
  let s = raw.toLowerCase();
  s = s.replace(/\s+/g, "");
  s = s.replace(/[^a-z0-9._-]/g, "");
  if (s.length > 15) s = s.slice(0, 15);
  return s;
};

export const finalizeUsername = (raw: string) => {
  return sanitizeUsername(raw)
    .replace(/^[._-]+/, "")
    .replace(/[._-]+$/, "");
};

export const useUsernameAvailability = (
  value: string,
  enabled: boolean,
  delay = 400,
) => {
  const [sanitized, setSanitized] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lastChecked = useRef("");
  const baselineRef = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled) {
      setAvailable(null);
      setError(null);
      setLoading(false);
      return;
    }
    const s = finalizeUsername(value);
    if (baselineRef.current === null) {
      baselineRef.current = s;
    }
    setSanitized(s);
    if (s.length === 0) {
      setAvailable(null);
      setError(null);
      setLoading(false);
      lastChecked.current = "";
      return;
    }
    if (s === baselineRef.current) {
      setAvailable(null);
      setError(null);
      setLoading(false);
      lastChecked.current = "";
      return;
    }
    if (s.length < 3) {
      setAvailable(null);
      setError("Too short");
      setLoading(false);
      return;
    }
    setLoading(true);
    setAvailable(null);
    setError(null);
    const id = setTimeout(async () => {
      if (lastChecked.current === s) {
        setLoading(false);
        return;
      }
      try {
        const res = await profileApi.checkUsernameAvailability(s);
        lastChecked.current = res.username;
        setAvailable(res.available);
        setError(res.available ? null : "Already taken");
      } catch (e) {
        setAvailable(null);
        const msg = e instanceof Error ? e.message : "Error";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }, delay);
    return () => clearTimeout(id);
  }, [value, enabled, delay]);
  return { sanitized, available, error, loading };
};

export const useUpdateUsername = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value: string) => {
      const sanitized = finalizeUsername(value);
      if (!sanitized) {
        throw new Error("Username cannot be empty");
      }
      return profileApi.updateUsername(sanitized);
    },
    onSuccess: (updatedProfile: UserProfile) => {
      queryClient.setQueryData(profileKeys.profile(), updatedProfile);
      const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      if (currentUser.id === updatedProfile.id) {
        const updatedUser = {
          ...currentUser,
          username: updatedProfile.username,
        };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }
    },
  });
};
