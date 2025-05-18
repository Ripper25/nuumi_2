
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import StoryHeader from './creation/StoryHeader';
import StoryFooter from './creation/StoryFooter';
import MediaSelector from './creation/MediaSelector';
import MediaPreview from './creation/MediaPreview';
import { useStoryCreation } from './creation/useStoryCreation';

interface StoryCreationProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const StoryCreation: React.FC<StoryCreationProps> = ({
  onClose,
  onSuccess
}) => {
  const {
    mediaFile,
    preview,
    mediaType,
    caption,
    isSubmitting,
    fileInputRef,
    setCaption,
    handleFileChange,
    handleUploadClick,
    handleRemoveMedia,
    handleSubmit
  } = useStoryCreation({ onClose, onSuccess });

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <StoryHeader onClose={onClose} />
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {preview ? (
            <MediaPreview 
              mediaType={mediaType} 
              preview={preview} 
              onRemove={handleRemoveMedia} 
            />
          ) : (
            <MediaSelector onSelectMediaType={handleUploadClick} />
          )}
          
          <Textarea
            placeholder="Add a caption to your story..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={200}
            className="resize-none mt-4"
          />
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={mediaType === 'image' ? 'image/*' : 'video/*'}
          />
        </div>
        
        {/* Footer */}
        <StoryFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isSubmitDisabled={!mediaFile}
        />
      </div>
    </div>
  );
};

export default StoryCreation;
