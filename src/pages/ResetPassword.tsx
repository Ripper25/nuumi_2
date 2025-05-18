
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  // Check if we have a "recovered" event when coming from reset password email
  useEffect(() => {
    const checkHashParams = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        // Hash includes recovery token
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          toast.error("Your password reset link has expired or is invalid");
          navigate('/auth');
        } else if (!data.session) {
          toast.error("Your password reset link has expired or is invalid");
          navigate('/auth');
        }
      } else {
        // No recovery token in URL, redirect to forgot password
        navigate('/forgot-password');
      }
    };

    checkHashParams();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success('Password has been reset successfully!');
      
      // Sign the user out and redirect to login
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while resetting your password');
      console.error('Update password error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/3f006055-b9a4-4322-9a83-427e9aa8b18b.png" 
            alt="nuumi - For every mom" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold">Set New Password</h1>
          <p className="text-muted-foreground mt-2">
            Create a new password for your account
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-lg">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-nuumi-pink hover:bg-nuumi-pink/90"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
