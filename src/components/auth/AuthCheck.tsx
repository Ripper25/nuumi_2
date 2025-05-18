
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuth from '@/hooks/useAuth';

interface AuthCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const AuthCheck = ({ children, redirectTo = '/auth' }: AuthCheckProps) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to', redirectTo);
    return <Navigate to={redirectTo} />;
  }

  console.log('User is authenticated, rendering children');
  return <>{children}</>;
};

export default AuthCheck;
