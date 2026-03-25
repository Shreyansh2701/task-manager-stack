"use client";

import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "avatar-sm",
  md: "avatar-md",
  lg: "avatar-lg",
};

export default function Avatar({ name, avatar, size = "sm" }: AvatarProps) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeMap[size]} rounded-full object-cover`}
      />
    );
  }
  return <div className={`avatar ${sizeMap[size]}`}>{getInitials(name)}</div>;
}
