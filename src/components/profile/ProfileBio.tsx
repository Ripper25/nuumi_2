
import React from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileBioProps {
  username: string;
  displayName: string;
  bio?: string;
  location?: string;
  children?: React.ReactNode;
  className?: string;
}

const ProfileBio = ({
  username,
  displayName,
  bio,
  location,
  children,
  className
}: ProfileBioProps) => {
  return (
    <div className={cn("text-center px-4 mb-6 animate-fade-in animate-delay-200", className)}>
      <h1 className="text-xl font-bold mb-1">{displayName}</h1>
      <p className="text-muted-foreground text-sm mb-2">@{username}</p>
      
      {location && (
        <div className="flex items-center justify-center text-sm text-muted-foreground mb-3">
          <MapPin size={14} className="mr-1" />
          <span>{location}</span>
        </div>
      )}
      
      {bio && <p className="text-sm mb-4">{bio}</p>}
      
      {children}
    </div>
  );
};

export default ProfileBio;
