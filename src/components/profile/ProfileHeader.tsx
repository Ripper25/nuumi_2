
import React from 'react';
import Avatar from '../shared/Avatar';

interface ProfileHeaderProps {
  avatar?: string;
  onAvatarClick: (event: React.MouseEvent) => void;
  isCurrentUser?: boolean;
}

const ProfileHeader = ({ avatar, onAvatarClick, isCurrentUser = false }: ProfileHeaderProps) => {
  return (
    <div className="flex justify-center mt-4 mb-6 animate-fade-in">
      <Avatar 
        src={avatar} 
        alt="Profile" 
        size="xl" 
        onClick={isCurrentUser ? onAvatarClick : undefined}
        showAddButton={isCurrentUser && !avatar}
        className="border-2 border-nuumi-pink"
      />
    </div>
  );
};

export default ProfileHeader;
