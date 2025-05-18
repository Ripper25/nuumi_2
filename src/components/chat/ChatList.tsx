
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Avatar from '../shared/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChatListProps {
  currentUserId?: string;
}

interface ConversationPreview {
  id: string;
  lastMessage: string;
  lastMessageTime: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    unreadCount: number;
    isOnline: boolean;
  }[];
}

const ChatList = ({ currentUserId }: ChatListProps) => {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUserId) return;
    
    const fetchConversations = async () => {
      setLoading(true);
      
      // Get conversations the current user is part of
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);
        
      if (participantError) {
        console.error('Error fetching conversations:', participantError);
        setLoading(false);
        return;
      }
      
      if (!participantData || participantData.length === 0) {
        setLoading(false);
        return;
      }
      
      const conversationIds = participantData.map(p => p.conversation_id);
      
      // Get details for each conversation
      const conversationPreviews: ConversationPreview[] = [];
      
      for (const conversationId of conversationIds) {
        // Get the other participants in this conversation
        const { data: otherParticipants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            user_id
          `)
          .eq('conversation_id', conversationId)
          .neq('user_id', currentUserId);
          
        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
          continue;
        }
        
        if (!otherParticipants || otherParticipants.length === 0) continue;
        
        // Get the profiles of the other participants
        const otherUserIds = otherParticipants.map(p => p.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .in('id', otherUserIds);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          continue;
        }
        
        // Get the most recent message for this conversation
        const { data: recentMessages, error: messagesError } = await supabase
          .from('messages')
          .select('content, created_at, sender_id, read')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          continue;
        }
        
        // Get unread count
        const { count: unreadCount, error: countError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .eq('read', false)
          .neq('sender_id', currentUserId);
          
        if (countError) {
          console.error('Error counting unread messages:', countError);
        }
        
        if (profiles && profiles.length > 0 && recentMessages && recentMessages.length > 0) {
          conversationPreviews.push({
            id: conversationId,
            lastMessage: recentMessages[0].content,
            lastMessageTime: recentMessages[0].created_at,
            participants: profiles.map(profile => ({
              id: profile.id,
              name: profile.display_name || profile.username || 'Anonymous',
              avatar: profile.avatar_url || undefined,
              unreadCount: unreadCount || 0,
              isOnline: false // Will be updated with realtime presence
            }))
          });
        }
      }
      
      // Sort by most recent message
      conversationPreviews.sort((a, b) => {
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
      
      setConversations(conversationPreviews);
      setLoading(false);
    };
    
    fetchConversations();
    
    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('chat-updates')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, 
        (payload) => {
          // Refresh conversations when new message is received
          fetchConversations();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const handleSelectConversation = (conversationId: string) => {
    navigate(`/chats/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Start a new conversation by visiting a user's profile
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <div 
          key={conversation.id}
          className="flex items-center p-3 rounded-lg hover:bg-card/80 cursor-pointer transition-colors"
          onClick={() => handleSelectConversation(conversation.id)}
        >
          <Avatar 
            src={conversation.participants[0].avatar} 
            alt={conversation.participants[0].name}
            status={conversation.participants[0].isOnline ? 'online' : undefined}
          />
          
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <p className="font-medium truncate">{conversation.participants[0].name}</p>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
          </div>
          
          {conversation.participants[0].unreadCount > 0 && (
            <div className="ml-2 bg-nuumi-pink text-white text-xs font-medium rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
              {conversation.participants[0].unreadCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatList;
