
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import NotificationItem from './NotificationItem';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter = ({ className }: NotificationCenterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if the user is logged in
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .rpc('get_notifications_with_actors', {
          user_id_param: user.id
        });

      if (error) throw error;

      setNotifications(data || []);

      // Count unread notifications
      const unread = data?.filter((n: any) => !n.read) || [];
      setUnreadCount(unread.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    if (user) {
      setIsOpen(true);
      fetchNotifications();
    } else {
      toast.error('Please sign in to view notifications');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .rpc('mark_notification_as_read', {
          notification_id_param: notificationId
        });

      if (error) throw error;

      // Update local state
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .rpc('mark_all_notifications_as_read', {
          user_id_param: user.id
        });

      if (error) throw error;

      // Update local state
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(
          "relative action-button",
          className
        )}
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-nuumi-pink text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce-subtle">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in">
          <div className="bg-card rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Notifications</h2>

              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-nuumi-pink hover:text-nuumi-pink/80"
                  >
                    Mark all as read
                  </button>
                )}

                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto elastic-scroll">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => handleRead(notification.id)}
                  />
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No notifications yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationCenter;
