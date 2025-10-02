import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    staleTime: 1000 * 60 * 5, // 5 minutes :)
  });
};

export const useUserProfilePicture = (userId: string) => {
  return useQuery({
    queryKey: profileKeys.userProfilePicture(userId),
    queryFn: () => profileApi.getUserProfilePicture(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes ~
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
          } catch (error) {
            results[userId] = null;
            console.error(error);
          }
        }),
      );

      return results;
    },
    enabled: userIds.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes ^
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
    onError: (error) => {
      console.error("Failed to update profile picture:", error);
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
    onError: (error) => {
      console.error("Failed to upload profile picture:", error);
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
    onError: (error) => {
      console.error("Failed to delete profile picture:", error);
    },
  });
};
