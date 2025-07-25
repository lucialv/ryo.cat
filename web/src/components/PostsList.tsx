import React, { useEffect, useRef, useCallback } from 'react';
import { useInfinitePosts } from '@/hooks/usePosts';
import PostCard from './PostCard';
import { Loader2, AlertCircle, FileText } from 'lucide-react';

const PostsList: React.FC = () => {
    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfinitePosts(10);

    const loadMoreRef = useRef<HTMLDivElement>(null);

    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const [target] = entries;
        if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    useEffect(() => {
        const element = loadMoreRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(handleObserver, {
            threshold: 0.1,
            rootMargin: '100px',
        });

        observer.observe(element);

        return () => observer.disconnect();
    }, [handleObserver]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <span className="ml-2 text-neutral-600 dark:text-neutral-400">Loading posts...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Failed to load posts
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    {error instanceof Error ? error.message : 'Something went wrong'}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const posts = data?.pages.flatMap(page => page.posts) ?? [];

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-neutral-500 dark:text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    No posts yet
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                    Be the first to share what Ryo is up to!
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl mx-auto">
            {posts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}

            {hasNextPage && (
                <div
                    ref={loadMoreRef}
                    className="flex justify-center items-center py-8"
                >
                    {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-purple-500">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="text-sm font-medium">Loading more posts...</span>
                        </div>
                    )}
                </div>
            )}

            {!hasNextPage && posts.length > 0 && (
                <div className="text-center py-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                        <span>🎉</span>
                        <span>You've reached the end!</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostsList;
