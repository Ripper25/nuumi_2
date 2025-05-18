
import React from 'react';
import Avatar from '../shared/Avatar';
import { ArrowLeft, Phone, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  recipient: {
    name: string;
    avatar?: string;
    isOnline?: boolean;
    lastActive?: string;
  };
  isMinimized?: boolean;
  onBack?: () => void;
}

const ChatHeader = ({ recipient, isMinimized = false, onBack }: ChatHeaderProps) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/chats');
    }
  };
  
  return (
    <div className={cn(
      "flex items-center p-3 border-b border-border/20 bg-card/80 backdrop-blur-sm sticky top-0 z-10",
      isMinimized ? "p-2" : ""
    )}>
      <button 
        onClick={handleBack}
        className="p-1 mr-2 rounded-full hover:bg-secondary transition-colors"
      >
        <ArrowLeft size={20} />
      </button>
      
      <Avatar 
        src={recipient.avatar} 
        alt={recipient.name}
        size={isMinimized ? "sm" : "md"}
        status={recipient.isOnline ? 'online' : undefined}
      />
      
      <div className="ml-3 flex-1">
        <h3 className={cn("font-medium", isMinimized ? "text-sm" : "")}>{recipient.name}</h3>
        {!isMinimized && (
          <p className="text-xs text-muted-foreground">
            {recipient.isOnline ? 'Online now' : recipient.lastActive ? `Last seen ${recipient.lastActive}` : 'Offline'}
          </p>
        )}
      </div>
      
      {!isMinimized && (
        <div className="flex space-x-2">
          <button className="p-2 rounded-full hover:bg-secondary text-nuumi-pink transition-colors">
            <Phone size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-secondary text-nuumi-pink transition-colors">
            <Video size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
