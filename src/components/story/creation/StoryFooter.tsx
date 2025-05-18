
import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoryFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
}

const StoryFooter: React.FC<StoryFooterProps> = ({
  onCancel,
  onSubmit,
  isSubmitting,
  isSubmitDisabled
}) => {
  return (
    <div className="p-4 border-t border-border flex justify-end gap-2">
      <Button variant="outline" onClick={onCancel} disabled={isSubmitting} size="sm">
        Cancel
      </Button>
      <Button
        onClick={onSubmit}
        disabled={isSubmitDisabled || isSubmitting}
        className="gap-2"
        size="sm"
      >
        {isSubmitting ? 'Posting...' : 'Post Story'}
        <Send size={16} />
      </Button>
    </div>
  );
};

export default StoryFooter;
