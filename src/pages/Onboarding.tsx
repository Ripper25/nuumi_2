
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import OnboardingSlide from '@/components/onboarding/OnboardingSlide';
import { onboardingData } from '@/components/onboarding/onboardingData';

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < onboardingData.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Set flag that onboarding has been shown
      localStorage.setItem('hasShownOnboarding', 'true');
      // Navigate to auth page when completed
      navigate('/auth');
    }
  };

  const handleSkip = () => {
    // Set flag that onboarding has been shown
    localStorage.setItem('hasShownOnboarding', 'true');
    // Navigate to auth page
    navigate('/auth');
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const isLastSlide = currentSlide === onboardingData.length - 1;
  const slide = onboardingData[currentSlide];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Current slide */}
      <OnboardingSlide
        key={currentSlide}
        title={slide.title}
        description={slide.description}
        emoji={slide.emoji}
        imagePath={slide.imagePath}
      />

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 z-10">
        {isLastSlide ? (
          <>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 font-bold text-lg rounded-full py-6 mb-4"
              onClick={handleNext}
            >
              Sign Up
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-primary text-primary hover:bg-primary/10 font-bold text-lg rounded-full py-6"
              onClick={handleSkip}
            >
              Log In
            </Button>
          </>
        ) : (
          <Button 
            className="w-full bg-primary hover:bg-primary/90 font-bold text-lg rounded-full py-6"
            onClick={handleNext}
          >
            {slide.buttonText || (isLastSlide ? 'Get Started' : 'Next')}
          </Button>
        )}

        {/* Dots navigation */}
        <div className="flex justify-center mt-4 space-x-2">
          {onboardingData.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === index 
                  ? 'w-8 bg-primary' 
                  : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
