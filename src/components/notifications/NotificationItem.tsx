
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, UserPlus, MessageCircle } from 'lucide-react';
import { Notification, handleNotificationClick, getNotificationText } from '@/hooks/useNotifications';
import Avatar from '@/components/shared/Avatar';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkAsRead 
}) => {
  const navigate = useNavigate();
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });
  
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    handleNotificationClick(notification, navigate);
  };

  // Icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart size={18} className="text-pink-500" />;
      case 'comment':
        return <MessageSquare size={18} className="text-blue-500" />;
      case 'follow':
        return <UserPlus size={18} className="text-green-500" />;
      case 'message':
        return <MessageCircle size={18} className="text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "flex items-start p-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/30",
        !notification.read && "bg-muted/20"
      )}
    >
      <div className="relative">
        <Avatar 
          src={notification.actor?.avatar_url || undefined} 
          alt={notification.actor?.display_name || notification.actor?.username || "User"} 
          size="sm"
        />
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
          {getIcon()}
        </div>
      </div>
      
      <div className="ml-3 flex-1">
        <p className="text-sm">
          <span className="font-medium">
            {notification.actor?.display_name || notification.actor?.username || "Someone"}
          </span>{' '}
          {notification.type === 'like' && 'liked your post'}
          {notification.type === 'comment' && 'commented on your post'}
          {notification.type === 'follow' && 'started following you'}
          {notification.type === 'message' && 'sent you a message'}
        </p>
        
        {notification.content && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {notification.content}
          </p>
        )}
        
        <span className="text-xs text-muted-foreground mt-1 block">
          {timeAgo}
        </span>
      </div>
      
      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-nuumi-pink mr-1 mt-1.5 flex-shrink-0" />
      )}
    </div>
  );
};

export default NotificationItem;
