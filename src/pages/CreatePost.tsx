
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import useAuth from '@/hooks/useAuth';

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleFileSelect = () => {
    console.log("File select button clicked");
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error("File input reference is null");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }

    const file = files[0];
    console.log("File selected:", file.name, file.type, file.size);

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You need to be logged in to post');
      navigate('/auth');
      return;
    }

    if (!content.trim() && !imageFile) {
      toast.error('Please add some content to your post');
      return;
    }

    try {
      setIsSubmitting(true);

      let imageUrl = null;

      // Upload image if one is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${nanoid()}.${fileExt}`;
        const filePath = `posts/${user.id}/${fileName}`;

        console.log("Uploading image to:", filePath);

        const { error: uploadError, data } = await supabase.storage
          .from('posts')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error(`Error uploading image: ${uploadError.message}`);
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        if (publicUrlData) {
          imageUrl = publicUrlData.publicUrl;
          console.log("Image uploaded successfully, URL:", imageUrl);
        }
      }

      // Create post in database
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          content: content.trim(),
          image_url: imageUrl,
          user_id: user.id
        });

      if (postError) {
        console.error("Post error:", postError);
        throw new Error(`Error creating post: ${postError.message}`);
      }

      toast.success('Post created successfully');
      navigate('/feed');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Create Post" />

      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="bg-card rounded-xl p-4 mb-4">
          <Textarea
            placeholder="What's on your mind?"
            className="border-0 focus-visible:ring-0 resize-none text-base min-h-[150px]"
            rows={6}
            value={content}
            onChange={handleTextChange}
            disabled={isSubmitting}
          />

          {imagePreview && (
            <div className="relative mt-3 rounded-xl overflow-hidden bg-secondary/30">
              <img
                src={imagePreview}
                alt="Post preview"
                className="w-full max-h-80 object-contain"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black/80 transition-colors"
                disabled={isSubmitting}
                aria-label="Remove image"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <button
              className="flex items-center text-nuumi-pink hover:text-nuumi-pink/80 transition-colors"
              onClick={handleFileSelect}
              disabled={isSubmitting}
              data-testid="add-photo-button"
            >
              <ImagePlus size={20} className="mr-2" />
              <span>Add Photo</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              data-testid="file-input"
            />

            <Button
              className="rounded-full px-6"
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !imageFile)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
