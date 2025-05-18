import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, Calendar, Filter, Search, Baby, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import { useTheme } from '@/components/theme/ThemeProvider';
import AIMealCard from './AIMealCard';
import SimpleMealPlanView from './SimpleMealPlanView';
import SavedMealPlans from './SavedMealPlans';

// Import the AI meal service
import { generateAIMealPlan, saveMealPlan } from '@/services/mealPlanning/aiMealService';

interface AIMealPlannerProps {
  // Add any props here
}

const AIMealPlanner: React.FC<AIMealPlannerProps> = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('preferences');

  // User preferences
  const [targetUser, setTargetUser] = useState<'mother' | 'child'>('mother');
  const [childAge, setChildAge] = useState(12); // in months
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [preferTraditional, setPreferTraditional] = useState(true);
  const [nutritionFocus, setNutritionFocus] = useState<string>('balanced');

  // Generated meal plan
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }

        setCurrentUser({
          id: session.user.id,
          ...userData
        });
      }
    };

    fetchCurrentUser();
  }, []);

  // Handle generating meal plan
  const handleGenerateMealPlan = async () => {
    try {
      setIsLoading(true);

      // Prepare preferences object
      const preferences = {
        targetUser,
        childAge,
        mealType,
        dietaryRestrictions,
        nutritionGoals: {
          focus: nutritionFocus
        },
        preferTraditional
      };

      console.log('Sending meal plan request with preferences:', preferences);

      // Generate meal plan using Supabase Edge Function
      const generatedMealPlan = await generateAIMealPlan(preferences);

      console.log('Received meal plan:', generatedMealPlan);

      // Validate the meal plan structure
      if (!generatedMealPlan || !generatedMealPlan.meals || !Array.isArray(generatedMealPlan.meals)) {
        console.error('Invalid meal plan structure:', generatedMealPlan);
        toast.error('Received invalid meal plan data. Please try again.');
        return;
      }

      // Set meal plan
      setMealPlan(generatedMealPlan);

      // Switch to results tab
      setActiveTab('results');

      toast.success('Meal plan generated successfully!');
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast.error('Failed to generate meal plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle getting recommendations
  const handleGetRecommendations = async () => {
    try {
      setIsLoading(true);

      // Prepare preferences object (same as for meal plan)
      const preferences = {
        targetUser,
        childAge,
        mealType,
        dietaryRestrictions,
        nutritionGoals: {
          focus: nutritionFocus
        },
        preferTraditional,
        requestType: 'recommendations' // Indicate we want recommendations
      };

      // Generate meal plan using Supabase Edge Function
      // We'll use the same function but with a different request type
      const generatedMealPlan = await generateAIMealPlan(preferences);

      // Extract recommendations from the meal plan
      // In a real implementation, we'd have a separate endpoint for recommendations
      const mealRecommendations = generatedMealPlan.meals.map(meal => ({
        name: meal.name,
        description: meal.benefits,
        nutritionalBenefits: `Calories: ${meal.nutrients.calories}, Protein: ${meal.nutrients.protein}g, Carbs: ${meal.nutrients.carbs}g, Fat: ${meal.nutrients.fat}g`,
        suitabilityReason: `Perfect for ${targetUser === 'mother' ? 'mothers' : 'children'} as a ${mealType}.`,
        imageEmoji: meal.imageEmoji
      }));

      // Set recommendations
      setRecommendations(mealRecommendations);

      // Switch to recommendations tab
      setActiveTab('recommendations');

      toast.success('Meal recommendations generated successfully!');
    } catch (error) {
      console.error('Error getting meal recommendations:', error);
      toast.error('Failed to get meal recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving meal plan
  const handleSaveMealPlan = async () => {
    try {
      if (!currentUser || !mealPlan) return;

      // Save meal plan using the service
      await saveMealPlan(mealPlan, {
        userId: currentUser.id,
        targetUser,
        mealType
      });

      toast.success('Meal plan saved successfully!');

      // Switch to saved plans tab
      setActiveTab('saved');
    } catch (error) {
      console.error('Error saving meal plan:', error);
      toast.error('Failed to save meal plan. Please try again.');
    }
  };

  // Handle adding meal plan to calendar
  const handleAddToCalendar = async (mealPlan: any, date: Date) => {
    try {
      if (!currentUser) {
        toast.error('Please sign in to add a meal plan to calendar');
        return;
      }

      // Extract the meal type from the meal plan
      const mealType = mealPlan.meal_type;

      // Format the date for Supabase
      const dateString = date.toISOString().split('T')[0];

      // For each meal in the plan, add it to the calendar
      if (mealPlan.plan_data && mealPlan.plan_data.meals && mealPlan.plan_data.meals.length > 0) {
        // Create a meal entry for each meal in the plan
        for (const meal of mealPlan.plan_data.meals) {
          // Create a meal entry
          const { data: mealData, error: mealError } = await supabase
            .from('meals')
            .insert({
              name: meal.name,
              description: meal.benefits || 'AI-generated meal',
              emoji: meal.imageEmoji || '🍽️',
              calories: meal.nutrients.calories || 0,
              protein: meal.nutrients.protein || 0,
              carbs: meal.nutrients.carbs || 0,
              fat: meal.nutrients.fat || 0,
              prep_time: 30, // Default prep time
              tags: ['ai-generated'],
              ingredients: meal.ingredients || [],
              instructions: meal.instructions || [],
              user_id: currentUser.id
            })
            .select()
            .single();

          if (mealError) {
            console.error('Error creating meal:', mealError);
            continue;
          }

          // Check if meal plan already exists for this date and meal type
          const { data: existingPlan, error: checkError } = await supabase
            .from('meal_plans')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('date', dateString)
            .eq('meal_type', mealType)
            .maybeSingle();

          if (checkError) {
            console.error('Error checking existing plan:', checkError);
            continue;
          }

          if (existingPlan) {
            // Update existing plan
            const { error: updateError } = await supabase
              .from('meal_plans')
              .update({ meal_id: mealData.id })
              .eq('id', existingPlan.id);

            if (updateError) {
              console.error('Error updating meal plan:', updateError);
              continue;
            }
          } else {
            // Create new plan
            const { error: insertError } = await supabase
              .from('meal_plans')
              .insert({
                user_id: currentUser.id,
                meal_id: mealData.id,
                date: dateString,
                meal_type: mealType
              });

            if (insertError) {
              console.error('Error inserting meal plan:', insertError);
              continue;
            }
          }
        }

        toast.success(`Added meal plan to calendar for ${dateString}`);

        // Navigate to the meal planning page to see the calendar
        navigate('/meal-planning');
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast.error('Failed to add meal plan to calendar');
    }
  };

  if (isLoading && !mealPlan && recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-nuumi-pink mb-4" />
        <p className="text-center text-muted-foreground">
          Our AI is creating your personalized meal plan...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-background sticky top-0 z-10 w-full flex items-center py-4 px-4 shadow-sm">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-2 rounded-full h-10 w-10 flex items-center justify-center hover:bg-hover transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">AI Meal Planner</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="results">Meal Plan</TabsTrigger>
            <TabsTrigger value="recommendations">Suggestions</TabsTrigger>
            <TabsTrigger value="saved">My Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Who is this meal for?</CardTitle>
                <CardDescription>Select who you're planning meals for</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={targetUser}
                  onValueChange={(value) => setTargetUser(value as 'mother' | 'child')}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mother" id="mother" />
                    <Label htmlFor="mother" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Mother
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="child" id="child" />
                    <Label htmlFor="child" className="flex items-center">
                      <Baby className="h-4 w-4 mr-2" />
                      Child
                    </Label>
                  </div>
                </RadioGroup>

                {targetUser === 'child' && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="child-age">Child's Age (months)</Label>
                      <span className="text-sm text-muted-foreground">{childAge} months</span>
                    </div>
                    <Slider
                      id="child-age"
                      min={6}
                      max={36}
                      step={1}
                      value={[childAge]}
                      onValueChange={(value) => setChildAge(value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>6 months</span>
                      <span>36 months</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meal Type</CardTitle>
                <CardDescription>Select the type of meal you want to plan</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={mealType} onValueChange={(value) => setMealType(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nutrition Focus</CardTitle>
                <CardDescription>Select your nutritional priorities</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={nutritionFocus} onValueChange={setNutritionFocus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nutrition focus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="protein">High Protein</SelectItem>
                    <SelectItem value="iron">Iron Rich</SelectItem>
                    <SelectItem value="calcium">Calcium Rich</SelectItem>
                    <SelectItem value="energy">Energy Boosting</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="traditional">Prefer Traditional Foods</Label>
                  <Switch
                    id="traditional"
                    checked={preferTraditional}
                    onCheckedChange={setPreferTraditional}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-4">
              <Button
                className="flex-1 bg-nuumi-pink hover:bg-nuumi-pink/90 text-white"
                onClick={handleGenerateMealPlan}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Meal Plan'
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleGetRecommendations}
                disabled={isLoading}
              >
                Get Suggestions
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="results">
            {mealPlan ? (
              <SimpleMealPlanView
                mealPlan={mealPlan}
                onSave={handleSaveMealPlan}
                targetUser={targetUser}
                mealType={mealType}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No meal plan generated yet.</p>
                <Button
                  onClick={() => setActiveTab('preferences')}
                  variant="outline"
                >
                  Set Preferences
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations">
            {recommendations.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Recommended Meals</h3>
                {recommendations.map((meal, index) => (
                  <AIMealCard
                    key={index}
                    meal={meal}
                    onSelect={() => {
                      // Logic to select this recommendation
                      toast.success(`${meal.name} selected!`);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No recommendations generated yet.</p>
                <Button
                  onClick={() => setActiveTab('preferences')}
                  variant="outline"
                >
                  Set Preferences
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            <SavedMealPlans
              onAddToCalendar={(mealPlan, date) => {
                // Add meal plan to calendar
                handleAddToCalendar(mealPlan, date);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIMealPlanner;
