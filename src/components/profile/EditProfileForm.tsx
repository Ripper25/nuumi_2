
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, X, Upload, Loader2 } from 'lucide-react';
import Avatar from '../shared/Avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProfileFormValues {
  username: string;
  displayName: string;
  bio: string;
  location: string;
}

interface EditProfileFormProps {
  onClose: () => void;
  initialData?: {
    username?: string;
    displayName?: string;
    bio?: string;
    location?: string;
    avatarUrl?: string;
  };
}

const EditProfileForm = ({ onClose, initialData }: EditProfileFormProps) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialData?.avatarUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialData?.avatarUrl);

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      username: initialData?.username || '',
      displayName: initialData?.displayName || '',
      bio: initialData?.bio || '',
      location: initialData?.location || '',
    }
  });

  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedFile]);

  // Function to resize and compress image
  const resizeAndCompressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      // Create an image object
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        // Max dimensions
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

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

        // Convert to blob with quality 0.8 (80%)
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
        }, 'image/jpeg', 0.8);
      };

      img.onerror = () => {
        reject(new Error('Error loading image'));
        URL.revokeObjectURL(img.src);
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Only allow image files
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Check file size (max 10MB for original)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }

      try {
        // Create preview immediately for better UX
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Resize and compress in background
        const optimizedFile = await resizeAndCompressImage(file);
        console.log(`Original size: ${(file.size / 1024).toFixed(2)}KB, Optimized: ${(optimizedFile.size / 1024).toFixed(2)}KB`);

        setSelectedFile(optimizedFile);
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error('Error processing image');
        setSelectedFile(file); // Fallback to original file
      }
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!selectedFile) return avatarUrl || null;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('No authenticated user');
      }

      const userId = sessionData.session.user.id;
      const fileExt = 'jpg'; // Always use jpg for consistency since we're converting to jpeg
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`; // Add timestamp to prevent caching issues

      // Create a simulated progress indicator since Supabase doesn't provide upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // Simulate progress up to 90% (the last 10% will be set after successful upload)
          const newProgress = prev + (90 - prev) * 0.1;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 100);

      // Upload the file
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, {
          upsert: true,
          cacheControl: '3600' // 1 hour cache
        });

      clearInterval(progressInterval);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setUploadProgress(95); // Almost done

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      setUploadProgress(100); // Complete

      // Add a cache-busting parameter to the URL to prevent browser caching
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      console.log('Avatar uploaded successfully:', publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
      return avatarUrl || null;
    } finally {
      // Small delay before hiding the progress bar for better UX
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('No authenticated user');
      }

      const userId = sessionData.session.user.id;

      // Upload avatar if a new file is selected
      let newAvatarUrl = selectedFile ? await uploadAvatar() : avatarUrl;

      // Prepare profile data
      const profileData = {
        username: values.username.trim(),
        display_name: values.displayName.trim(),
        bio: values.bio.trim(),
        location: values.location.trim(),
        updated_at: new Date().toISOString()
      };

      // Only include avatar_url if it exists
      if (newAvatarUrl !== undefined) {
        profileData['avatar_url'] = newAvatarUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);

      if (error) {
        console.error('Profile update error:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      // Invalidate profile queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      // Force a window reload to ensure all components reflect the updated profile
      setTimeout(() => {
        window.location.reload();
      }, 500);

      toast.success('Profile updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const removeAvatar = () => {
    setSelectedFile(null);
    setPreviewUrl(undefined);
    setAvatarUrl(undefined);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <Avatar
              src={previewUrl}
              alt="Profile"
              size="xl"
              className="border-2 border-nuumi-pink"
            />

            {(previewUrl || avatarUrl) && (
              <button
                onClick={removeAvatar}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
              >
                <X size={16} className="text-gray-700" />
              </button>
            )}

            <div className="mt-2 flex flex-col items-center gap-2">
              {isUploading ? (
                <div className="w-full max-w-[150px]">
                  <Progress value={uploadProgress} className="h-2 mb-1" />
                  <p className="text-xs text-center text-muted-foreground">
                    {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                  </p>
                </div>
              ) : (
                <label className="cursor-pointer flex items-center gap-2 text-xs font-medium bg-secondary py-1 px-3 rounded-full hover:bg-secondary/80 transition-colors">
                  <Upload size={14} />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Your location"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-nuumi-pink hover:bg-nuumi-pink/90"
                disabled={isLoading || isUploading}
              >
                {(isLoading || isUploading) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EditProfileForm;
