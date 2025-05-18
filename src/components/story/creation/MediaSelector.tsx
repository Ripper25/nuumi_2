
import React from 'react';
import { Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaSelectorProps {
  onSelectMediaType: (type: 'image' | 'video') => void;
}

const MediaSelector: React.FC<MediaSelectorProps> = ({
  onSelectMediaType
}) => {
  return (
    <div className="flex justify-center gap-4 my-4">
      <Button
        variant="outline"
        size="lg"
        className="flex-1 flex flex-col items-center py-6 gap-2"
        onClick={() => onSelectMediaType('image')}
        data-testid="select-image-button"
      >
        <Image size={28} />
        <span>Image</span>
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="flex-1 flex flex-col items-center py-6 gap-2"
        onClick={() => onSelectMediaType('video')}
        data-testid="select-video-button"
      >
        <Video size={28} />
        <span>Video</span>
      </Button>
    </div>
  );
};

export default MediaSelector;
