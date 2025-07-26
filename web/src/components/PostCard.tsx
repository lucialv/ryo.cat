import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDeletePost } from '@/hooks/usePosts';
import { useLikePost } from '@/hooks/useLike';
import { Trash2, User, Play, Heart } from 'lucide-react';
import type { Post } from '@/api/posts';
import MediaViewer from './MediaViewer';

interface PostCardProps {
    post: Post;
}

const formatTimeAgo = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

        return date.toLocaleDateString();
    } catch {
        return 'Unknown time';
    }
};

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const { user } = useAuth();
    const deletePostMutation = useDeletePost();
    const likeMutation = useLikePost();
    const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const canDelete = user?.isAdmin || user?.id === post.userId;

    // AI Generated CSS for video controls because yeah
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .post-preview-video {
                background: #000 !important;
                transition: opacity 0.2s ease-in-out;
            }
            
            .post-preview-video:hover {
                opacity: 0.95;
            }
            
            /* Hide all video controls completely */
            .post-preview-video::-webkit-media-controls {
                display: none !important;
                -webkit-appearance: none !important;
            }
            
            .post-preview-video::-webkit-media-controls-panel {
                display: none !important;
                -webkit-appearance: none !important;
            }
            
            .post-preview-video::-webkit-media-controls-play-button {
                display: none !important;
                -webkit-appearance: none !important;
            }
            
            .post-preview-video::-webkit-media-controls-start-playback-button {
                display: none !important;
                -webkit-appearance: none !important;
            }
            
            .post-preview-video::-webkit-media-controls-timeline {
                display: none !important;
                -webkit-appearance: none !important;
            }
            
            .post-preview-video::-webkit-media-controls-current-time-display {
                display: none !important;
                -webkit-appearance: none !important;
            }
            
            .post-preview-video::-webkit-media-controls-time-remaining-display {
                display: none !important;
                -webkit-appearance: none !important;
            }
            
            .post-preview-video::-webkit-media-controls-mute-button {
                display: none !important;
                -webkit-appearance: none !important;
            }
            
            .post-preview-video::-webkit-media-controls-volume-slider {
                display: none !important;
                -webkit-appearance: none !important;
            }
            
            .post-preview-video::-webkit-media-controls-fullscreen-button {
                display: none !important;
                -webkit-appearance: none !important;
            }
            
            /* Firefox controls */
            .post-preview-video::-moz-media-controls {
                display: none !important;
            }
            
            /* IE/Edge controls */
            .post-preview-video::-ms-media-controls {
                display: none !important;
            }
            
            /* Additional control hiding */
            .post-preview-video[controls] {
                controls: none !important;
            }
            
            /* Play button overlay styling */
            .video-play-overlay {
                transition: all 0.2s ease-in-out;
                backdrop-filter: blur(1px);
            }
            
            .video-play-button {
                transition: all 0.2s ease-in-out;
                backdrop-filter: blur(2px);
            }
            
            .group:hover .video-play-overlay {
                background-color: rgba(0, 0, 0, 0.4);
            }
            
            .group:hover .video-play-button {
                transform: scale(1.1);
                background-color: rgba(0, 0, 0, 0.7);
            }

            /* Like button animations */
            @keyframes heartBeat {
                0% { transform: scale(1); }
                50% { transform: scale(1.3); }
                100% { transform: scale(1); }
            }

            .heart-animation {
                animation: heartBeat 0.6s ease-in-out;
            }

            .like-count-change {
                animation: pulse 0.3s ease-in-out;
            }

            @keyframes likeSuccess {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }

            .like-success {
                animation: likeSuccess 0.4s ease-in-out;
            }
        `;
        document.head.appendChild(style);

        return () => {
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
    }, []);

    const openMediaViewer = (index: number) => {
        setSelectedMediaIndex(index);
        setMediaViewerOpen(true);
    };

    const closeMediaViewer = () => {
        setMediaViewerOpen(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            await deletePostMutation.mutateAsync(post.id);
        } catch (error) {
            console.error('Failed to delete post:', error);
            alert('Failed to delete post. Please try again.');
        }
    };

    const handleLike = async () => {
        if (!user) {
            alert('Please log in to like posts');
            return;
        }

        try {
            setIsAnimating(true);
            await likeMutation.mutateAsync(post.id);

            setTimeout(() => {
                setIsAnimating(false);
            }, 600);
        } catch (error) {
            console.error('Failed to toggle like:', error);
            setIsAnimating(false);
        }
    };

    const formatDate = (dateString: string) => {
        return formatTimeAgo(dateString);
    };

    const handleVideoHover = (e: React.MouseEvent<HTMLVideoElement>, isEntering: boolean) => {
        const video = e.target as HTMLVideoElement;

        if (isEntering) {
            if (video.paused && video.currentTime < video.duration) {
                video.play().catch(() => { });
            }
        } else {
            video.pause();
            video.currentTime = 0;
        }
    };

    const handleVideoRef = (video: HTMLVideoElement | null) => {
        if (!video) return;

        video.controls = false;
        video.disablePictureInPicture = true;
        video.playsInline = true;
        video.muted = true;
        video.preload = 'metadata';

        video.oncontextmenu = (e) => e.preventDefault();

        video.onended = () => {
            video.currentTime = 0;
            video.pause();
        };

        video.onerror = () => {
            console.warn('Video failed to load:', video.src);
        };

        video.onfocus = () => video.blur();

        video.pause();
        video.currentTime = 0;
    };

    return (
        <div className="bg-white/70 dark:bg-neutral-800/70 rounded-2xl border border-neutral-200 dark:border-neutral-600 p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {post.user.profilePictureUrl ? (
                        <img
                            src={post.user.profilePictureUrl}
                            alt={`${post.user.name}'s profile`}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="h-10 w-10 bg-purple-500 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                        </div>
                    )}
                    <div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">
                            {post.user.name}
                            {post.user.isAdmin && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-full items-center inline-flex gap-1">
                                    <Heart className='h-4 w-4 text-purple-700 dark:text-purple-200 fill-purple-700 dark:fill-purple-200' />
                                    Owner
                                </span>
                            )}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {formatDate(post.createdAt)}
                        </p>
                    </div>
                </div>

                {canDelete && (
                    <button
                        onClick={handleDelete}
                        disabled={deletePostMutation.isPending}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors disabled:opacity-50"
                        title="Delete post"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            <div className="mb-4">
                <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                    {post.body}
                </p>
            </div>

            {post.media && post.media.length > 0 && (
                <div className="mb-4 -mx-6">
                    {post.media.length === 1 ? (
                        <div
                            className="relative cursor-pointer group"
                            onClick={() => openMediaViewer(0)}
                        >
                            {post.media[0].mediaType === 'image' ? (
                                <img
                                    src={post.media[0].mediaUrl}
                                    alt="Post media"
                                    className="w-full aspect-square object-cover hover:opacity-95 transition-opacity"
                                />
                            ) : (
                                <div className="relative">
                                    <video
                                        ref={handleVideoRef}
                                        src={post.media[0].mediaUrl}
                                        className="post-preview-video w-full aspect-square object-cover"
                                        muted
                                        playsInline
                                        preload="metadata"
                                        disablePictureInPicture
                                        onMouseEnter={(e) => handleVideoHover(e, true)}
                                        onMouseLeave={(e) => handleVideoHover(e, false)}
                                    />
                                    <div className="video-play-overlay absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                        <div className="video-play-button w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                                            <Play size={24} className="text-white ml-1" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : post.media.length === 2 ? (
                        <div className="grid grid-cols-2 gap-0.5">
                            {post.media.map((media, index) => (
                                <div
                                    key={media.id}
                                    className="relative cursor-pointer group aspect-square"
                                    onClick={() => openMediaViewer(index)}
                                >
                                    {media.mediaType === 'image' ? (
                                        <img
                                            src={media.mediaUrl}
                                            alt={`Media ${index + 1}`}
                                            className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                                        />
                                    ) : (
                                        <div className="relative w-full h-full">
                                            <video
                                                ref={handleVideoRef}
                                                src={media.mediaUrl}
                                                className="post-preview-video w-full h-full object-cover"
                                                muted
                                                playsInline
                                                preload="metadata"
                                                disablePictureInPicture
                                                onMouseEnter={(e) => handleVideoHover(e, true)}
                                                onMouseLeave={(e) => handleVideoHover(e, false)}
                                            />
                                            <div className="video-play-overlay absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                                <div className="video-play-button w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                                                    <Play size={16} className="text-white ml-0.5" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-0.5 aspect-square">
                            <div
                                className="relative cursor-pointer group row-span-2"
                                onClick={() => openMediaViewer(0)}
                            >
                                {post.media[0].mediaType === 'image' ? (
                                    <img
                                        src={post.media[0].mediaUrl}
                                        alt="Media 1"
                                        className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                                    />
                                ) : (
                                    <div className="relative w-full h-full">
                                        <video
                                            ref={handleVideoRef}
                                            src={post.media[0].mediaUrl}
                                            className="post-preview-video w-full h-full object-cover"
                                            muted
                                            playsInline
                                            preload="metadata"
                                            disablePictureInPicture
                                            onMouseEnter={(e) => handleVideoHover(e, true)}
                                            onMouseLeave={(e) => handleVideoHover(e, false)}
                                        />
                                        <div className="video-play-overlay absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                            <div className="video-play-button w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                                                <Play size={24} className="text-white ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div
                                className="relative cursor-pointer group"
                                onClick={() => openMediaViewer(1)}
                            >
                                {post.media[1].mediaType === 'image' ? (
                                    <img
                                        src={post.media[1].mediaUrl}
                                        alt="Media 2"
                                        className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                                    />
                                ) : (
                                    <div className="relative w-full h-full">
                                        <video
                                            ref={handleVideoRef}
                                            src={post.media[1].mediaUrl}
                                            className="post-preview-video w-full h-full object-cover"
                                            muted
                                            playsInline
                                            preload="metadata"
                                            disablePictureInPicture
                                            onMouseEnter={(e) => handleVideoHover(e, true)}
                                            onMouseLeave={(e) => handleVideoHover(e, false)}
                                        />
                                        <div className="video-play-overlay absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                            <div className="video-play-button w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                                                <Play size={16} className="text-white ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div
                                className="relative cursor-pointer group"
                                onClick={() => openMediaViewer(2)}
                            >
                                {post.media[2].mediaType === 'image' ? (
                                    <img
                                        src={post.media[2].mediaUrl}
                                        alt="Media 3"
                                        className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                                    />
                                ) : (
                                    <div className="relative w-full h-full">
                                        <video
                                            ref={handleVideoRef}
                                            src={post.media[2].mediaUrl}
                                            className="post-preview-video w-full h-full object-cover"
                                            muted
                                            playsInline
                                            preload="metadata"
                                            disablePictureInPicture
                                            onMouseEnter={(e) => handleVideoHover(e, true)}
                                            onMouseLeave={(e) => handleVideoHover(e, false)}
                                        />
                                        <div className="video-play-overlay absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                            <div className="video-play-button w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                                                <Play size={16} className="text-white ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {post.media.length > 3 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/60 transition-colors">
                                        <span className="text-white text-2xl font-bold">
                                            +{post.media.length - 3}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <MediaViewer
                media={post.media}
                initialIndex={selectedMediaIndex}
                isOpen={mediaViewerOpen}
                onClose={closeMediaViewer}
            />

            <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-600">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLike}
                        disabled={likeMutation.isPending || !user}
                        className={`group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${post.isLikedByMe
                                ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                        title={user ? (post.isLikedByMe ? 'Unlike' : 'Like') : 'Login to like posts'}
                    >
                        <Heart
                            size={18}
                            className={`transition-all duration-200 ${post.isLikedByMe
                                    ? 'fill-red-500 text-red-500 scale-110'
                                    : 'group-hover:scale-110 group-active:scale-125'
                                } ${likeMutation.isPending ? 'animate-pulse' : ''} ${isAnimating ? 'heart-animation' : ''
                                }`}
                        />
                        <span className={`text-sm font-medium transition-all duration-200 ${post.isLikedByMe ? 'text-red-500' : ''
                            } ${isAnimating ? 'like-count-change' : ''}`}>
                            {post.likeCount}
                        </span>
                    </button>

                    {post.media && post.media.length > 0 && (
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {post.media.length} media file{post.media.length > 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                <div className="text-xs text-neutral-400 dark:text-neutral-500">
                    Post ID: {post.id.slice(0, 8)}...
                </div>
            </div>
        </div>
    );
};

export default PostCard;
