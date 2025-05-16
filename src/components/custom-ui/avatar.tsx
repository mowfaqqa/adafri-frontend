import React from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  status,
}) => {
  // Get size values in pixels
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };
  
  const pixelSize = sizeMap[size];
  
  // Get CSS classes for container size
  const containerClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };
  
  // Get CSS classes for status indicator size
  const statusSize = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  };
  
  // Get CSS classes for status colors
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };
  
  // Generate initials from alt text
  const getInitials = () => {
    if (!alt) return '';
    
    // Split by spaces and get the first letter of each word
    const words = alt.split(' ');
    
    if (words.length === 1) {
      // If only one word, return the first two characters
      return words[0].substring(0, 2).toUpperCase();
    } else {
      // If multiple words, return first letter of first and last words
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
  };
  
  return (
    <div className={`relative ${containerClasses[size]} ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={pixelSize}
          height={pixelSize}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
          <span className={`font-medium ${size === 'xs' || size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {getInitials()}
          </span>
        </div>
      )}
      
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white ${statusSize[size]} ${statusColors[status]}`}
        />
      )}
    </div>
  );
};

export default Avatar;