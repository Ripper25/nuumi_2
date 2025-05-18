import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const TestChat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const testCreateConversation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get current user
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('Not authenticated');
        return;
      }

      const userId = sessionData.session.user.id;

      // Step 1: Create a conversation
      console.log('Step 1: Creating conversation...');
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({})
        .select('id')
        .single();

      if (conversationError) {
        console.error('Error creating conversation:', conversationError);
        setError(`Conversation creation failed: ${conversationError.message}`);
        if (conversationError.details) console.error('Details:', conversationError.details);
        if (conversationError.hint) console.error('Hint:', conversationError.hint);
        return;
      }

      console.log('Conversation created:', conversation);
      setResult(prev => ({ ...prev, conversation }));

      // Step 2: Add current user as participant
      console.log('Step 2: Adding current user as participant...');
      const { data: participant, error: participantError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          user_id: userId
        })
        .select('id')
        .single();

      if (participantError) {
        console.error('Error adding participant:', participantError);
        setError(`Adding participant failed: ${participantError.message}`);
        if (participantError.details) console.error('Details:', participantError.details);
        if (participantError.hint) console.error('Hint:', participantError.hint);
        return;
      }

      console.log('Participant added:', participant);
      setResult(prev => ({ ...prev, participant }));

      // Step 3: Add a test message
      console.log('Step 3: Adding test message...');
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: userId,
          content: 'Test message',
          topic: 'message',
          extension: ''
        })
        .select('id')
        .single();

      if (messageError) {
        console.error('Error adding message:', messageError);
        setError(`Adding message failed: ${messageError.message}`);
        if (messageError.details) console.error('Details:', messageError.details);
        if (messageError.hint) console.error('Hint:', messageError.hint);
        return;
      }

      console.log('Message added:', message);
      setResult(prev => ({ ...prev, message }));

      toast.success('Test completed successfully!');
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Chat Creation</h1>
      
      <button
        onClick={testCreateConversation}
        disabled={loading}
        className="bg-nuumi-pink text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center">
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
            Testing...
          </span>
        ) : (
          'Test Create Conversation'
        )}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
          <h3 className="font-bold">Result:</h3>
          <pre className="whitespace-pre-wrap text-xs mt-2">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestChat;
