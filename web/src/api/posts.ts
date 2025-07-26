export interface Post {
  id: string;
  userId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    profilePictureUrl?: string;
  };
  media: PostMedia[];
  likeCount: number;
  isLikedByMe: boolean;
}

export interface PostMedia {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface CreatePostRequest {
  body: string;
  media?: {
    fileKey: string;
    mediaType: "image" | "video";
    mimeType: string;
    fileSize: number;
  }[];
}

export interface PostsListResponse {
  posts: Post[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UploadMediaResponse {
  fileKey: string;
  mediaType: "image" | "video";
  mimeType: string;
  fileSize: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const postsApi = {
  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const response = await fetch(`${API_BASE_URL}/v1/posts`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || "Failed to create post");
    }

    return response.json();
  },

  getPosts: async (page = 1, limit = 10): Promise<PostsListResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/v1/posts?page=${page}&limit=${limit}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || "Failed to fetch posts");
    }

    return response.json();
  },

  getPost: async (postId: string): Promise<Post> => {
    const response = await fetch(`${API_BASE_URL}/v1/posts/${postId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || "Failed to fetch post");
    }

    return response.json();
  },

  getPostsByUser: async (
    userId: string,
    page = 1,
    limit = 10
  ): Promise<PostsListResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/v1/posts/user/${userId}?page=${page}&limit=${limit}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || "Failed to fetch user posts");
    }

    return response.json();
  },

  deletePost: async (postId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/v1/posts/${postId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || "Failed to delete post");
    }
  },

  uploadMedia: async (file: File): Promise<UploadMediaResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/v1/posts/media/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || "Failed to upload media");
    }

    return response.json();
  },

  toggleLike: async (
    postId: string
  ): Promise<{ isLiked: boolean; likeCount: number }> => {
    const response = await fetch(`${API_BASE_URL}/v1/posts/${postId}/like`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || "Failed to toggle like");
    }

    return response.json();
  },
};
