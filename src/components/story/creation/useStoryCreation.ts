
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

export interface StoryCreationHookProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const useStoryCreation = ({ onClose, onSuccess }: StoryCreationHookProps) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to resize and compress image
  const resizeAndCompressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      // Create an image object
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        // Max dimensions
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality 0.85 (85%)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Could not create blob'));
            return;
          }

          // Create new file from blob
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          // Revoke object URL to free memory
          URL.revokeObjectURL(img.src);

          resolve(resizedFile);
        }, 'image/jpeg', 0.85);
      };

      img.onerror = () => {
        reject(new Error('Error loading image'));
        URL.revokeObjectURL(img.src);
      };
    });
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }

    const file = files[0];
    console.log("File selected:", file.name, file.type, file.size);

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast.error('Please select an image or video file');
      return;
    }

    if (isVideo && file.size > 50 * 1024 * 1024) {
      toast.error('Video size should be less than 50MB');
      return;
    }

    if (isImage && file.size > 20 * 1024 * 1024) {
      toast.error('Image size should be less than 20MB');
      return;
    }

    // Create preview immediately for better UX
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // For images, optimize before uploading
      if (isImage) {
        const optimizedFile = await resizeAndCompressImage(file);
        console.log(`Original size: ${(file.size / 1024).toFixed(2)}KB, Optimized: ${(optimizedFile.size / 1024).toFixed(2)}KB`);
        setMediaFile(optimizedFile);
      } else {
        setMediaFile(file);
      }

      setMediaType(isVideo ? 'video' : 'image');
    } catch (error) {
      console.error('Error processing file:', error);
      // Fallback to original file
      setMediaFile(file);
      setMediaType(isVideo ? 'video' : 'image');
    }
  };

  // Handle media upload button click
  const handleUploadClick = (type: 'image' | 'video') => {
    console.log("Upload click for type:", type);
    setMediaType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
      fileInputRef.current.click();
    } else {
      console.error("File input ref is null");
    }
  };

  // Remove selected media
  const handleRemoveMedia = () => {
    setMediaFile(null);
    setPreview(null);
    // Reset the file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit the story
  const handleSubmit = async () => {
    if (!mediaFile) {
      toast.error('Please select a media file');
      return;
    }

    try {
      setIsSubmitting(true);

      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You need to be logged in to post stories');
        return;
      }

      // Prepare file for upload
      const isImage = mediaType === 'image';
      const fileExt = isImage ? 'jpg' : mediaFile.name.split('.').pop();
      const uniqueId = nanoid();
      const fileName = `${uniqueId}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      console.log("Uploading file to path:", filePath);

      // Add retry logic for upload
      let uploadAttempts = 0;
      const maxAttempts = 3;
      let uploadError = null;
      let uploadData = null;

      while (uploadAttempts < maxAttempts) {
        try {
          uploadAttempts++;
          console.log(`Upload attempt ${uploadAttempts}/${maxAttempts}`);

          const result = await supabase.storage
            .from('stories')
            .upload(filePath, mediaFile, {
              cacheControl: '3600',
              upsert: true // Use upsert to overwrite if file exists
            });

          uploadError = result.error;
          uploadData = result.data;

          if (!uploadError) {
            console.log("Upload successful on attempt", uploadAttempts);
            break; // Success, exit the retry loop
          }

          console.error(`Upload attempt ${uploadAttempts} failed:`, uploadError);

          // Wait before retrying (exponential backoff)
          if (uploadAttempts < maxAttempts) {
            const delay = 1000 * Math.pow(2, uploadAttempts - 1); // 1s, 2s, 4s
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (e) {
          console.error(`Unexpected error during upload attempt ${uploadAttempts}:`, e);
          uploadError = e;
        }
      }

      // If all attempts failed, throw the last error
      if (uploadError) {
        console.error('All upload attempts failed:', uploadError);
        throw new Error(`Failed to upload media after ${maxAttempts} attempts: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: publicURLData } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath);

      if (!publicURLData || !publicURLData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Add cache-busting parameter to prevent browser caching
      const publicUrl = `${publicURLData.publicUrl}?t=${Date.now()}`;
      console.log("File uploaded successfully, public URL:", publicUrl);

      // Create the story in the database
      const { error: dbError } = await supabase
        .from('stories')
        .insert({
          user_id: session.user.id,
          image_url: publicUrl,
          caption: caption.trim() || null,
          // Expires after 24 hours
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save story: ${dbError.message}`);
      }

      toast.success('Story posted successfully');
      onSuccess?.();
      onClose();

    } catch (error: any) {
      console.error('Error posting story:', error);
      toast.error(error.message || 'Failed to post story');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
};
