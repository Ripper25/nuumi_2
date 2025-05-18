
import React from 'react';

interface OnboardingSlideProps {
  title: string;
  description: string;
  emoji?: string;
  imagePath?: string;
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ 
  title, 
  description,
  emoji,
  imagePath
}) => {
  return (
    <div className="min-h-screen flex flex-col justify-end items-center relative animate-fade-in">
      {/* Background image - fully visible */}
      {imagePath && (
        <div className="absolute inset-0 z-0">
          <img 
            src={imagePath} 
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent">
            {/* Subtle gradient to ensure text readability */}
          </div>
        </div>
      )}
      
      {/* Text content */}
      <div className="relative z-10 text-center max-w-md px-6 mb-40">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {emoji && <span className="mr-2">{emoji}</span>}
          {title}
        </h1>
        <p className="text-xl text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default OnboardingSlide;
