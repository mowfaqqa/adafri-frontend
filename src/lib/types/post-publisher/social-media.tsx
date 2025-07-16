// export interface SocialPost {
//   id: string;
//   content: string;
//   media: File[];
//   scheduledAt: Date;
//   platforms: ('facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter')[];
//   status: 'draft' | 'scheduled' | 'published' | 'failed';
//   createdBy: string;
//   analytics?: { [platform: string]: AnalyticsData };
// }

// export interface AnalyticsData {
//   reach: number;
//   likes: number;
//   clicks: number;
//   shares: number;
// }

// export interface SocialAccount {
//   id: string;
//   platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter';
//   username: string;
//   connected: boolean;
//   avatar?: string;
// }

// export interface PlatformConfig {
//   id: string;
//   name: string;
//   color: string;
//   icon: string;
//   characterLimit: number;
// }

// export const PLATFORMS: PlatformConfig[] = [
//   { id: 'facebook', name: 'Facebook', color: 'bg-blue-600', icon: '📘', characterLimit: 63206 },
//   { id: 'instagram', name: 'Instagram', color: 'bg-pink-600', icon: '📸', characterLimit: 2200 },
//   { id: 'twitter', name: 'X (Twitter)', color: 'bg-black', icon: '🐦', characterLimit: 280 },
//   { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700', icon: '💼', characterLimit: 3000 },
//   { id: 'tiktok', name: 'TikTok', color: 'bg-gray-900', icon: '🎵', characterLimit: 150 },
// ];

















































































import React from 'react';
import { Linkedin } from 'lucide-react';

// Custom SVG Icons for platforms not available in Lucide
const FacebookIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TwitterIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

export interface SocialPost {
  id: string;
  content: string;
  media: File[];
  scheduledAt: Date;
  platforms: ('facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter')[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  createdBy: string;
  analytics?: { [platform: string]: AnalyticsData };
}

export interface AnalyticsData {
  reach: number;
  likes: number;
  clicks: number;
  shares: number;
}

export interface SocialAccount {
  id: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter';
  username: string;
  connected: boolean;
  avatar?: string;
}

export interface PlatformConfig {
  id: string;
  name: string;
  color: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  characterLimit: number;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    color: 'bg-blue-600',
    icon: FacebookIcon,
    characterLimit: 63206
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600',
    icon: InstagramIcon,
    characterLimit: 2200
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    color: 'bg-black',
    icon: TwitterIcon,
    characterLimit: 280
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: 'bg-blue-700',
    icon: Linkedin,
    characterLimit: 3000
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: 'bg-black',
    icon: TikTokIcon,
    characterLimit: 150
  },
];

// Helper function to get platform config by ID
export const getPlatformConfig = (platformId: string): PlatformConfig | undefined => {
  return PLATFORMS.find(platform => platform.id === platformId);
};

// Helper function to render platform icon
export const renderPlatformIcon = (platformId: string, size: number = 16, className: string = ""): React.ReactNode => {
  const config = getPlatformConfig(platformId);
  if (!config) return null;
  
  const IconComponent = config.icon;
  return <IconComponent size={size} className={className} />;
};















































// import React from 'react';
// import { Linkedin } from 'lucide-react';

// // Custom SVG Icons for platforms not available in Lucide
// const FacebookIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
//     <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
//   </svg>
// );

// const InstagramIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
//     <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
//   </svg>
// );

// const TwitterIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
//     <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
//   </svg>
// );

// const TikTokIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
//     <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
//   </svg>
// );

// export interface SocialPost {
//   id: string;
//   content: string;
//   media: File[];
//   scheduledAt: Date;
//   platforms: ('facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter')[];
//   status: 'draft' | 'scheduled' | 'published' | 'failed';
//   createdBy: string;
//   analytics?: { [platform: string]: AnalyticsData };
// }

// export interface AnalyticsData {
//   reach: number;
//   likes: number;
//   clicks: number;
//   shares: number;
// }

// export interface SocialAccount {
//   id: string;
//   platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter';
//   username: string;
//   connected: boolean;
//   avatar?: string;
// }

// export interface PlatformConfig {
//   id: string;
//   name: string;
//   color: string;
//   icon: React.ComponentType<{ size?: number; className?: string }>;
//   characterLimit: number;
// }

// export const PLATFORMS: PlatformConfig[] = [
//   {
//     id: 'facebook',
//     name: 'Facebook',
//     color: 'bg-blue-600',
//     icon: FacebookIcon,
//     characterLimit: 63206
//   },
//   {
//     id: 'instagram',
//     name: 'Instagram',
//     color: 'bg-pink-600',
//     icon: InstagramIcon,
//     characterLimit: 2200
//   },
//   {
//     id: 'twitter',
//     name: 'X (Twitter)',
//     color: 'bg-black',
//     icon: TwitterIcon,
//     characterLimit: 280
//   },
//   {
//     id: 'linkedin',
//     name: 'LinkedIn',
//     color: 'bg-blue-700',
//     icon: Linkedin,
//     characterLimit: 3000
//   },
//   {
//     id: 'tiktok',
//     name: 'TikTok',
//     color: 'bg-gray-900',
//     icon: TikTokIcon,
//     characterLimit: 150
//   },
// ];

// // Helper function to get platform config by ID
// export const getPlatformConfig = (platformId: string): PlatformConfig | undefined => {
//   return PLATFORMS.find(platform => platform.id === platformId);
// };

// // Helper function to render platform icon
// export const renderPlatformIcon = (platformId: string, size = 16, className = ""): React.ReactNode => {
//   const config = getPlatformConfig(platformId);
//   if (!config) return null;
  
//   const IconComponent = config.icon;
//   return <IconComponent size={size} className={className} />;
// };