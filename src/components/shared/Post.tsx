
import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Repeat2, Send } from 'lucide-react';
import Avatar from './Avatar';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CommentModal from '@/components/comments/CommentModal';

interface PostProps {
  id: string; // Post ID
  author: {
    name: string;
    username: string;
    avatar?: string;
    isVerified?: boolean;
    timeAgo: string;
    id: string; // Author ID
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  reposts: number;
  isLiked?: boolean;
  currentUser?: {
    id: string;
    avatarUrl?: string;
    username?: string; // Add username property
    displayName?: string; // Add displayName property
  };
  onLike?: () => void;
  onComment?: () => void;
  onRepost?: () => void;
  onShare?: () => void;
}

const Post = ({
  id,
  author,
  content,
  image,
  likes,
  comments,
  reposts,
  isLiked = false,
  currentUser,
  onLike,
  onComment,
  onRepost,
  onShare
}: PostProps) => {
  const navigate = useNavigate();

  // Local state for optimistic updates
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localLikes, setLocalLikes] = useState(likes);
  const [localComments, setLocalComments] = useState(comments);
  const [localReposts, setLocalReposts] = useState(reposts);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isCommentAnimating, setIsCommentAnimating] = useState(false);
  const [isRepostAnimating, setIsRepostAnimating] = useState(false);
  const [isShareAnimating, setIsShareAnimating] = useState(false);

  // Comment modal state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  // Debug log for currentUser
  useEffect(() => {
    console.log('Post component - currentUser:', currentUser, 'for post:', id);
  }, [currentUser, id]);

  // Handle like with optimistic update
  const handleLike = () => {
    setLocalLiked(!localLiked);
    setLocalLikes(localLiked ? localLikes - 1 : localLikes + 1);
    setIsLikeAnimating(true);

    // Call the parent handler
    onLike?.();

    // Reset animation state after animation completes
    setTimeout(() => setIsLikeAnimating(false), 500);
  };

  // Handle repost with optimistic update
  const handleRepost = () => {
    setLocalReposts(localReposts + 1);
    setIsRepostAnimating(true);

    // Call the parent handler
    onRepost?.();

    // Reset animation state after animation completes
    setTimeout(() => setIsRepostAnimating(false), 500);
  };

  // Handle share with animation
  const handleShare = () => {
    setIsShareAnimating(true);

    // Call the parent handler
    onShare?.();

    // Reset animation state after animation completes
    setTimeout(() => setIsShareAnimating(false), 500);
  };

  const handleProfileClick = () => {
    navigate(`/profile/${author.id}`);
  };

  return (
    <div className="bg-card rounded-xl p-4 mb-3 animate-fade-in">
      <div className="flex items-start mb-3">
        <Avatar
          src={author.avatar}
          alt={author.name}
          size="md"
          onClick={handleProfileClick}
          className="cursor-pointer"
        />
        <div className="ml-3 flex flex-col">
          <div className="flex items-center">
            <h4
              className="font-semibold text-foreground cursor-pointer hover:underline"
              onClick={handleProfileClick}
            >
              {author.name}
            </h4>
            {author.isVerified && (
              <span className="ml-1 text-nuumi-pink">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
            <span className="text-sm text-muted-foreground ml-2">· {author.timeAgo}</span>
          </div>
          <span
            className="text-sm text-muted-foreground cursor-pointer hover:underline"
            onClick={handleProfileClick}
          >
            @{author.username}
          </span>
        </div>
      </div>

      <p className="text-foreground mb-3 text-balance">{content}</p>

      {image && (
        <div className="rounded-xl overflow-hidden mb-3 bg-secondary/30 relative">
          <img
            src={image}
            alt="Post content"
            className="w-full object-cover max-h-96 transition-opacity duration-300"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <motion.button
          onClick={handleLike}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "flex items-center text-sm text-muted-foreground hover:text-nuumi-pink transition-colors",
            localLiked && "text-nuumi-pink"
          )}
        >
          <motion.div
            animate={isLikeAnimating ? {
              scale: [1, 1.5, 1],
              rotate: [0, -15, 15, -15, 0],
              transition: { duration: 0.5 }
            } : {}}
          >
            <Heart
              size={18}
              className={cn(
                "mr-1 transition-all",
                localLiked && "fill-nuumi-pink"
              )}
            />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.span
              key={localLikes}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              {localLikes}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.button
          onClick={() => {
            setIsCommentModalOpen(true);
            setIsCommentAnimating(true);
            onComment?.();
            setTimeout(() => setIsCommentAnimating(false), 500);
          }}
          whileTap={{ scale: 0.9 }}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <motion.div
            animate={isCommentAnimating ? {
              y: [0, -5, 0],
              transition: { duration: 0.5 }
            } : {}}
          >
            <MessageSquare size={18} className="mr-1" />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.span
              key={localComments}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
            >
              {localComments}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.button
          onClick={handleRepost}
          whileTap={{ scale: 0.9 }}
          className="flex items-center text-sm text-muted-foreground hover:text-green-500 transition-colors"
        >
          <motion.div
            animate={isRepostAnimating ? {
              rotate: [0, 0, 360],
              transition: { duration: 0.5 }
            } : {}}
          >
            <Repeat2 size={18} className="mr-1" />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.span
              key={localReposts}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              {localReposts}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.button
          onClick={handleShare}
          whileTap={{ scale: 0.9 }}
          className="flex items-center text-sm text-muted-foreground hover:text-blue-500 transition-colors"
        >
          <motion.div
            animate={isShareAnimating ? {
              x: [0, 10, 0],
              transition: { duration: 0.3 }
            } : {}}
          >
            <Send size={18} />
          </motion.div>
        </motion.button>
      </div>

      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        postId={id}
        postTitle={content.length > 30 ? `${content.substring(0, 30)}...` : content}
        currentUser={currentUser}
        postAuthor={{
          id: author.id,
          username: author.username
        }}
      />
    </div>
  );
};

export default Post;
