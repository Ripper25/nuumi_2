
import React from 'react';
import StoryCircle from './StoryCircle';
import { StoryItem } from './Story';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';
import { useState } from 'react';
import StoryCreation from './StoryCreation';
import StoryViewer from './StoryViewer';
import TabScroller from '../ui/tab-scroller';

interface StoriesRowProps {
  stories: StoryItem[];
  isLoading?: boolean;
  className?: string;
  currentUserId?: string;
}

const StoriesRow = ({
  stories,
  isLoading = false,
  className,
  currentUserId
}: StoriesRowProps) => {
  const [isAddingStory, setIsAddingStory] = useState(false);
  const [viewingStory, setViewingStory] = useState<{stories: StoryItem[], initialIndex: number} | null>(null);

  // Group stories by user and filter out current user's stories
  const groupedStories = React.useMemo(() => {
    if (!stories) return [];

    const userStories: Record<string, StoryItem[]> = {};

    stories.forEach(story => {
      const userId = story.user.id;
      // Skip current user's stories as they'll be shown in the "Add Story" circle
      if (userId === currentUserId) return;

      if (!userStories[userId]) {
        userStories[userId] = [];
      }
      userStories[userId].push(story);
    });

    return Object.values(userStories).map(userStoryGroup => {
      const latestStory = userStoryGroup.reduce((latest, current) => {
        return new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current;
      });

      return {
        ...latestStory,
        allStories: userStoryGroup
      };
    });
  }, [stories, currentUserId]);

  const handleAddStoryClick = () => {
    setIsAddingStory(true);
  };

  const handleStoryCreationClose = () => {
    setIsAddingStory(false);
  };

  const handleStoryCreationSuccess = () => {
    setIsAddingStory(false);
    // The stories list will be refreshed via the React Query invalidation in Feed.tsx
  };

  if (isLoading) {
    return (
      <TabScroller className={cn("pt-4 px-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center mr-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-3 w-16 mt-2" />
          </div>
        ))}
      </TabScroller>
    );
  }

  return (
    <>
      <TabScroller
        className={cn("pt-4 px-4", className)}
        itemClassName="mr-4 first:pl-0 last:pr-4"
      >
        {currentUserId && (
          <div className="flex flex-col items-center">
            {/* Check if current user has stories */}
            {(() => {
              // Find current user's stories
              const userStories = stories.filter(story => story.user.id === currentUserId);

              if (userStories.length > 0) {
                // User has stories, show their avatar with gradient border
                const latestStory = userStories.reduce((latest, current) => {
                  return new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current;
                });

                return (
                  <StoryCircle
                    key={latestStory.id}
                    name="Your Story"
                    avatar={latestStory.user.avatar}
                    isViewed={false}
                    onClick={() => setViewingStory({
                      stories: userStories,
                      initialIndex: userStories.findIndex(s => s.id === latestStory.id)
                    })}
                  />
                );
              } else {
                // User has no stories, show the "Add Story" button
                return (
                  <>
                    <div
                      className="relative w-16 h-16 rounded-full border-2 border-dashed border-nuumi-pink flex items-center justify-center cursor-pointer hover:bg-nuumi-pink/10 transition-colors"
                      onClick={handleAddStoryClick}
                    >
                      <Camera size={24} className="text-nuumi-pink" />
                    </div>
                    <span className="mt-1 text-xs text-center text-muted-foreground">
                      Add Story
                    </span>
                  </>
                );
              }
            })()}
          </div>
        )}

        {groupedStories.map((story, index) => (
          <StoryCircle
            key={story.id || index}
            name={story.user.name}
            avatar={story.user.avatar}
            isViewed={false} // You might want to add a way to track viewed stories
            onClick={() => setViewingStory({
              stories: story.allStories,
              initialIndex: 0
            })}
          />
        ))}
      </TabScroller>

      {isAddingStory && (
        <StoryCreation
          onClose={handleStoryCreationClose}
          onSuccess={handleStoryCreationSuccess}
        />
      )}

      {viewingStory && (
        <StoryViewer
          stories={viewingStory.stories}
          initialStoryIndex={viewingStory.initialIndex}
          onClose={() => setViewingStory(null)}
        />
      )}
    </>
  );
};

export default StoriesRow;
