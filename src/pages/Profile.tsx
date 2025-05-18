import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileBio from '@/components/profile/ProfileBio';
import ProfileActions from '@/components/profile/ProfileActions';
import SupportCard from '@/components/support/SupportCard';
import { Utensils, Baby, Wallet, MapPin, Loader2, Camera, MessageCircle, Settings } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import SettingsDialog from '@/components/profile/SettingsDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Post from '@/components/shared/Post';
import Navbar from '@/components/layout/Navbar';

interface ProfilePageParams {
  [key: string]: string | undefined;
  userId?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams<ProfilePageParams>();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const { profile, isLoading, error, refetch } = useProfile(userId);
  const [posts, setPosts] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [postsCount, setPostsCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isCurrentUserProfile, setIsCurrentUserProfile] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoadingSession(true);
      const { data } = await supabase.auth.getSession();
      setCurrentUser(data.session?.user || null);

      if (data.session?.user) {
        if (!userId) {
          setIsCurrentUserProfile(true);
        } else {
          setIsCurrentUserProfile(userId === data.session.user.id);
        }
      } else {
        setIsCurrentUserProfile(false);
      }

      setIsLoadingSession(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setCurrentUser(session?.user || null);

        if (session?.user) {
          if (!userId) {
            setIsCurrentUserProfile(true);
          } else {
            setIsCurrentUserProfile(userId === session.user.id);
          }
        } else {
          setIsCurrentUserProfile(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;

      setIsLoadingStats(true);

      const { count: followersCount, error: followersError } = await supabase
        .from('followers')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', profile.id);

      if (followersError) {
        console.error('Error fetching followers count:', followersError);
      } else {
        setFollowersCount(followersCount || 0);
      }

      const { count: followingCount, error: followingError } = await supabase
        .from('followers')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', profile.id);

      if (followingError) {
        console.error('Error fetching following count:', followingError);
      } else {
        setFollowingCount(followingCount || 0);
      }

      const { count: postsCount, error: postsError } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      if (postsError) {
        console.error('Error fetching posts count:', postsError);
      } else {
        setPostsCount(postsCount || 0);
      }

      if (currentUser?.id) {
        const { data: followData, error: followError } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id)
          .maybeSingle();

        if (followError) {
          console.error('Error checking follow status:', followError);
        } else {
          setIsFollowing(!!followData);
        }
      }

      setIsLoadingStats(false);
    };

    fetchStats();
  }, [profile?.id, currentUser?.id]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!profile?.id) return;

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, content, image_url, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return;
      }

      if (!postsData) return;

      const formattedPosts = postsData.map(post => ({
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        created_at: post.created_at,
        author: {
          id: profile.id,
          name: profile.display_name || profile.username || 'Anonymous',
          username: profile.username || 'anonymous',
          avatar_url: profile.avatar_url,
          is_verified: profile.is_verified
        },
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0,
        isLiked: false
      }));

      const postsWithMetrics = await Promise.all(
        formattedPosts.map(async (post) => {
          const { count: likesCount, error: likesError } = await supabase
            .from('likes')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id);

          if (likesError) {
            console.error('Error fetching likes count:', likesError);
          }

          const { count: commentsCount, error: commentsError } = await supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id);

          if (commentsError) {
            console.error('Error fetching comments count:', commentsError);
          }

          const { count: repostsCount, error: repostsError } = await supabase
            .from('reposts')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id);

          if (repostsError) {
            console.error('Error fetching reposts count:', repostsError);
          }

          let isLiked = false;
          if (currentUser?.id) {
            const { data: likeData, error: likeError } = await supabase
              .from('likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', currentUser.id)
              .maybeSingle();

            if (likeError) {
              console.error('Error checking like status:', likeError);
            } else {
              isLiked = !!likeData;
            }
          }

          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            reposts_count: repostsCount || 0,
            isLiked
          };
        })
      );

      setPosts(postsWithMetrics);
    };

    fetchPosts();
  }, [profile?.id, currentUser?.id]);

  const handleAvatarClick = (event: React.MouseEvent) => {
    if (isCurrentUserProfile) {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          try {
            toast.loading('Uploading avatar...');

            // To be handled by the edit profile form
            // This is a placeholder - the actual implementation is in the EditProfileForm
          } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('Failed to upload avatar');
          }
        }
      };
      fileInput.click();
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    if (!profile?.id || currentUser.id === profile.id) return;

    // Show loading state
    const loadingToast = toast.loading(isFollowing ? 'Unfollowing...' : 'Following...');

    try {
      if (isFollowing) {
        // First check if the follow relationship exists
        const { data: existingFollow, error: checkError } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 means not found, which is expected if not following
          throw checkError;
        }

        if (!existingFollow) {
          // Already not following, just update UI
          setIsFollowing(false);
          toast.dismiss(loadingToast);
          return;
        }

        // Delete the follow relationship
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('id', existingFollow.id);

        if (error) throw error;

        // Update UI state
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast.dismiss(loadingToast);
        toast.success(`Unfollowed ${profile.display_name || profile.username || 'user'}`);
      } else {
        // First check if already following to prevent duplicates
        const { data: existingFollow, error: checkError } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingFollow) {
          // Already following, just update UI
          setIsFollowing(true);
          toast.dismiss(loadingToast);
          return;
        }

        // Insert new follow relationship
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id
          });

        if (error) throw error;

        // Update UI state
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.dismiss(loadingToast);
        toast.success(`Following ${profile.display_name || profile.username || 'user'}`);
      }
    } catch (error: any) {
      console.error('Error toggling follow status:', error);
      toast.dismiss(loadingToast);

      // More specific error message
      if (error.code === '23505') {
        // Unique constraint violation - already following
        toast.error('You are already following this user');
        // Refresh the UI state to be consistent
        setIsFollowing(true);
      } else if (error.code === '23503') {
        // Foreign key violation
        toast.error('User not found');
      } else {
        toast.error('Failed to update follow status');
      }
    }
  };

  const handleStartChat = () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    if (!profile?.id || currentUser.id === profile.id) return;

    navigate(`/chats/user/${profile.id}`);
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

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      toast.error('Please sign in to like posts');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);

        if (error) throw error;

        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, isLiked: false, likes_count: p.likes_count - 1 }
            : p
        ));
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: currentUser.id
          });

        if (error) throw error;

        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, isLiked: true, likes_count: p.likes_count + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    }
  };

  const displayName = profile?.display_name || 'User Profile';
  const username = profile?.username || 'username';
  const location = profile?.location;
  const bio = profile?.bio;
  const avatarUrl = profile?.avatar_url;

  if (isLoading || isLoadingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }

  // Settings button for the header
  const settingsButton = isCurrentUserProfile ? (
    <SettingsDialog
      trigger={
        <button className="action-button hover:bg-secondary transition-colors">
          <Settings className="h-5 w-5" />
        </button>
      }
    />
  ) : null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        showBackButton={!isCurrentUserProfile}
        onBackClick={() => navigate(-1)}
        rightContent={settingsButton}
      />

      <div className="max-w-md mx-auto">
        <ProfileHeader
          avatar={avatarUrl || undefined}
          onAvatarClick={handleAvatarClick}
          isCurrentUser={isCurrentUserProfile}
        />

        <ProfileStats
          posts={postsCount}
          followers={followersCount}
          following={followingCount}
          userId={profile?.id}
          currentUserId={currentUser?.id}
        />

        <ProfileBio
          username={username}
          displayName={displayName}
          bio={bio || undefined}
          location={location || undefined}
        >
          {isCurrentUserProfile && !location && (
            <div className="flex items-center text-sm text-muted-foreground mb-1 justify-center">
              <MapPin size={14} className="mr-1 text-nuumi-pink" />
              <span>Add your neighborhood</span>
            </div>
          )}

          {isCurrentUserProfile && (
            <div className="text-sm text-muted-foreground mt-2">
              {!bio ? 'Add child age • Add dietary needs' : ''}
              <EditProfileDialog
                trigger={
                  <span className="text-nuumi-pink ml-1 font-medium cursor-pointer">
                    {bio ? 'Edit Profile' : 'Edit'}
                  </span>
                }
                initialData={{
                  username: username === 'username' ? '' : username,
                  displayName: displayName === 'User Profile' ? '' : displayName,
                  bio: bio || '',
                  location: location || '',
                  avatarUrl: avatarUrl || undefined
                }}
              />
            </div>
          )}
        </ProfileBio>

        <ProfileActions
          isCurrentUser={isCurrentUserProfile}
          onEditProfile={() => {}}
          isFollowing={isFollowing}
          userId={profile?.id}
          onFollow={handleFollowToggle}
          onMessage={handleStartChat}
          editProfileButton={
            isCurrentUserProfile ? (
              <button
                className="w-full bg-nuumi-pink text-white rounded-full py-2.5 font-medium flex items-center justify-center transition-all hover:bg-nuumi-pink/90 mb-6"
                onClick={() => navigate('/create')}
              >
                Add Post
              </button>
            ) : (
              <div className="flex space-x-3 px-4 mb-6">
                <button
                  className={`flex-1 py-2.5 rounded-full font-medium transition-all flex items-center justify-center ${
                    isFollowing
                      ? 'border border-nuumi-pink text-nuumi-pink'
                      : 'bg-nuumi-pink text-white hover:bg-nuumi-pink/90'
                  }`}
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>

                <button
                  className="flex-1 border border-nuumi-pink text-nuumi-pink rounded-full py-2.5 font-medium flex items-center justify-center transition-all hover:bg-nuumi-pink/10"
                  onClick={handleStartChat}
                >
                  <MessageCircle size={18} className="mr-2" />
                  Message
                </button>
              </div>
            )
          }
        />

        {isCurrentUserProfile && (
          <div className="px-4">
            <div className="mb-3">
              <h3 className="text-lg font-semibold mb-3">Mom Support</h3>
              <div className="grid grid-cols-3 gap-3">
                <SupportCard
                  icon={Utensils}
                  title="Baby & Mother Meals"
                  onClick={() => navigate('/meal-planning')}
                />

                <SupportCard
                  icon={Baby}
                  title="Find Care"
                  onClick={() => console.log('Find Care clicked')}
                />

                <SupportCard
                  icon={Wallet}
                  title="Wallet"
                  onClick={() => console.log('Wallet clicked')}
                />
              </div>
            </div>
          </div>
        )}

        <div className="px-4 mt-6">
          <h3 className="text-lg font-semibold mb-3">Posts</h3>

          {posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map(post => (
                <Post
                  key={post.id}
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
                  onLike={() => handleLike(post.id)}
                  onComment={() => {}}
                  onRepost={() => {}}
                  onShare={() => handleShare(post.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              <p>{isCurrentUserProfile ? 'Share your first post with other moms' : 'No posts yet'}</p>
            </div>
          )}
        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default Profile;
