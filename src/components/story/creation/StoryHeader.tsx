
import React from 'react';
import { X } from 'lucide-react';

interface StoryHeaderProps {
  onClose: () => void;
}

const StoryHeader: React.FC<StoryHeaderProps> = ({ onClose }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <h2 className="text-lg font-semibold">Create Story</h2>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
        aria-label="Close"
      >
        <X size={24} />
      </button>
    </div>
  );
};

export default StoryHeader;
