
import React from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isSender: boolean;
  status?: 'sent' | 'delivered' | 'read';
  isNew?: boolean;
}

const MessageBubble = ({
  content,
  timestamp,
  isSender,
  status = 'sent',
  isNew = false
}: MessageBubbleProps) => {
  // Animation variants
  const containerVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
        mass: 0.5
      }
    }
  };

  // Status icon animation variants
  const statusVariants = {
    sent: { scale: 1, opacity: 1 },
    delivered: { scale: [0.5, 1.2, 1], opacity: 1, transition: { duration: 0.3 } },
    read: {
      scale: [0.5, 1.2, 1],
      opacity: 1,
      transition: {
        duration: 0.3,
        delay: 0.1
      }
    }
  };

  return (
    <motion.div
      className={cn(
        "max-w-[80%] mb-3 flex flex-col",
        isSender ? "ml-auto items-end" : "mr-auto items-start"
      )}
      initial="initial"
      animate="animate"
      variants={containerVariants}
    >
      <motion.div
        className={cn(
          "px-4 py-2 rounded-2xl break-words",
          isSender
            ? "bg-nuumi-pink text-white rounded-br-none"
            : "bg-secondary text-foreground rounded-bl-none"
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {content}
      </motion.div>

      <div className="flex items-center mt-1 text-xs text-muted-foreground">
        <span>
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>

        {isSender && (
          <motion.span
            className="ml-1 flex items-center"
            initial="sent"
            animate={status}
            variants={statusVariants}
          >
            {status === 'sent' && (
              <Check size={12} className="text-muted-foreground" />
            )}
            {status === 'delivered' && (
              <CheckCheck size={12} className="text-muted-foreground" />
            )}
            {status === 'read' && (
              <CheckCheck size={12} className="text-nuumi-pink" />
            )}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
