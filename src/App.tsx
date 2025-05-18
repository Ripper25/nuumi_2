
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React from "react";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Navbar from "./components/layout/Navbar";
import Marketplace from "./pages/Marketplace";
import CreatePost from "./pages/CreatePost";
import Chats from "./pages/Chats";
import Notifications from "./pages/Notifications";
import PostView from "./pages/PostView";
import TestChat from "./pages/TestChat";
import MealPlanning from "./pages/MealPlanning";
import CreateMeal from "./pages/CreateMeal";
import ThemeProvider from "./components/theme/ThemeProvider";

// Import global CSS for comments
import "./components/comments/comments.css";

// Create a wrapper component that conditionally renders the Navbar
const ConditionalNavbar = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Only show navbar on these routes
  const showNavbarRoutes = ['/feed', '/chats', '/profile', '/marketplace', '/create', '/notifications', '/post', '/meal-planning', '/create-meal'];

  // Routes that should hide the navbar (like when in a specific conversation)
  const hideNavbarRoutes = ['/chats/'];

  // Check if the current route matches any of the routes that should hide the navbar
  const shouldHideNavbar = hideNavbarRoutes.some(route =>
    pathname.startsWith(route) && pathname.length > route.length
  );

  // Check if the current route should display navbar
  const shouldShowNavbar = !shouldHideNavbar && showNavbarRoutes.some(route =>
    pathname === route || (route !== '/' && pathname.startsWith(route + '/'))
  );

  return shouldShowNavbar ? <Navbar /> : null;
};

// Routes with conditional Navbar
const AppRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/chats/*" element={<Chats />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/post/:postId" element={<PostView />} />
        <Route path="/test-chat" element={<TestChat />} />
        <Route path="/meal-planning" element={<MealPlanning />} />
        <Route path="/create-meal" element={<CreateMeal />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ConditionalNavbar />
    </>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
