
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Avatar from '../shared/Avatar';

interface ProfileStatsProps {
  posts: number;
  followers: number;
  following: number;
  className?: string;
  userId?: string;
  currentUserId?: string;
}

interface UserListItem {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isFollowing?: boolean;
}

const ProfileStats = ({ posts, followers, following, className, userId, currentUserId }: ProfileStatsProps) => {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<UserListItem[]>([]);
  const [followingList, setFollowingList] = useState<UserListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const navigate = useNavigate();

  // Load followers when dialog opens
  const loadFollowers = async () => {
    if (!userId) return;
    
    setLoadingList(true);
    
    // Get followers (people who follow this profile)
    const { data: followersData, error: followersError } = await supabase
      .from('followers')
      .select('follower_id')
      .eq('following_id', userId);
      
    if (followersError) {
      console.error('Error fetching followers:', followersError);
      setLoadingList(false);
      return;
    }
    
    if (!followersData || followersData.length === 0) {
      setFollowersList([]);
      setLoadingList(false);
      return;
    }
    
    const followerIds = followersData.map(f => f.follower_id);
    
    // Get profiles for followers
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', followerIds);
      
    if (profilesError) {
      console.error('Error fetching follower profiles:', profilesError);
      setLoadingList(false);
      return;
    }
    
    // Check which followers the current user is following (if logged in)
    let userFollowing: string[] = [];
    if (currentUserId) {
      const { data: following, error: followingError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', currentUserId);
        
      if (!followingError && following) {
        userFollowing = following.map(f => f.following_id);
      }
    }
    
    // Format the list
    const formattedList = profiles.map(profile => ({
      id: profile.id,
      name: profile.display_name || profile.username || 'User',
      username: profile.username || '',
      avatar: profile.avatar_url || undefined,
      isFollowing: userFollowing.includes(profile.id)
    }));
    
    setFollowersList(formattedList);
    setLoadingList(false);
  };
  
  // Load following when dialog opens
  const loadFollowing = async () => {
    if (!userId) return;
    
    setLoadingList(true);
    
    // Get following (people this profile follows)
    const { data: followingData, error: followingError } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', userId);
      
    if (followingError) {
      console.error('Error fetching following:', followingError);
      setLoadingList(false);
      return;
    }
    
    if (!followingData || followingData.length === 0) {
      setFollowingList([]);
      setLoadingList(false);
      return;
    }
    
    const followingIds = followingData.map(f => f.following_id);
    
    // Get profiles for following
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', followingIds);
      
    if (profilesError) {
      console.error('Error fetching following profiles:', profilesError);
      setLoadingList(false);
      return;
    }
    
    // Check which users the current user is following (if logged in)
    let userFollowing: string[] = [];
    if (currentUserId) {
      const { data: following, error: followingError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', currentUserId);
        
      if (!followingError && following) {
        userFollowing = following.map(f => f.following_id);
      }
    }
    
    // Format the list
    const formattedList = profiles.map(profile => ({
      id: profile.id,
      name: profile.display_name || profile.username || 'User',
      username: profile.username || '',
      avatar: profile.avatar_url || undefined,
      isFollowing: userFollowing.includes(profile.id)
    }));
    
    setFollowingList(formattedList);
    setLoadingList(false);
  };
  
  // Handle follow/unfollow user
  const handleFollowToggle = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUserId) {
      navigate('/auth');
      return;
    }
    
    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);
      } else {
        // Follow
        await supabase
          .from('followers')
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId
          });
      }
      
      // Update lists
      if (showFollowers) {
        loadFollowers();
      } else if (showFollowing) {
        loadFollowing();
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    }
  };
  
  // Handle clicking on a user to view their profile
  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
    setShowFollowers(false);
    setShowFollowing(false);
  };
  
  useEffect(() => {
    if (showFollowers) {
      loadFollowers();
    }
  }, [showFollowers, userId]);
  
  useEffect(() => {
    if (showFollowing) {
      loadFollowing();
    }
  }, [showFollowing, userId]);
  
  return (
    <>
      <div className={cn("flex justify-center items-center gap-12 mb-6 animate-fade-in animate-delay-100", className)}>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">{posts}</span>
          <span className="text-sm text-muted-foreground">Posts</span>
        </div>
        
        <div 
          className="flex flex-col items-center cursor-pointer" 
          onClick={() => userId && setShowFollowers(true)}
        >
          <span className="text-2xl font-bold">{followers}</span>
          <span className="text-sm text-muted-foreground">Followers</span>
        </div>
        
        <div 
          className="flex flex-col items-center cursor-pointer"
          onClick={() => userId && setShowFollowing(true)}
        >
          <span className="text-2xl font-bold">{following}</span>
          <span className="text-sm text-muted-foreground">Following</span>
        </div>
      </div>
      
      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto my-4">
            {loadingList ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse">Loading...</div>
              </div>
            ) : followersList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No followers yet
              </div>
            ) : (
              <div className="space-y-4">
                {followersList.map(user => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div 
                      className="flex items-center flex-1 cursor-pointer" 
                      onClick={() => handleUserClick(user.id)}
                    >
                      <Avatar src={user.avatar} alt={user.name} size="md" />
                      <div className="ml-3">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    
                    {currentUserId && currentUserId !== user.id && (
                      <button
                        className={cn(
                          "px-4 py-1 text-sm font-medium rounded-full",
                          user.isFollowing 
                            ? "border border-muted-foreground text-foreground hover:border-foreground" 
                            : "bg-nuumi-pink text-white hover:bg-nuumi-pink/90"
                        )}
                        onClick={() => handleFollowToggle(user.id, !!user.isFollowing)}
                      >
                        {user.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Following Dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto my-4">
            {loadingList ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse">Loading...</div>
              </div>
            ) : followingList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Not following anyone yet
              </div>
            ) : (
              <div className="space-y-4">
                {followingList.map(user => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div 
                      className="flex items-center flex-1 cursor-pointer"
                      onClick={() => handleUserClick(user.id)}
                    >
                      <Avatar src={user.avatar} alt={user.name} size="md" />
                      <div className="ml-3">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    
                    {currentUserId && currentUserId !== user.id && (
                      <button
                        className="px-4 py-1 text-sm font-medium rounded-full border border-muted-foreground text-foreground hover:border-foreground"
                        onClick={() => handleFollowToggle(user.id, true)}
                      >
                        Following
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileStats;
