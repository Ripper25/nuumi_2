
import React, { useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationItem from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const Notifications = () => {
  const { 
    notifications, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    unreadCount,
    fetchNotifications
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title="Notifications" 
        showBackButton 
      />
      
      <div className="max-w-md mx-auto">
        {unreadCount > 0 && (
          <div className="p-3 flex justify-between items-center border-b border-border/30">
            <span className="text-sm text-muted-foreground">
              {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-8"
            >
              Mark all as read
            </Button>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-border/30">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              When someone likes your posts, comments, or follows you, you'll see it here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
