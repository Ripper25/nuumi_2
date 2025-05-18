
import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
  showAddButton?: boolean;
}

const Avatar = ({
  src,
  alt = 'User avatar',
  size = 'md',
  status,
  className,
  onClick,
  showAddButton = false
}: AvatarProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const statusClasses = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'rounded-full overflow-hidden bg-secondary flex items-center justify-center transition-transform duration-300 hover:scale-105',
          sizeClasses[size],
          className,
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={cn('flex items-center justify-center', sizeClasses[size], 'bg-secondary text-secondary-foreground')}>
            {showAddButton ? (
              <span className="text-nuumi-pink font-semibold">
                {size === 'lg' || size === 'xl' ? 'Add Photo' : '+'}
              </span>
            ) : (
              alt.substring(0, 1).toUpperCase()
            )}
          </div>
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            statusClasses[status],
            size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'
          )}
        />
      )}
    </div>
  );
};

export default Avatar;
