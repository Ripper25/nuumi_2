import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import CommentList from './CommentList';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle?: string;
  currentUser?: {
    id: string;
    avatarUrl?: string;
    username?: string;
  };
  postAuthor?: {
    id: string;
    username: string;
  };
  className?: string;
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  postId,
  postTitle,
  currentUser,
  postAuthor,
  className
}) => {
  const queryClient = useQueryClient();

  // Force refresh comments when the modal opens
  useEffect(() => {
    if (isOpen && postId) {
      // Force a refresh of the comments data
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    }
  }, [isOpen, postId, queryClient]);
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col p-0",
          className
        )}
      >
        <div className="p-6 flex flex-col h-full">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-2 mb-4">
            <DialogTitle className="text-lg font-semibold">
              {postTitle ? `Comments on "${postTitle}"` : 'Comments'}
            </DialogTitle>
            {/* No close button here - using the one from DialogContent */}
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-2 -mr-2">
            <CommentList
              postId={postId}
              currentUser={currentUser}
              postAuthor={postAuthor}
              className="py-2"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
