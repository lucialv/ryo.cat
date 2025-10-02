import React from "react";
import { User } from "lucide-react";
import { useUserProfilePicture } from "@/hooks/useProfile";

interface UserAvatarProps {
  userId: string;
  userName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackClassName?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

const iconSizeClasses = {
  sm: "h-3 w-3",
  md: "h-5 w-5",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  userName,
  size = "md",
  className = "",
  fallbackClassName = "",
}) => {
  const {
    data: profilePictureUrl,
    isLoading,
    error,
  } = useUserProfilePicture(userId);

  const baseClasses = `${sizeClasses[size]} rounded-full object-cover ${className}`;
  const fallbackClasses = `${sizeClasses[size]} bg-purple-500 rounded-full flex items-center justify-center ${fallbackClassName}`;

  if (isLoading) {
    return (
      <div
        className={`${sizeClasses[size]} bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse ${className}`}
      />
    );
  }

  if (error || !profilePictureUrl) {
    return (
      <div className={fallbackClasses}>
        <User className={`${iconSizeClasses[size]} text-white`} />
      </div>
    );
  }

  return (
    <img
      src={profilePictureUrl}
      alt={userName ? `${userName}'s profile` : "User profile"}
      className={baseClasses}
      onError={(e) => {
        // Replace with fallback if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
        const fallback = document.createElement("div");
        fallback.className = fallbackClasses;
        fallback.innerHTML = `<svg class="${iconSizeClasses[size]} text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`;
        target.parentNode?.replaceChild(fallback, target);
      }}
    />
  );
};

export default UserAvatar;
