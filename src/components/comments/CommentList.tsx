import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CommentItem, { CommentType } from './CommentItem';
import CommentInput from './CommentInput';
import { Loader2, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentListProps {
  postId: string;
  currentUser?: {
    id: string;
    avatarUrl?: string;
    username?: string;
  };
  postAuthor?: {
    id: string;
    username: string;
  };
  className?: string;
}

const CommentList: React.FC<CommentListProps> = ({
  postId,
  currentUser,
  postAuthor,
  className
}) => {
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const [newReplyIds, setNewReplyIds] = useState<string[]>([]); // Track IDs of newly added replies

  // Force refresh comments when the component mounts or when postId changes
  useEffect(() => {
    // Force a refresh of the comments data
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
  }, [postId, queryClient]);

  // Fetch comments with a more stable approach
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      try {
        console.log('Fetching comments for postId:', postId);

        // Fetch ALL comments for this post in a single query
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            profiles:user_id(id, display_name, username, avatar_url)
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // If there are no comments, return an empty array
        if (!data || data.length === 0) {
          return [];
        }

        // Process comments in a simpler way
        const processedComments = data.map(comment => {
          // Extract profile data
          const profile = comment.profiles || {};

          return {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            user_id: comment.user_id,
            post_id: comment.post_id,
            parent_id: comment.parent_id,
            author: {
              id: profile.id || comment.user_id,
              name: profile.display_name || profile.username || 'User',
              username: profile.username || 'user',
              avatar_url: profile.avatar_url
            },
            likes_count: 0, // We'll handle likes separately
            isLiked: false,
            replies: [] // Will be filled later
          };
        });

        const validComments = processedComments as CommentType[];

        // IMPROVED APPROACH FOR NESTED REPLIES

        // Create a map of all comments by ID for quick lookup
        const commentMap = new Map<string, CommentType>();
        validComments.forEach(comment => {
          // Ensure each comment has a replies array
          comment.replies = [];
          commentMap.set(comment.id, comment);
        });

        // Separate root comments and replies
        const rootComments: CommentType[] = [];

        // Process all comments to build the tree
        validComments.forEach(comment => {
          if (comment.parent_id) {
            // This is a reply - find its parent and add it to the parent's replies
            const parentComment = commentMap.get(comment.parent_id);
            if (parentComment) {
              if (!parentComment.replies) {
                parentComment.replies = [];
              }
              parentComment.replies.push(comment);
            } else {
              // If parent doesn't exist (shouldn't happen), treat as root
              rootComments.push(comment);
            }
          } else {
            // This is a root comment
            rootComments.push(comment);
          }
        });

        // Sort root comments by newest first
        const sortedComments = rootComments.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        console.log('Final sorted comments with replies:',
          sortedComments.map(c => ({
            id: c.id,
            content: c.content.substring(0, 20) + '...',
            replyCount: c.replies?.length || 0,
            replies: c.replies?.map(r => ({
              id: r.id,
              content: r.content.substring(0, 20) + '...'
            }))
          }))
        );

        return sortedComments;
      } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }
    },
    enabled: !!postId
  });

  // Handle adding a new comment
  const handleAddComment = async (content: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to comment');
      return;
    }

    try {
      // If replying to a comment, use the handleReply function
      if (replyingTo) {
        // Call handleReply with the content
        await handleReply(replyingTo.commentId, replyingTo.username, content);

        // Clear the reply state
        setReplyingTo(null);
      } else {
        // Regular comment (top-level) - we're commenting on the post itself
        const { data, error } = await supabase
          .from('comments')
          .insert({
            content,
            post_id: postId,
            user_id: currentUser.id,
            parent_id: null // Explicitly set to null for top-level comments
          })
          .select();

        if (error) throw error;

        // Store the new comment ID to highlight it
        if (data && data.length > 0) {
          setNewReplyIds(prev => [...prev, data[0].id]);

          // Remove the "new" status after 5 seconds
          setTimeout(() => {
            setNewReplyIds(prev => prev.filter(id => id !== data[0].id));
          }, 5000);
        }

        toast.success('Comment added');
      }

      // Invalidate query to refresh comments
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });

      // Update post comments count
      queryClient.invalidateQueries({ queryKey: ['posts'] });

    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comment deleted');

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });

    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  // Handle liking a comment
  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to like comments');
      return;
    }

    try {
      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: currentUser.id
          });

        if (error) throw error;
      }

      // No need to invalidate query as we're using optimistic updates in the UI

    } catch (error) {
      console.error('Error toggling comment like:', error);
      toast.error('Failed to update like');

      // If there was an error, refresh to get the correct state
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    }
  };

  // Handle reply - now with content parameter
  const handleReply = async (commentId: string, username: string, content?: string) => {
    if (content) {
      // This is the actual reply submission with content
      if (!currentUser) {
        toast.error('You must be logged in to reply');
        return;
      }

      try {
        // Insert the reply into the database
        const { data, error } = await supabase
          .from('comments')
          .insert({
            content,
            post_id: postId,
            user_id: currentUser.id,
            parent_id: commentId // Set the parent_id for nested replies
          })
          .select();

        if (error) {
          toast.error('Failed to add reply');
          return;
        }

        // Add the new reply to the newReplyIds state
        if (data && data.length > 0) {
          setNewReplyIds(prev => [...prev, data[0].id]);

          // Remove the "new" status after 5 seconds
          setTimeout(() => {
            setNewReplyIds(prev => prev.filter(id => id !== data[0].id));
          }, 5000);
        }

        // Show success message
        toast.success(`Reply to @${username} added`);

        // Force refresh data
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });

        // Find and click the dropdown button to show replies
        setTimeout(() => {
          const commentElement = document.getElementById(`comment-${commentId}`);
          if (commentElement) {
            const dropdownButton = commentElement.querySelector('button[class*="bg-nuumi-pink"]');
            if (dropdownButton) {
              (dropdownButton as HTMLButtonElement).click();
            }
          }
        }, 500);
      } catch (error) {
        toast.error('Failed to add reply');
      }
    } else {
      // This is just setting up the reply UI - no content yet
      setReplyingTo({ commentId, username });
    }
  };



  if (error) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        <p>Failed to load comments. Please try again.</p>
        <p className="text-xs text-red-500">{error.message}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Comment input */}
      <div className="comment-input-container">
        <CommentInput
          avatarUrl={currentUser?.avatarUrl}
          username={currentUser?.username || "You"}
          onSubmit={handleAddComment}
          placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
          replyingTo={replyingTo?.username || (postAuthor && !replyingTo ? postAuthor.username : undefined)}
          onCancelReply={() => setReplyingTo(null)}
          className="mb-4"
        />
      </div>

      {/* Comments list */}
      <div className="mt-2">
        <h3 className="text-base font-medium mb-4 flex items-center text-muted-foreground">
          <MessageSquare size={16} className="mr-2" />
          {comments?.length
            ? `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`
            : 'No comments yet'
          }
        </h3>

        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-3 border-b border-border">
              <div className="flex">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="ml-3 flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </div>
          ))
        ) : comments?.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments?.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <CommentItem
                  comment={{
                    ...comment,
                    isNew: newReplyIds.includes(comment.id),
                    replies: comment.replies?.length ? comment.replies.map(reply => ({
                      ...reply,
                      isNew: newReplyIds.includes(reply.id)
                    })) : []
                  }}
                  currentUserId={currentUser?.id}
                  onReply={handleReply}
                  onDelete={handleDeleteComment}
                  onLike={handleLikeComment}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default CommentList;
