import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, Plus, Calendar, Clock, Filter, Search, Sparkles } from 'lucide-react';
import Header from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MealCard from '@/components/meals/MealCard';
import MealPlanCalendar from '@/components/meals/MealPlanCalendar';
import AIMealPlanner from '@/components/meals/AIMealPlanner';
import { useTheme } from '@/components/theme/ThemeProvider';

// Types
interface Meal {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  emoji?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time: number;
  tags: string[];
  ingredients: string[];
  instructions: string[];
  user_id: string;
}

interface MealPlan {
  id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_id: string;
  user_id: string;
  meal?: Meal;
}

const MealPlanning = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);

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

  // Fetch meals
  useEffect(() => {
    const fetchMeals = async () => {
      setIsLoading(true);
      try {
        // Fetch sample meals for now
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setMeals(data as Meal[]);
          setFilteredMeals(data as Meal[]);
        }
      } catch (error) {
        toast.error('Failed to load meals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeals();
  }, []);

  // Fetch meal plans
  useEffect(() => {
    const fetchMealPlans = async () => {
      if (!currentUser) return;

      try {
        const { data, error } = await supabase
          .from('meal_plans')
          .select('*, meal:meal_id(*)')
          .eq('user_id', currentUser.id);

        if (error) throw error;

        if (data) {
          setMealPlans(data as MealPlan[]);
        }
      } catch (error) {
        toast.error('Failed to load meal plans');
      }
    };

    if (currentUser) {
      fetchMealPlans();
    }
  }, [currentUser]);

  // Filter meals based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMeals(meals);
    } else {
      const filtered = meals.filter(meal =>
        meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredMeals(filtered);
    }
  }, [searchQuery, meals]);

  const handleAddMealPlan = async (meal: Meal, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    if (!currentUser) {
      toast.error('Please sign in to add a meal plan');
      return;
    }

    try {
      const dateString = selectedDate.toISOString().split('T')[0];

      // Check if meal plan already exists for this date and meal type
      const { data: existingPlan, error: checkError } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('date', dateString)
        .eq('meal_type', mealType)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingPlan) {
        // Update existing plan
        const { error: updateError } = await supabase
          .from('meal_plans')
          .update({ meal_id: meal.id })
          .eq('id', existingPlan.id);

        if (updateError) throw updateError;

        toast.success(`Updated ${mealType} for ${dateString}`);
      } else {
        // Create new plan
        const { error: insertError } = await supabase
          .from('meal_plans')
          .insert({
            user_id: currentUser.id,
            meal_id: meal.id,
            date: dateString,
            meal_type: mealType
          });

        if (insertError) throw insertError;

        toast.success(`Added ${meal.name} to ${mealType} for ${dateString}`);
      }

      // Refresh meal plans
      const { data: updatedPlans, error: fetchError } = await supabase
        .from('meal_plans')
        .select('*, meal:meal_id(*)')
        .eq('user_id', currentUser.id);

      if (fetchError) throw fetchError;

      if (updatedPlans) {
        setMealPlans(updatedPlans as MealPlan[]);
      }
    } catch (error) {
      toast.error('Failed to add meal to plan');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        title="Baby & Mother Meal Planning"
        showBackButton={true}
        onBackClick={() => navigate(-1)}
      />

      <div className="max-w-md mx-auto px-4">
        <Tabs defaultValue="discover" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="myplan">My Plan</TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center justify-center">
              <Sparkles className="h-4 w-4 mr-1" />
              AI Planner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search meals..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setActiveTab('ai')}
                className="text-nuumi-pink"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredMeals.length > 0 ? (
                filteredMeals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onAddToMealPlan={handleAddMealPlan}
                    selectedDate={selectedDate}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No meals found</p>
                  <div className="flex flex-col gap-2 mt-4">
                    <Button
                      variant="default"
                      className="bg-nuumi-pink hover:bg-nuumi-pink/90"
                      onClick={() => navigate('/create-meal')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Meal
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('ai')}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Use AI Meal Planner
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="myplan">
            <MealPlanCalendar
              mealPlans={mealPlans}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onAddMeal={(mealType) => setActiveTab('discover')}
            />
          </TabsContent>

          <TabsContent value="ai">
            <AIMealPlanner />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MealPlanning;
