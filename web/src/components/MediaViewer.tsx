import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize,
  ExternalLink,
} from "lucide-react";
import type { PostMedia } from "@/api/posts";

interface MediaViewerProps {
  media: PostMedia[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  media,
  initialIndex,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          if (isFullscreen && document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            onClose();
          }
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case " ":
          e.preventDefault();
          togglePlay();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      setShowControls(true);

      if (isNowFullscreen) {
        if (controlsTimeout) {
          clearTimeout(controlsTimeout);
        }
        setControlsTimeout(null);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [controlsTimeout]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !media.length) return;

    const handleResize = () => {
      const video = document.querySelector(
        ".media-viewer-video",
      ) as HTMLVideoElement;
      if (video && media[currentIndex]?.mediaType === "video") {
        const event = new Event("loadedmetadata");
        video.dispatchEvent(event);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, currentIndex, media]);

  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const handleOpenInNewTab = () => {
    const currentMedia = media[currentIndex];
    window.open(currentMedia.mediaUrl, "_blank");
  };

  const handleDownload = async () => {
    const currentMedia = media[currentIndex];
    setIsDownloading(true);

    try {
      const backendUrl = `${import.meta.env.VITE_API_URL}/v1/posts/media/${currentMedia.id}/download`;

      const response = await fetch(backendUrl, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();

      const contentDisposition = response.headers.get("content-disposition");
      let filename = `ryo-media-${currentMedia.id}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      } else {
        const timestamp = new Date().toISOString().slice(0, 10);
        const extension =
          currentMedia.mediaType === "video"
            ? ".mp4"
            : currentMedia.mimeType?.includes("png")
              ? ".png"
              : currentMedia.mimeType?.includes("gif")
                ? ".gif"
                : ".jpg";
        filename = `ryo-media-${timestamp}-${currentMedia.id.slice(0, 8)}${extension}`;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(currentMedia.mediaUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * videoRef.current.duration;
    }
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newVolume = Math.max(0, Math.min(1, percent));
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    if (!isFullscreen) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(timeout);
    }
  };

  const VideoControls = ({
    className = "custom-video-controls",
  }: {
    className?: string;
  }) => (
    <div className={className}>
      <div className="progress-bar" onClick={handleProgressClick}>
        <div
          className="progress-bar-fill"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        <div
          className="progress-bar-handle"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="control-button w-10 h-10" onClick={togglePlay}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button className="control-button w-10 h-10" onClick={toggleMute}>
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          <div className="volume-slider" onClick={handleVolumeChange}>
            <div
              className="volume-slider-fill"
              style={{ width: `${isMuted ? 0 : volume * 100}%` }}
            />
          </div>

          <span className="text-white text-sm ml-4">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="control-button w-10 h-10"
            onClick={() => {
              if (isFullscreen) {
                document.exitFullscreen();
              } else {
                videoRef.current?.requestFullscreen();
              }
            }}
          >
            <Maximize size={20} />
          </button>

          {isFullscreen && (
            <button
              className="control-button w-10 h-10"
              onClick={() => document.exitFullscreen()}
              title="Exit fullscreen"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen || !media.length) return null;

  const currentMedia = media[currentIndex];

  return (
    <>
      {/* Modern Video Player Styling - Hide all default controls - AI GENERATED because yeah a lot of shit */}
      <style>
        {`
          .media-viewer-video {
            border-radius: 16px !important;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8) !important;
            background: #000 !important;
          }

          /* Completely hide all default video controls */
          .media-viewer-video::-webkit-media-controls {
            display: none !important;
            -webkit-appearance: none !important;
          }

          .media-viewer-video::-webkit-media-controls-panel {
            display: none !important;
          }

          .media-viewer-video::-webkit-media-controls-play-button {
            display: none !important;
          }

          .media-viewer-video::-webkit-media-controls-start-playback-button {
            display: none !important;
          }

          .media-viewer-video::-webkit-media-controls-timeline {
            display: none !important;
          }

          .media-viewer-video::-webkit-media-controls-current-time-display {
            display: none !important;
          }

          .media-viewer-video::-webkit-media-controls-time-remaining-display {
            display: none !important;
          }

          .media-viewer-video::-webkit-media-controls-mute-button {
            display: none !important;
          }

          .media-viewer-video::-webkit-media-controls-volume-slider {
            display: none !important;
          }

          .media-viewer-video::-webkit-media-controls-fullscreen-button {
            display: none !important;
          }

          .media-viewer-video::-webkit-media-controls-enclosure {
            display: none !important;
          }

          /* Firefox controls */
          .media-viewer-video::-moz-media-controls {
            display: none !important;
          }

          /* IE/Edge controls */
          .media-viewer-video::-ms-media-controls {
            display: none !important;
          }

          /* Additional control hiding */
          .media-viewer-video[controls] {
            controls: none !important;
          }

          /* Enhanced video container */
          .media-viewer-video {
            display: block !important;
            object-fit: contain !important;
            border: 2px solid rgba(255, 255, 255, 0.1) !important;
          }

          /* Remove any hover effects that might interfere */
          .media-viewer-video:hover {
            opacity: 1 !important;
            transform: none !important;
          }

          /* Custom loading state */
          .media-viewer-video[data-loading="true"] {
            background: linear-gradient(45deg, #1a1a1a, #2a2a2a) !important;
            background-size: 400% 400% !important;
            animation: shimmer 2s ease-in-out infinite !important;
          }

          @keyframes shimmer {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          /* Video container improvements */
          .video-container-modern {
            position: relative;
            border-radius: 16px;
            overflow: hidden;
            background: #000;
            box-shadow:
              0 25px 50px rgba(0, 0, 0, 0.8),
              0 0 0 1px rgba(255, 255, 255, 0.1);
            display: inline-block;
          }

          .video-container-modern::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 25%,
              transparent 75%,
              rgba(255, 255, 255, 0.05) 100%);
            pointer-events: none;
            z-index: 1;
            border-radius: 16px;
          }

          /* Custom controls styling */
          .custom-video-controls {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top,
              rgba(0, 0, 0, 0.9) 0%,
              rgba(0, 0, 0, 0.7) 50%,
              transparent 100%);
            backdrop-filter: blur(15px);
            padding: 20px;
            border-radius: 0 0 16px 16px;
            z-index: 10;
            transition: opacity 0.3s ease;
          }

          /* Fullscreen controls */
          .fullscreen-controls {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            background: linear-gradient(to top,
              rgba(0, 0, 0, 0.95) 0%,
              rgba(0, 0, 0, 0.8) 50%,
              transparent 100%) !important;
            backdrop-filter: blur(20px) !important;
            padding: 25px !important;
            border-radius: 0 !important;
            z-index: 2147483647 !important;
            width: 100vw !important;
            box-sizing: border-box !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: all !important;
          }

          .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            margin-bottom: 15px;
            cursor: pointer;
            position: relative;
          }

          .progress-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #ffffff, #f0f0f0);
            border-radius: 3px;
            transition: width 0.1s ease;
          }

