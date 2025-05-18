import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MoreHorizontal, Reply, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CommentType {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  author: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
  };
  likes_count: number;
  isLiked: boolean;
  isNew?: boolean;
  replies?: CommentType[];
}

interface CommentItemProps {
  comment: CommentType;
  currentUserId?: string;
  onReply: (commentId: string, username: string, content?: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onReply,
  onDelete,
  onLike,
  isReply = false
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isAuthor = currentUserId === comment.user_id;
  const formattedDate = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
  
  const handleLike = () => {
    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    
    // Call the API
    onLike(comment.id);
  };
  
  const handleReply = () => {
    onReply(comment.id, comment.author.username);
  };
  
  const handleDelete = () => {
    onDelete(comment.id);
  };
  
  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };
  
  return (
    <div 
      id={`comment-${comment.id}`}
      className={cn(
        "py-3 border-b border-border relative",
        comment.isNew && "bg-primary-foreground/20 animate-pulse",
        isReply && "ml-8 border-l border-l-border pl-4"
      )}
    >
      <div className="flex">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatar_url} alt={comment.author.name} />
          <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-sm">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground ml-2">@{comment.author.username}</span>
              <span className="text-xs text-muted-foreground ml-2">{formattedDate}</span>
            </div>
            
            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <p className="text-sm mt-1">{comment.content}</p>
          
          <div className="flex items-center mt-2 space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={handleLike}
            >
              <Heart className={cn(
                "h-4 w-4 mr-1",
                isLiked ? "fill-nuumi-pink text-nuumi-pink" : ""
              )} />
              {likesCount > 0 && likesCount}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={handleReply}
            >
              <Reply className="h-4 w-4 mr-1" />
              Reply
            </Button>
            
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2 text-xs",
                  showReplies && "bg-nuumi-pink/10 text-nuumi-pink"
                )}
                onClick={toggleReplies}
              >
                {showReplies ? (
                  <ChevronUp className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-1" />
                )}
                {comment.replies?.length} {comment.replies?.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Replies */}
      {hasReplies && (
        <AnimatePresence>
          {showReplies && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3"
            >
              {comment.replies?.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onDelete={onDelete}
                  onLike={onLike}
                  isReply={true}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default CommentItem;
