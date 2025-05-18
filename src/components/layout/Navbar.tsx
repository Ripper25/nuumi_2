
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItemProps {
  emoji: string;
  label: string;
  path: string;
  isActive: boolean;
  onClick: (path: string) => void;
  badge?: number;
}

const NavItem = ({ emoji, label, path, isActive, onClick, badge }: NavItemProps) => (
  <Link
    to={path}
    className="flex flex-col items-center justify-center relative"
    onClick={() => onClick(path)}
  >
    <div className={cn(
      "relative flex items-center justify-center transition-all duration-300",
      isActive ? "scale-110" : "scale-100"
    )}>
      {isActive && (
        <motion.div
          layoutId="navIndicator"
          className="absolute inset-0 bg-nuumi-pink/10 rounded-full -m-1.5 w-9 h-9"
          initial={false}
          transition={{ type: "spring", duration: 0.5 }}
        />
      )}
      <span className={cn(
        "text-xl transition-all duration-300",
        isActive && "drop-shadow-[0_0_2px_rgba(255,105,180,0.6)]"
      )}>
        {emoji}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-nuumi-pink text-[10px] flex items-center justify-center text-white font-medium">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </div>
    <span className={cn(
      "text-[10px] mt-1 font-medium transition-all",
      isActive ? "opacity-100 text-nuumi-pink" : "opacity-70"
    )}>
      {label}
    </span>
  </Link>
);

const Navbar = () => {
  // Use this for non-router environments or fallback to '/' when not in a Router context
  const [activeTab, setActiveTab] = useState('/feed');
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  // Define navItems with emojis
  const navItems = [
    { emoji: '🏠', label: 'Home', path: '/feed' },
    { emoji: '👤', label: 'Profile', path: '/profile' },
  ];

  // Handle active tab setting
  const handleSetActiveTab = (path: string) => {
    setActiveTab(path);
    // Close action menu when navigating
    setActionMenuOpen(false);
  };

  // Toggle action menu
  const toggleActionMenu = () => {
    setActionMenuOpen(!actionMenuOpen);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center pb-1 z-50 pointer-events-none">
      {/* Backdrop for action menu */}
      <AnimatePresence>
        {actionMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setActionMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Action Menu Popup */}
      <AnimatePresence>
        {actionMenuOpen && (
          <motion.div
            className="absolute bottom-16 flex flex-col items-center w-full pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              duration: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
          >
            <div className="flex space-x-4 mb-2 pointer-events-auto">
              <Link
                to="/marketplace"
                className="bg-white dark:bg-card shadow-lg rounded-2xl p-3 flex flex-col items-center w-20 h-20 justify-center transform transition-transform hover:scale-105 hover:shadow-xl"
                onClick={() => setActionMenuOpen(false)}
              >
                <span className="text-3xl mb-1">🛍️</span>
                <span className="text-xs font-medium">Marketplace</span>
              </Link>

              <Link
                to="/create"
                className="bg-white dark:bg-card shadow-lg rounded-2xl p-3 flex flex-col items-center w-20 h-20 justify-center transform transition-transform hover:scale-105 hover:shadow-xl"
                onClick={() => setActionMenuOpen(false)}
              >
                <span className="text-3xl mb-1">✏️</span>
                <span className="text-xs font-medium">Add Post</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="max-w-md w-full mx-auto pointer-events-auto">
        <div className="relative flex items-center justify-around bg-card/90 backdrop-blur-xl border border-border/40 shadow-lg rounded-full px-6 py-2">
          {/* Home button */}
          <NavItem
            key={navItems[0].path}
            emoji={navItems[0].emoji}
            label={navItems[0].label}
            path={navItems[0].path}
            isActive={activeTab === navItems[0].path}
            onClick={handleSetActiveTab}
          />

          {/* Center Action Button with Groove */}
          <div className="relative -mt-4 px-3">
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-card rounded-full border border-border/40 -z-10"></div>
            <button
              onClick={toggleActionMenu}
              className={cn(
                "w-12 h-12 rounded-full bg-gradient-to-r from-nuumi-pink to-nuumi-pink/80 text-white shadow-lg",
                "flex items-center justify-center transform transition-all duration-300",
                "hover:shadow-nuumi-pink/20 hover:shadow-xl",
                actionMenuOpen ? "rotate-45 scale-110" : "scale-100"
              )}
            >
              <span className="text-2xl">{actionMenuOpen ? "✕" : "+"}</span>
            </button>
          </div>

          {/* Profile button */}
          <NavItem
            key={navItems[1].path}
            emoji={navItems[1].emoji}
            label={navItems[1].label}
            path={navItems[1].path}
            isActive={activeTab === navItems[1].path}
            onClick={handleSetActiveTab}
          />
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
