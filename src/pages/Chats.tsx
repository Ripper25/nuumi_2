
import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Route, Routes, useParams } from 'react-router-dom';
import ChatList from '@/components/chat/ChatList';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import ConnectedUsersList from '@/components/chat/ConnectedUsersList';
import { toast } from 'sonner';
import { Loader2, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Main Chats Page Component
const ChatsMainPage = () => {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('recent');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-md mx-auto pt-2 pb-20">
        {session ? (
          <Tabs
            defaultValue="recent"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="recent">Recent Chats</TabsTrigger>
              <TabsTrigger value="connected">Connections</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="mt-0">
              <ChatList currentUserId={session?.user?.id} />
            </TabsContent>

            <TabsContent value="connected" className="mt-0">
              <div className="bg-card rounded-lg overflow-hidden">
                <div className="p-4 bg-muted/50 border-b flex items-center">
                  <Users size={18} className="mr-2 text-nuumi-pink" />
                  <h3 className="font-medium">My Connections</h3>
                </div>
                <ConnectedUsersList currentUserId={session?.user?.id} />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center mt-10">
            <p className="text-muted-foreground">Please sign in to view your messages</p>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
};

// Single user chat - direct messages from a profile
const DirectMessagePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    const initializeDirectMessage = async () => {
      if (!session || !userId) return;

      try {
        setLoading(true);
        setError(null);

        // Check if the user exists
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (userError || !userProfile) {
          toast.error('User not found');
          navigate('/chats');
          return;
        }

        // Get the conversation participants and find conversations that have both users
        // First get currentUser's participants
        const { data: myParticipants, error: myParticipantsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', session.user.id);

        if (myParticipantsError) throw myParticipantsError;

        let matchingConversationId: string | null = null;

        if (myParticipants && myParticipants.length > 0) {
          const conversationIds = myParticipants.map(p => p.conversation_id);

          // Find conversations where the other user is also a participant
          const { data: otherParticipants, error: otherError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId)
            .in('conversation_id', conversationIds);

          if (otherError) throw otherError;

          // If there's a match, use the first conversation found
          if (otherParticipants && otherParticipants.length > 0) {
            matchingConversationId = otherParticipants[0].conversation_id;
          }
        }

        if (matchingConversationId) {
          // Conversation exists, navigate to it
          navigate(`/chats/${matchingConversationId}`);
          return;
        }

        // Create new conversation if none exists
        // The table only has id, created_at, and updated_at columns with default values
        const { data: newConversation, error: newConversationError } = await supabase
          .from('conversations')
          .insert({})  // Empty object - let the database use default values
          .select('id')
          .single();

        if (newConversationError) {
          console.error('Error creating conversation:', newConversationError);
          throw new Error('Failed to create conversation');
        }

        // Add current user as participant
        const { error: currentUserError } = await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: newConversation.id,
            user_id: session.user.id
            // created_at will be set automatically by the database
          });

        if (currentUserError) {
          console.error('Error adding current user to conversation:', currentUserError);
          throw new Error('Failed to add you to the conversation');
        }

        // Add the other user directly
        try {
          console.log('Adding other user directly to conversation');

          // Try direct insertion
          const { error: directError } = await supabase
            .from('conversation_participants')
            .insert({
              conversation_id: newConversation.id,
              user_id: userId
            });

          if (directError) {
            console.error('Error adding other user:', directError);
            // Continue anyway - the conversation is created
          } else {
            console.log('Successfully added other user to conversation');
          }

          // Add a welcome message
          const { error: messageError } = await supabase
            .from('messages')
            .insert({
              conversation_id: newConversation.id,
              sender_id: session.user.id,
              content: 'Hello! I started this conversation.',
              read: false
            });

          if (messageError) {
            console.error('Error adding welcome message:', messageError);
          } else {
            console.log('Welcome message added successfully');
          }
        } catch (error) {
          console.error('Error in conversation setup:', error);
          // Continue anyway - the conversation is created
        }

        // Store the recipient ID in localStorage for the conversation page to use
        localStorage.setItem(`recipient_${newConversation.id}`, userId);

        // Navigate to the new conversation
        navigate(`/chats/${newConversation.id}`);

      } catch (error: any) {
        console.error('Error creating direct message:', error);

        // Log detailed error information
        if (error.details) console.error('Error details:', error.details);
        if (error.hint) console.error('Error hint:', error.hint);
        if (error.code) console.error('Error code:', error.code);

        // Set error message
        let errorMessage = 'Failed to start conversation. Please try again later.';

        if (error.message) {
          errorMessage = `Error: ${error.message}`;
        } else if (error.code === '23505') {
          errorMessage = 'A conversation with this user already exists';
        } else if (error.code === '23503') {
          errorMessage = 'User not found';
        } else if (error.code === '42P01') {
          errorMessage = 'Database table not found. Please contact support.';
        } else if (error.code && error.code.startsWith('42')) {
          errorMessage = 'Database schema error. Please contact support.';
        } else if (error.code && error.code.startsWith('23')) {
          errorMessage = 'Database constraint violation. Please try again later.';
        }

        setError(errorMessage);
        toast.error(errorMessage);

        // Don't navigate away automatically - let the user see the error
      } finally {
        setLoading(false);
      }
    };

    initializeDirectMessage();
  }, [session, userId, navigate]);

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to start a conversation</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {loading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
            <p className="text-muted-foreground">Starting conversation...</p>
          </>
        ) : error ? (
          <>
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => navigate('/chats')}
              className="px-4 py-2 bg-nuumi-pink text-white rounded-md hover:bg-nuumi-pink/90"
            >
              Back to Chats
            </button>
          </>
        ) : (
          <p className="text-muted-foreground">Preparing conversation...</p>
        )}
      </div>
    </div>
  );
};