          .progress-bar-handle {
            position: absolute;
            top: -6px;
            width: 18px;
            height: 18px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease;
          }

          .progress-bar-handle:hover {
            transform: scale(1.2);
          }

          .control-button {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 8px;
            color: white;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .control-button:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.05);
          }

          .volume-slider {
            width: 80px;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            cursor: pointer;
            position: relative;
          }

          .volume-slider-fill {
            height: 100%;
            background: white;
            border-radius: 2px;
            transition: width 0.1s ease;
          }
        `}
      </style>

      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-4">
            <span className="text-white text-sm font-semibold bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
              {currentIndex + 1} / {media.length}
            </span>
            {currentMedia.mediaType === "video" && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 text-white hover:bg-white/20 rounded-full transition-all duration-200 bg-black/40 backdrop-blur-md border border-white/10 hover:scale-105"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenInNewTab}
              className="hidden sm:flex p-3 text-white hover:bg-white/20 rounded-full transition-all duration-200 bg-black/40 backdrop-blur-md border border-white/10 hover:scale-105"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="hidden sm:flex p-3 text-white hover:bg-white/20 rounded-full transition-all duration-200 bg-black/40 backdrop-blur-md border border-white/10 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              title={isDownloading ? "Downloading..." : "Download"}
            >
              {isDownloading ? (
                <div className="animate-spin">
                  <Download size={20} />
                </div>
              ) : (
                <Download size={20} />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-3 text-white hover:bg-white/20 rounded-full transition-all duration-200 bg-black/40 backdrop-blur-md border border-white/10 hover:scale-105"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {media.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-10 p-4 sm:p-5 text-white hover:bg-white/20 rounded-full transition-all duration-200 bg-black/40 backdrop-blur-md border border-white/10 hover:scale-110"
              title="Previous"
            >
              <ChevronLeft size={32} className="sm:w-9 sm:h-9" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-10 p-4 sm:p-5 text-white hover:bg-white/20 rounded-full transition-all duration-200 bg-black/40 backdrop-blur-md border border-white/10 hover:scale-110"
              title="Next"
            >
              <ChevronRight size={32} className="sm:w-9 sm:h-9" />
            </button>
          </>
        )}

        <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
          {currentMedia.mediaType === "image" ? (
            <img
              src={currentMedia.mediaUrl}
              alt={`Media ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="video-container-modern relative max-w-full max-h-full"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => !isFullscreen && setShowControls(false)}
              >
                <video
                  ref={videoRef}
                  src={currentMedia.mediaUrl}
                  autoPlay
                  muted={isMuted}
                  className="media-viewer-video"
                  style={{
                    width: "auto",
                    height: "auto",
                    maxWidth: "95vw",
                    maxHeight: "90vh",
                    minWidth: "320px",
                    minHeight: "240px",
                  }}
                  onClick={togglePlay}
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    video.removeAttribute("data-loading");
                    setDuration(video.duration);
                    setIsPlaying(!video.paused);

                    const aspectRatio = video.videoWidth / video.videoHeight;
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;

                    const availableWidth = viewportWidth * 0.95;
                    const availableHeight = viewportHeight * 0.9 - 140;

                    let finalWidth, finalHeight;

                    if (aspectRatio > availableWidth / availableHeight) {
                      finalWidth = Math.min(availableWidth, 1400);
                      finalHeight = finalWidth / aspectRatio;
                    } else {
                      finalHeight = Math.min(availableHeight, 900);
                      finalWidth = finalHeight * aspectRatio;
                    }

                    finalWidth = Math.max(finalWidth, 320);
                    finalHeight = Math.max(finalHeight, 240);

                    video.style.width = `${finalWidth}px`;
                    video.style.height = `${finalHeight}px`;
                  }}
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    setCurrentTime(video.currentTime);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadStart={(e) => {
                    const video = e.target as HTMLVideoElement;
                    video.setAttribute("data-loading", "true");
                  }}
                />

                {/* Custom Video Controls - Normal Mode */}
                {showControls && !isFullscreen && <VideoControls />}
              </div>
            </div>
          )}
        </div>

        {media.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent hidden sm:block">
            <div className="flex justify-center gap-3 overflow-x-auto pb-2">
              {media.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    index === currentIndex
                      ? "border-white scale-110 shadow-xl shadow-white/20"
                      : "border-white/20 opacity-60 hover:opacity-100 hover:scale-105 hover:border-white/40"
                  }`}
                >
                  {item.mediaType === "image" ? (
                    <img
                      src={item.mediaUrl}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <video
                        src={item.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play size={12} className="text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="absolute inset-0 -z-10" onClick={onClose} />
      </div>

      {isFullscreen &&
        showControls &&
        createPortal(
          <VideoControls className="fullscreen-controls" />,
          document.fullscreenElement || document.body,
        )}
    </>
  );
};

export default MediaViewer;
