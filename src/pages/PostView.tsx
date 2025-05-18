import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Post from '@/components/shared/Post';
import Header from '@/components/layout/Header';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import useAuth from '@/hooks/useAuth';

// Define the PostType interface based on what we need
interface PostType {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  isLiked: boolean;
}

const PostView = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!postId) {
          setError('Post ID is missing');
          setLoading(false);
          return;
        }

        // Fetch the post with author information
        const { data, error: postError } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            image_url,
            created_at,
            user_id,
            profiles:profiles(id, username, display_name, avatar_url, is_verified)
          `)
          .eq('id', postId)
          .single();

        if (postError) {
          console.error('Error fetching post:', postError);
          setError('Could not load the post. It may have been deleted or is not available.');
          setLoading(false);
          return;
        }

        if (!data) {
          setError('Post not found');
          setLoading(false);
          return;
        }

        // Get likes count
        const { count: likesCount, error: likesError } = await supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (likesError) {
          console.error('Error fetching likes count:', likesError);
        }

        // Get comments count
        const { count: commentsCount, error: commentsError } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (commentsError) {
          console.error('Error fetching comments count:', commentsError);
        }

        // Get reposts count
        const { count: repostsCount, error: repostsError } = await supabase
          .from('reposts')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (repostsError) {
          console.error('Error fetching reposts count:', repostsError);
        }

        // Check if current user has liked the post
        let isLiked = false;
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user?.id) {
          const { data: likeData, error: likeError } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (likeError) {
            console.error('Error checking like status:', likeError);
          } else {
            isLiked = !!likeData;
          }
        }

        // Format the post data
        const formattedPost: PostType = {
          id: data.id,
          content: data.content,
          image_url: data.image_url,
          created_at: data.created_at,
          author: {
            id: data.profiles.id,
            name: data.profiles.display_name || data.profiles.username,
            username: data.profiles.username,
            avatar_url: data.profiles.avatar_url,
            is_verified: data.profiles.is_verified
          },
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          reposts_count: repostsCount || 0,
          isLiked
        };

        setPost(formattedPost);
      } catch (err) {
        console.error('Error in fetchPost:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // Fetch current user's profile information
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error);
            return;
          }

          setCurrentUserProfile(data);
        } catch (err) {
          console.error('Error in fetchCurrentUserProfile:', err);
        }
      }
    };

    fetchCurrentUserProfile();
  }, [user]);

  const handleBackToFeed = () => {
    navigate('/feed');
  };

  const handleLike = async (postId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Please sign in to like posts');
        return;
      }

      const userId = session.user.id;

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        // Update local state
        setPost(prev => prev ? {
          ...prev,
          likes_count: Math.max(0, prev.likes_count - 1),
          isLiked: false
        } : null);

      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: userId
          });

        // Update local state
        setPost(prev => prev ? {
          ...prev,
          likes_count: prev.likes_count + 1,
          isLiked: true
        } : null);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    }
  };

  const handleShare = (postId: string) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;

    if (navigator.share) {
      navigator.share({
        title: 'Check out this post on nuumi',
        text: 'I found this interesting post on nuumi',
        url: shareUrl,
      }).catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          toast.success('Post link copied to clipboard');
        })
        .catch(err => {
          console.error('Error copying to clipboard:', err);
          toast.error('Failed to copy link');
        });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton title="Post" />

      <div className="container max-w-md mx-auto pt-4 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
            <p className="mt-4 text-muted-foreground">Loading post...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[50vh] px-4 text-center">
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <h2 className="text-xl font-semibold mb-2">Post Not Found</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={handleBackToFeed} className="bg-nuumi-pink hover:bg-nuumi-pink/90">
                Back to Feed
              </Button>
            </div>
          </div>
        ) : post ? (
          <Post
            id={post.id}
            author={{
              id: post.author.id,
              name: post.author.name,
              username: post.author.username,
              avatar: post.author.avatar_url || undefined,
              isVerified: post.author.is_verified,
              timeAgo: new Date(post.created_at).toLocaleDateString()
            }}
            content={post.content}
            image={post.image_url || undefined}
            likes={post.likes_count}
            comments={post.comments_count}
            reposts={post.reposts_count}
            isLiked={post.isLiked}
            currentUser={user ? {
              id: user.id,
              avatarUrl: currentUserProfile?.avatar_url,
              username: currentUserProfile?.username,
              displayName: currentUserProfile?.display_name
            } : undefined}
            onLike={() => handleLike(post.id)}
            onComment={() => {}}
            onRepost={() => {}}
            onShare={() => handleShare(post.id)}
          />
        ) : null}
      </div>
    </div>
  );
};

export default PostView;
