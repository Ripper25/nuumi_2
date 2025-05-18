import React, { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { motion } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';
import { cn } from '@/lib/utils';

interface CommentInputProps {
  avatarUrl?: string;
  onSubmit: (content: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  replyingTo?: string;
  onCancelReply?: () => void;
  className?: string;
  username?: string; // Add username prop
}

const CommentInput: React.FC<CommentInputProps> = ({
  avatarUrl,
  onSubmit,
  placeholder = 'Add a comment...',
  autoFocus = false,
  replyingTo,
  onCancelReply,
  className,
  username
}) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(autoFocus);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    const trimmedContent = content.trim();
    if (trimmedContent) {
      onSubmit(trimmedContent);
      setContent('');
      setIsFocused(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <div className="flex flex-col items-center">
        <Avatar src={avatarUrl} alt={username || "Your avatar"} size="sm" className="flex-shrink-0" />
        <span className="text-xs font-medium text-foreground mt-1 whitespace-nowrap">
          {username ? (username.length > 8 ? username.substring(0, 8) + '...' : username) : 'You'}
        </span>
      </div>

      <div className="flex-1 relative">
        {replyingTo && (
          <div className="flex items-center mb-1 text-xs text-nuumi-pink">
            <span>Replying to @{replyingTo}</span>
            {onCancelReply && (
              <button
                onClick={onCancelReply}
                className="ml-2 underline text-xs text-muted-foreground hover:text-foreground"
              >
                cancel
              </button>
            )}
          </div>
        )}

        <div className={cn(
          "flex items-center border rounded-2xl overflow-hidden transition-all",
          isFocused ? "border-nuumi-pink bg-background" : "border-border bg-muted/30"
        )}>
          <TextareaAutosize
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 py-2 px-3 bg-transparent resize-none text-sm focus:outline-none min-h-[40px] max-h-[120px]"
            maxRows={5}
          />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSubmit}
            disabled={!content.trim()}
            className={cn(
              "p-2 mr-1 rounded-full transition-colors",
              content.trim()
                ? "text-nuumi-pink hover:bg-nuumi-pink/10"
                : "text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;
