
import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import EditProfileForm from './EditProfileForm';

interface EditProfileDialogProps {
  trigger: React.ReactNode;
  initialData?: {
    username?: string;
    displayName?: string;
    bio?: string;
    location?: string;
    avatarUrl?: string;
  };
}

const EditProfileDialog = ({ trigger, initialData }: EditProfileDialogProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <EditProfileForm 
          onClose={() => setOpen(false)} 
          initialData={initialData}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
