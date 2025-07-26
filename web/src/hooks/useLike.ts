import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postsApi } from "@/api/posts";
import { postsKeys } from "./usePosts";
import type { Post } from "@/api/posts";

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postsApi.toggleLike,
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: postsKeys.lists() });
      await queryClient.cancelQueries({ queryKey: postsKeys.detail(postId) });

      const previousPostsPages = queryClient.getQueryData(postsKeys.lists());
      const previousPost = queryClient.getQueryData(postsKeys.detail(postId));

      queryClient.setQueryData(postsKeys.lists(), (old: any) => {
        if (!old?.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) => {
              if (post.id === postId) {
                const newIsLikedByMe = !post.isLikedByMe;
                const newLikeCount = newIsLikedByMe
                  ? post.likeCount + 1
                  : Math.max(0, post.likeCount - 1);

                return {
                  ...post,
                  isLikedByMe: newIsLikedByMe,
                  likeCount: newLikeCount,
                };
              }
              return post;
            }),
          })),
        };
      });

      queryClient.setQueryData(
        postsKeys.detail(postId),
        (old: Post | undefined) => {
          if (!old) return old;

          const newIsLikedByMe = !old.isLikedByMe;
          const newLikeCount = newIsLikedByMe
            ? old.likeCount + 1
            : Math.max(0, old.likeCount - 1);

          return {
            ...old,
            isLikedByMe: newIsLikedByMe,
            likeCount: newLikeCount,
          };
        }
      );

      return { previousPostsPages, previousPost, postId };
    },
    onError: (_, _postId, context) => {
      if (context?.previousPostsPages) {
        queryClient.setQueryData(postsKeys.lists(), context.previousPostsPages);
      }
      if (context?.previousPost) {
        queryClient.setQueryData(
          postsKeys.detail(context.postId),
          context.previousPost
        );
      }
    },
    onSuccess: (data, postId) => {
      queryClient.setQueryData(postsKeys.lists(), (old: any) => {
        if (!old?.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  isLikedByMe: data.isLiked,
                  likeCount: data.likeCount,
                };
              }
              return post;
            }),
          })),
        };
      });

      queryClient.setQueryData(
        postsKeys.detail(postId),
        (old: Post | undefined) => {
          if (!old) return old;
          return {
            ...old,
            isLikedByMe: data.isLiked,
            likeCount: data.likeCount,
          };
        }
      );
    },
    onSettled: (_, __, postId) => {
      queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postsKeys.detail(postId) });
    },
  });
};
