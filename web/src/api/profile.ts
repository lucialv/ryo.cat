export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  profilePictureUrl?: string;
  createdAt: string;
}

export interface UserProfilePicture {
  profilePictureUrl: string;
}

export interface UpdateProfilePictureRequest {
  profilePictureUrl?: string;
}

export interface UploadProfilePictureResponse {
  profilePictureUrl: string;
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/`, {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || "Failed to fetch profile");
    }

    return response.json();
  },

  getUserProfilePicture: async (userId: string): Promise<UserProfilePicture> => {
    const response = await fetch(
      `${API_BASE_URL}/v1/profile/picture/${userId}`,
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || "Failed to fetch user profile picture");
    }

    return response.json();
  },

  updateProfilePicture: async (
    data: UpdateProfilePictureRequest,
  ): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/picture/update`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || "Failed to update profile picture");
    }

    return response.json();
  },

  uploadProfilePicture: async (
    file: File,
  ): Promise<UploadProfilePictureResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/v1/profile/picture/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || "Failed to upload profile picture");
    }

    return response.json();
  },

  deleteProfilePicture: async (): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/picture/delete`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || "Failed to delete profile picture");
    }

    return response.json();
  },
};
