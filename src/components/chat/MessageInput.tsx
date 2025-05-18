
import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send, Image, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const MessageInput = ({ onSendMessage, isLoading = false, disabled = false }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize the textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (message.trim() && !isLoading && !disabled && !isSending) {
      setIsSending(true);

      try {
        await onSendMessage(message.trim());
        setMessage('');

        // Reset height after sending
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
        }
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      className="p-3 border-t border-border/20 bg-background sticky bottom-0"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className="flex items-end rounded-full border border-border/50 bg-card/30 px-3 py-2">
        <motion.button
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Smile size={20} />
        </motion.button>

        <div className="flex space-x-1 mr-2">
          <motion.button
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Paperclip size={20} />
          </motion.button>
          <motion.button
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image size={20} />
          </motion.button>
          <motion.button
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Mic size={20} />
          </motion.button>
        </div>

        <textarea
          ref={inputRef}
          className={cn(
            "flex-1 bg-transparent border-none resize-none max-h-[120px] focus:outline-none text-foreground placeholder:text-muted-foreground py-2",
            (disabled || isSending) && "opacity-50 cursor-not-allowed"
          )}
          placeholder="Type a message..."
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading || isSending}
        />

        <motion.button
          className={cn(
            "ml-2 p-2 rounded-full transition-colors flex items-center justify-center",
            message.trim() && !isLoading && !disabled && !isSending
              ? "bg-nuumi-pink text-white hover:bg-nuumi-pink/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
          onClick={handleSend}
          disabled={!message.trim() || isLoading || disabled || isSending}
          whileHover={message.trim() ? { scale: 1.05 } : {}}
          whileTap={message.trim() ? { scale: 0.95 } : {}}
        >
          <AnimatePresence mode="wait">
            {isSending ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 size={18} />
              </motion.div>
            ) : (
              <motion.div
                key="send"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Send size={18} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MessageInput;
