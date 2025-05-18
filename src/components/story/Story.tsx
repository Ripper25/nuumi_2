import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Image, Video, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export interface StoryMediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface StoryItem {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  media: StoryMediaItem[];
  caption?: string;
  createdAt: string;
}

interface StoryProps {
  story: StoryItem;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  duration?: number; // Duration in seconds for auto-advance
  isPaused?: boolean; // Add isPaused prop
  onTogglePause?: () => void; // Add onTogglePause prop
}

const Story: React.FC<StoryProps> = ({
  story,
  onClose,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  duration = 5,
  isPaused = false, // Default to false if not provided
  onTogglePause // Optional callback for external pause control
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);

  // Ensure story has media
  if (!story.media || story.media.length === 0) {
    story.media = [{ type: 'image', url: story.user.avatar || '' }];
  }

  // Ensure currentMediaIndex is valid
  const safeMediaIndex = Math.min(currentMediaIndex, story.media.length - 1);
  const currentMedia = story.media[safeMediaIndex];
  const isVideo = currentMedia?.type === 'video';

  // Handle media loading
  const handleMediaLoad = () => {
    setIsLoading(false);
    startProgressTimer();
  };

  // Handle video-specific events
  const handleVideoEnded = () => {
    goToNextMedia();
  };

  // Progress timer for auto-advancing
  const startProgressTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    if (!isPaused) {
      // For images, use timer to advance
      if (!isVideo) {
        const interval = 50; // Update progress every 50ms
        const totalSteps = (duration * 1000) / interval;
        let currentStep = 0;

        timerRef.current = window.setInterval(() => {
          currentStep++;
          setProgress((currentStep / totalSteps) * 100);

          if (currentStep >= totalSteps) {
            window.clearInterval(timerRef.current!);
            goToNextMedia();
          }
        }, interval);
      } else if (videoRef.current) {
        // For videos, use the video's duration
        const interval = 50;
        timerRef.current = window.setInterval(() => {
          if (videoRef.current) {
            const percentage = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(percentage);
          }
        }, interval);
      }
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  // Reset when story changes
  useEffect(() => {
    setCurrentMediaIndex(0);
    setIsLoading(true);
    setProgress(0);
  }, [story.id]);

  // Handle media changes
  useEffect(() => {
    setIsLoading(true);
    setProgress(0);

    if (isVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      if (!isPaused) {
        videoRef.current.play().catch(err => console.error("Error playing video:", err));
      }
    }

    startProgressTimer();
  }, [currentMediaIndex, isPaused, isVideo]);

  // Go to next media
  const goToNextMedia = () => {
    if (currentMediaIndex < story.media.length - 1) {
      setCurrentMediaIndex(prev => prev + 1);
    } else if (onNext) {
      onNext();
    } else {
      onClose();
    }
  };

  // Go to previous media
  const goToPreviousMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
    } else if (onPrevious) {
      onPrevious();
    }
  };

  // Toggle pause/play
  const togglePause = () => {
    // If external control is provided, use it
    if (onTogglePause) {
      onTogglePause();
      return;
    }

    // Otherwise handle pause internally
    const newPausedState = !isPaused;

    if (isVideo && videoRef.current) {
      if (newPausedState) {
        videoRef.current.pause();
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }
      } else {
        videoRef.current.play().catch(err => console.error("Error playing video:", err));
        startProgressTimer();
      }
    } else {
      // For images
      if (newPausedState) {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }
      } else {
        startProgressTimer();
      }
    }
  };

  // Toggle mute for videos
  const toggleMute = () => {
    setIsMuted(prev => {
      const newMuteState = !prev;
      if (videoRef.current) {
        videoRef.current.muted = newMuteState;
      }
      return newMuteState;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {/* Close button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="text-white bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors"
          aria-label="Close story"
        >
          <X size={24} />
        </button>
      </div>

      <div className="relative w-full h-full max-w-md max-h-[80vh] mx-auto">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 z-10 p-2 flex items-center gap-1">
          {story.media.map((_, index) => (
            <div key={index} className="h-1 bg-white/30 rounded-full flex-1">
              <div
                className={cn(
                  "h-full bg-white rounded-full transition-all duration-100",
                  index < currentMediaIndex ? "w-full" :
                  index === currentMediaIndex ? `w-[${progress}%]` : "w-0"
                )}
                style={index === currentMediaIndex ? { width: `${progress}%` } : undefined}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
          <div className="flex items-center space-x-3">
            <Avatar
              src={story.user.avatar}
              alt={story.user.name}
              size="md"
            />
            <div>
              <h4 className="text-white font-semibold">{story.user.name}</h4>
              <p className="text-white/70 text-sm">{new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="h-full w-full flex items-center justify-center relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              {isVideo ? (
                <Video size={48} className="text-white/50 animate-pulse" />
              ) : (
                <Image size={48} className="text-white/50 animate-pulse" />
              )}
            </div>
          )}

          {isVideo ? (
            <video
              ref={videoRef}
              src={currentMedia.url}
              className={cn(
                "w-full h-full object-contain",
                isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300"
              )}
              onLoadedData={handleMediaLoad}
              onEnded={handleVideoEnded}
              muted={isMuted}
              playsInline
              autoPlay={!isPaused}
              loop={false}
            />
          ) : (
            <img
              src={currentMedia.url}
              alt={story.caption || "Story image"}
              className={cn(
                "w-full h-full object-contain",
                isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300"
              )}
              onLoad={handleMediaLoad}
            />
          )}

          {/* Media controls overlay */}
          <div
            className="absolute inset-0 z-10"
            onClick={(e) => {
              // Determine click position to navigate or pause
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const width = rect.width;

              if (x < width * 0.3) {
                // Left third of screen - go back
                goToPreviousMedia();
              } else if (x > width * 0.7) {
                // Right third of screen - go forward
                goToNextMedia();
              } else {
                // Middle - toggle pause
                togglePause();
              }
            }}
          />

          {/* Video controls */}
          {isVideo && !isLoading && (
            <div className="absolute bottom-16 right-4 flex space-x-2 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePause();
                }}
                className="text-white bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors"
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="text-white bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
          )}

          {/* Caption */}
          {story.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-center">{story.caption}</p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {hasPrevious && (
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors text-white"
            onClick={(e) => {
              e.stopPropagation();
              onPrevious?.();
            }}
            aria-label="Previous story"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {hasNext && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors text-white"
            onClick={(e) => {
              e.stopPropagation();
              onNext?.();
            }}
            aria-label="Next story"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Story;
