const API_BASE_URL = import.meta.env.VITE_API_URL;

export const authApi = {
  logout: async (): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/v1/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || "Failed to logout");
    }

    return response.json();
  },
};