// Conversation Component
const ConversationPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [session, setSession] = useState<any>(null);
  const [recipient, setRecipient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !conversationId) return;

    const fetchConversation = async () => {
      setLoading(true);

      // First validate the conversation exists and user is a participant
      const { data: userParticipation, error: participationError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', session.user.id)
        .single();

      if (participationError || !userParticipation) {
        console.error('Error validating conversation access:', participationError);
        toast.error('You don\'t have access to this conversation');
        navigate('/chats');
        return;
      }

      // Get the other participant
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', session.user.id);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        toast.error('Failed to load conversation');
        navigate('/chats');
        return;
      }

      if (!participants || participants.length === 0) {
        // If there are no other participants, let's try to get the user ID from the URL
        // This happens when we've just created a conversation and navigated to it
        const pathParts = window.location.pathname.split('/');
        const conversationIdFromPath = pathParts[pathParts.length - 1];

        // Check if this is a newly created conversation by comparing IDs
        if (conversationIdFromPath === conversationId) {
          // Try to get the user ID from localStorage (we'll store it when creating a conversation)
          const storedUserId = localStorage.getItem(`recipient_${conversationId}`);

          if (storedUserId) {
            console.log('Found stored recipient ID:', storedUserId);

            // Get recipient profile using the stored ID
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, display_name, username, avatar_url')
              .eq('id', storedUserId)
              .single();

            if (profile && !profileError) {
              setRecipient({
                id: profile.id,
                name: profile.display_name || profile.username || 'User',
                avatar: profile.avatar_url || undefined,
                isOnline: false
              });

              // Continue with the rest of the function
              return;
            }
          }
        }

        // Fallback to placeholder if we couldn't get the user
        setRecipient({
          id: 'placeholder',
          name: 'New Conversation',
          avatar: undefined,
          isOnline: false
        });
      } else {
        const recipientId = participants[0].user_id;

        // Get recipient profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .eq('id', recipientId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast.error('Failed to load recipient profile');
        } else if (profile) {
          setRecipient({
            id: profile.id,
            name: profile.display_name || profile.username || 'Anonymous',
            avatar: profile.avatar_url || undefined,
            isOnline: false // Will update with presence later
          });
        }
      }

      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id, read')
        .eq('conversation_id', conversationId)
        .order('created_at');

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        toast.error('Failed to load messages');
      } else if (messagesData) {
        setMessages(messagesData.map(msg => ({
          id: msg.id,
          content: msg.content,
          timestamp: msg.created_at,
          senderId: msg.sender_id,
          status: msg.read ? 'read' : 'delivered'
        })));
      }

      // Mark messages as read
      if (messagesData && messagesData.length > 0) {
        const unreadMessages = messagesData
          .filter(msg => !msg.read && msg.sender_id !== session.user.id)
          .map(msg => msg.id);

        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessages);
        }
      }

      setLoading(false);
    };

    fetchConversation();

    // Set up realtime subscription for new messages and updates
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      // Listen for new messages
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMessage = payload.new as any;

          // Skip if this is our own message (already handled by optimistic UI)
          if (newMessage.sender_id === session.user.id) {
            // Just update the status to delivered for our own messages
            setMessages(current =>
              current.map(msg => {
                // Find our temporary message by content and update it
                if (msg.content === newMessage.content &&
                    msg.senderId === session.user.id &&
                    msg.id.startsWith('temp-')) {
                  return {
                    ...msg,
                    id: newMessage.id,
                    status: 'delivered'
                  };
                }
                return msg;
              })
            );
            return;
          }

          // Add the new message from the other person
          setMessages(current => [
            ...current,
            {
              id: newMessage.id,
              content: newMessage.content,
              timestamp: newMessage.created_at,
              senderId: newMessage.sender_id,
              status: newMessage.read ? 'read' : 'delivered',
              isNew: true
            }
          ]);

          // Mark message as read immediately since we're viewing the conversation
          await supabase
            .from('messages')
            .update({ read: true })
            .eq('id', newMessage.id);
        }
      )
      // Listen for message updates (read receipts)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updatedMessage = payload.new as any;

          // Update message status in our local state
          setMessages(current =>
            current.map(msg => {
              if (msg.id === updatedMessage.id) {
                return {
                  ...msg,
                  status: updatedMessage.read ? 'read' : 'delivered'
                };
              }
              return msg;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, session, navigate]);

  const handleSendMessage = async (content: string) => {
    if (!session || !conversationId || !content.trim()) return;

    // Generate a temporary ID for optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();

    // Add message to UI immediately (optimistic update)
    setMessages(current => [
      ...current,
      {
        id: tempId,
        content: content.trim(),
        timestamp: now,
        senderId: session.user.id,
        status: 'sent'
      }
    ]);

    try {
      // Send message to server
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: session.user.id,
          content: content.trim(),
          read: false
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');

        // Remove the optimistic message on error
        setMessages(current => current.filter(msg => msg.id !== tempId));
      } else {
        // Update the message status to delivered
        setMessages(current =>
          current.map(msg =>
            msg.id === tempId
              ? { ...msg, id: data.id, status: 'delivered' }
              : msg
          )
        );

        // After a short delay, update to "read" status if the recipient is active
        // This is a simulation - in a real app, this would be triggered by the recipient
        setTimeout(() => {
          setMessages(current =>
            current.map(msg =>
              msg.id === data.id && msg.senderId === session.user.id
                ? { ...msg, status: 'read' }
                : msg
            )
          );
        }, 2000);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');

      // Remove the optimistic message on error
      setMessages(current => current.filter(msg => msg.id !== tempId));
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view your messages</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {recipient && <ChatHeader recipient={recipient} />}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden">
            <MessageList
              messages={messages}
              currentUserId={session?.user?.id}
            />
          </div>

          <MessageInput onSendMessage={handleSendMessage} />
        </>
      )}
    </div>
  );
};

// Main Component with Routes
const Chats = () => {
  return (
    <Routes>
      <Route path="/" element={<ChatsMainPage />} />
      <Route path="/user/:userId" element={<DirectMessagePage />} />
      <Route path="/:conversationId" element={<ConversationPage />} />
    </Routes>
  );
};

export default Chats;
