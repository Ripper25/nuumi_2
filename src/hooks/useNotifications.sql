
-- Create a function to get notifications with actor profiles
CREATE OR REPLACE FUNCTION public.get_notifications_with_actors(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  actor_id UUID,
  type TEXT,
  entity_id UUID,
  entity_type TEXT,
  read BOOLEAN,
  content TEXT,
  created_at TIMESTAMPTZ,
  actor JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.user_id,
    n.actor_id,
    n.type,
    n.entity_id,
    n.entity_type,
    n.read,
    n.content,
    n.created_at,
    json_build_object(
      'username', p.username,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url
    ) AS actor
  FROM 
    public.notifications n
  LEFT JOIN 
    public.profiles p ON n.actor_id = p.id
  WHERE 
    n.user_id = user_id_param
  ORDER BY 
    n.created_at DESC
  LIMIT 
    50;
END;
$$;

-- Create a function to mark a notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(notification_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE id = notification_id_param;
END;
$$;

-- Create a function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE user_id = user_id_param AND read = false;
END;
$$;
