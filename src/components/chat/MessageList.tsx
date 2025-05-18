
import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  status?: 'sent' | 'delivered' | 'read';
  isNew?: boolean;
}

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  isLoading?: boolean;
}

const MessageList = ({ messages, currentUserId, isLoading = false }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [renderedMessages, setRenderedMessages] = useState<Message[]>([]);

  // Update rendered messages with isNew flag for new messages
  useEffect(() => {
    if (messages.length > renderedMessages.length) {
      const newMessages = messages.map((msg, index) => {
        // Mark as new if it's a new message (not in renderedMessages)
        const isNew = index >= renderedMessages.length;
        return { ...msg, isNew };
      });
      setRenderedMessages(newMessages);
    } else {
      // Just update status for existing messages
      const updatedMessages = messages.map((msg, index) => {
        const existingMsg = renderedMessages.find(m => m.id === msg.id);
        return {
          ...msg,
          isNew: existingMsg?.isNew || false
        };
      });
      setRenderedMessages(updatedMessages);
    }
  }, [messages, renderedMessages]);

  useEffect(() => {
    // Scroll to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [renderedMessages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }

  if (renderedMessages.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <motion.p
          className="text-muted-foreground text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          No messages yet.<br />
          Start the conversation by sending a message.
        </motion.p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  renderedMessages.forEach(message => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <div className="p-3 flex-1 overflow-y-auto">
      <AnimatePresence>
        {Object.entries(groupedMessages).map(([date, messagesGroup]) => (
          <div key={date}>
            <motion.div
              className="flex justify-center my-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-xs text-muted-foreground bg-background/90 px-3 py-1 rounded-full">
                {date === new Date().toLocaleDateString() ? 'Today' : date}
              </span>
            </motion.div>
            <AnimatePresence>
              {messagesGroup.map(message => (
                <MessageBubble
                  key={message.id}
                  content={message.content}
                  timestamp={message.timestamp}
                  isSender={message.senderId === currentUserId}
                  status={message.status}
                  isNew={message.isNew}
                />
              ))}
            </AnimatePresence>
          </div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
