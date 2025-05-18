
import React from 'react';
import { X } from 'lucide-react';

interface MediaPreviewProps {
  mediaType: 'image' | 'video';
  preview: string | null;
  onRemove: () => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  mediaType,
  preview,
  onRemove
}) => {
  if (!preview) return null;
  
  return (
    <div className="relative aspect-[9/16] bg-muted rounded-lg overflow-hidden mb-4">
      {mediaType === 'image' ? (
        <img
          src={preview}
          alt="Preview"
          className="w-full h-full object-contain"
        />
      ) : (
        <video
          src={preview}
          className="w-full h-full object-contain"
          controls
        />
      )}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/80 transition-colors"
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default MediaPreview;
