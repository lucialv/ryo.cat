import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCreatePost, useUploadMedia } from "@/hooks/usePosts";
import { Image, Video, X, Upload, User } from "lucide-react";

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

const PostForm: React.FC = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id || "");
  const [postBody, setPostBody] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const createPostMutation = useCreatePost();
  const uploadMediaMutation = useUploadMedia();

  const currentProfilePicture = profile?.profilePictureUrl || user?.profileImg;

  const isAdmin = user?.isAdmin;

  if (!isAdmin) {
    return null;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        alert("Only images and videos are allowed");
        return;
      }

      const preview = URL.createObjectURL(file);

      const mediaFile: MediaFile = {
        file,
        preview,
        type: isImage ? "image" : "video",
      };

      setMediaFiles((prev) => [...prev, mediaFile]);
    });

    event.target.value = "";
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!postBody.trim()) {
      alert("Post body cannot be empty");
      return;
    }

    setIsUploading(true);

    try {
      const uploadedMedia = [];

      for (const mediaFile of mediaFiles) {
        const uploadResult = await uploadMediaMutation.mutateAsync(
          mediaFile.file,
        );
        uploadedMedia.push({
          fileKey: uploadResult.fileKey,
          mediaType: uploadResult.mediaType,
          mimeType: uploadResult.mimeType,
          fileSize: uploadResult.fileSize,
        });
      }

      await createPostMutation.mutateAsync({
        body: postBody,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
      });

      setPostBody("");
      setMediaFiles([]);

      mediaFiles.forEach((mediaFile) => {
        URL.revokeObjectURL(mediaFile.preview);
      });
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = isUploading || createPostMutation.isPending;

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/70 dark:bg-neutral-800/70 rounded-2xl border-2 border-neutral-200 dark:border-neutral-600 p-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 mb-4">
          {currentProfilePicture ? (
            <img
              src={currentProfilePicture}
              alt="User Avatar"
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          )}
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Hi {profile?.name || user?.name}, what's Ryo doing?
          </p>
        </div>

        <div className="flex-row w-full">
          <textarea
            value={postBody}
            onChange={(e) => setPostBody(e.target.value)}
            className="w-full p-4 bg-neutral-50/70 dark:bg-neutral-700/50 rounded-xl border border-neutral-200 dark:border-neutral-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-neutral-800 dark:text-neutral-200"
            placeholder="What's meowing?"
            rows={3}
            disabled={isLoading}
          />

          {mediaFiles.length > 0 && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
              {mediaFiles.map((mediaFile, index) => (
                <div key={index} className="relative group">
                  <button
                    type="button"
                    onClick={() => removeMediaFile(index)}
                    className="absolute top-1 right-1 z-10 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>

                  {mediaFile.type === "image" ? (
                    <img
                      src={mediaFile.preview}
                      alt="Preview"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={mediaFile.preview}
                      className="w-full h-24 object-cover rounded-lg"
                      muted
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-3">
            <div className="flex gap-2">
              <label className="p-2 text-purple-500 rounded-full hover:bg-purple-50 dark:hover:bg-neutral-700 cursor-pointer">
                <Image size={20} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isLoading}
                />
              </label>

              <label className="p-2 text-purple-500 rounded-full hover:bg-purple-50 dark:hover:bg-neutral-700 cursor-pointer">
                <Video size={20} />
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isLoading}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !postBody.trim()}
              className="px-4 py-2 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <Upload size={16} className="animate-spin" />}
              {isLoading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PostForm;
