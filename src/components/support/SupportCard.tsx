
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportCardProps {
  icon: LucideIcon;
  title: string;
  onClick?: () => void;
  className?: string;
}

const SupportCard = ({ 
  icon: Icon, 
  title, 
  onClick, 
  className 
}: SupportCardProps) => {
  return (
    <button
      className={cn(
        "flex flex-col items-center justify-center p-4 bg-card rounded-xl transition-transform duration-300 hover:scale-105",
        className
      )}
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
        <Icon size={24} className="text-foreground" />
      </div>
      <span className="text-sm font-medium">{title}</span>
    </button>
  );
};

export default SupportCard;
