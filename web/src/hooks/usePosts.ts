import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { postsApi, type CreatePostRequest, type Post } from "@/api/posts";

export const postsKeys = {
  all: ["posts"] as const,
  lists: () => [...postsKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...postsKeys.lists(), { filters }] as const,
  details: () => [...postsKeys.all, "detail"] as const,
  detail: (id: string) => [...postsKeys.details(), id] as const,
  userPosts: (userId: string) => [...postsKeys.all, "user", userId] as const,
};

export const usePosts = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: postsKeys.list({ page, limit }),
    queryFn: () => postsApi.getPosts(page, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes :)
  });
};

export const useInfinitePosts = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: postsKeys.lists(),
    queryFn: ({ pageParam = 1 }) => postsApi.getPosts(pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes :)
  });
};

export const usePost = (postId: string) => {
  return useQuery({
    queryKey: postsKeys.detail(postId),
    queryFn: () => postsApi.getPost(postId),
    enabled: !!postId,
  });
};

export const useUserPosts = (userId: string, page = 1, limit = 10) => {
  return useQuery({
    queryKey: postsKeys.userPosts(userId),
    queryFn: () => postsApi.getPostsByUser(userId, page, limit),
    enabled: !!userId,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequest) => postsApi.createPost(data),
    onSuccess: (newPost: Post) => {
      queryClient.invalidateQueries({ queryKey: postsKeys.lists() });

      queryClient.setQueryData(postsKeys.detail(newPost.id), newPost);

      queryClient.setQueryData(postsKeys.lists(), (oldData: any) => {
        if (!oldData) return oldData;

        const newPages = [...oldData.pages];
        if (newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            posts: [newPost, ...newPages[0].posts],
          };
        }

        return {
          ...oldData,
          pages: newPages,
        };
      });
    },
    onError: (error) => {
      console.error("Failed to create post:", error);
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postsApi.deletePost(postId),
    onSuccess: (_, postId) => {
      queryClient.removeQueries({ queryKey: postsKeys.detail(postId) });

      queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
    },
    onError: (error) => {
      console.error("Failed to delete post:", error);
    },
  });
};

export const useUploadMedia = () => {
  return useMutation({
    mutationFn: (file: File) => postsApi.uploadMedia(file),
    onError: (error) => {
      console.error("Failed to upload media:", error);
    },
  });
};
