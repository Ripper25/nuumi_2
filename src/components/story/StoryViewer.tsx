
import React, { useState, useEffect } from 'react';
import Story, { StoryItem } from './Story';

interface StoryViewerProps {
  stories: StoryItem[];
  initialStoryIndex?: number;
  onClose: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialStoryIndex = 0,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < stories.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') { // Space bar to toggle pause
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, stories.length, onClose]);

  // Handle document visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Validate stories array
  if (!stories || stories.length === 0) return null;

  // Sort stories by creation date (newest first)
  const sortedStories = [...stories].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Make sure currentIndex is valid
  const safeIndex = Math.min(currentIndex, sortedStories.length - 1);
  const currentStory = sortedStories[safeIndex];

  return (
    <Story
      story={currentStory}
      onClose={onClose}
      onNext={currentIndex < sortedStories.length - 1 ? () => setCurrentIndex(prev => prev + 1) : undefined}
      onPrevious={currentIndex > 0 ? () => setCurrentIndex(prev => prev - 1) : undefined}
      hasNext={currentIndex < sortedStories.length - 1}
      hasPrevious={currentIndex > 0}
      isPaused={isPaused}
      onTogglePause={() => setIsPaused(prev => !prev)}
    />
  );
};

export default StoryViewer;
