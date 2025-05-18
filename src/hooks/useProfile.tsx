
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  is_verified: boolean | null;
  created_at: string;
  updated_at: string;
}

interface UseProfileResult {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useProfile = (userId?: string): UseProfileResult => {
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async (): Promise<Profile | null> => {
    try {
      let profileId = userId;

      // If no userId is provided, get the current user's profile
      if (!profileId) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          throw new Error('No authenticated user');
        }
        profileId = sessionData.session.user.id;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (fetchError) throw fetchError;

      return data as Profile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      toast.error('Failed to load profile');
      return null;
    }
  };

  const {
    data: profile,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['profile', userId],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  return {
    profile,
    isLoading,
    error,
    refetch: async () => { await refetch(); }
  };
};
