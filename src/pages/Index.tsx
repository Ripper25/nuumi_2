
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        // Logged in, always redirect to feed
        navigate('/feed');
      } else {
        // Not logged in, check if first time user
        const hasShownOnboarding = localStorage.getItem('hasShownOnboarding');

        if (hasShownOnboarding === 'true') {
          // Not first time, redirect to auth
          navigate('/auth');
        } else {
          // First time, redirect to onboarding
          navigate('/onboarding');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="flex flex-col items-center justify-center">
            <img
              src="/assets/LOGO.png"
              alt="nuumi - For every mom"
              className="w-64 md:w-80 max-w-full h-auto mb-4"
            />
            <p className="text-muted-foreground animate-pulse">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
