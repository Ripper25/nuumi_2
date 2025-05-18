import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, Calendar, Trash2, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUserMealPlans, deleteMealPlan } from '@/services/mealPlanning/aiMealService';
import { generateGoogleCalendarUrl, downloadICalFile, formatMealDescription } from '@/utils/calendarUtils';

interface SavedMealPlansProps {
  onAddToCalendar?: (mealPlan: any, date: Date) => void;
}

const SavedMealPlans: React.FC<SavedMealPlansProps> = ({ onAddToCalendar }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedMealIndex, setSelectedMealIndex] = useState<number>(0);
  const [calendarDate, setCalendarDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [calendarTime, setCalendarTime] = useState<string>('12:00');
  const [calendarDuration, setCalendarDuration] = useState<number>(60); // minutes

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch saved meal plans
  useEffect(() => {
    const fetchMealPlans = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      try {
        const plans = await getUserMealPlans(currentUser.id);
        setMealPlans(plans);
      } catch (error) {
        console.error('Error fetching meal plans:', error);
        toast.error('Failed to load saved meal plans');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchMealPlans();
    }
  }, [currentUser]);

  // Handle delete meal plan
  const handleDeleteMealPlan = async (planId: string) => {
    try {
      await deleteMealPlan(planId);
      setMealPlans(mealPlans.filter(plan => plan.id !== planId));
      toast.success('Meal plan deleted successfully');
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      toast.error('Failed to delete meal plan');
    }
  };

  // Handle adding to calendar
  const handleAddToCalendar = (planId: string, mealIndex: number) => {
    setSelectedPlanId(planId);
    setSelectedMealIndex(mealIndex);
  };

  // Generate calendar event
  const generateCalendarEvent = (type: 'google' | 'ical') => {
    try {
      const plan = mealPlans.find(p => p.id === selectedPlanId);
      if (!plan || !plan.plan_data || !plan.plan_data.meals || !plan.plan_data.meals[selectedMealIndex]) {
        toast.error('Invalid meal plan data');
        return;
      }

      const meal = plan.plan_data.meals[selectedMealIndex];
      const title = `${plan.meal_type.charAt(0).toUpperCase() + plan.meal_type.slice(1)}: ${meal.name}`;
      const description = formatMealDescription(meal);

      // Parse date and time
      const [year, month, day] = calendarDate.split('-').map(Number);
      const [hours, minutes] = calendarTime.split(':').map(Number);

      const startDate = new Date(year, month - 1, day, hours, minutes);
      const endDate = new Date(startDate.getTime() + calendarDuration * 60 * 1000);

      if (type === 'google') {
        // Open Google Calendar in a new tab
        window.open(
          generateGoogleCalendarUrl({
            title,
            description,
            startDate,
            endDate
          }),
          '_blank'
        );
      } else {
        // Download iCal file
        downloadICalFile({
          title,
          description,
          startDate,
          endDate
        });
      }

      // Also add to the app's calendar if the callback is provided
      if (onAddToCalendar) {
        onAddToCalendar(plan, startDate);
      }

      toast.success('Added to calendar');
    } catch (error) {
      console.error('Error generating calendar event:', error);
      toast.error('Failed to add to calendar');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Please sign in to view your saved meal plans.</p>
      </div>
    );
  }

  if (mealPlans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">You don't have any saved meal plans yet.</p>
        <Button variant="outline" onClick={() => window.location.href = '#ai'}>
          Create a Meal Plan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Dialog */}
      <Dialog>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Calendar</DialogTitle>
            <DialogDescription>
              Schedule this meal in your calendar
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meal-date">Date</Label>
              <Input
                id="meal-date"
                type="date"
                value={calendarDate}
                onChange={(e) => setCalendarDate(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="meal-time">Time</Label>
              <Input
                id="meal-time"
                type="time"
                value={calendarTime}
                onChange={(e) => setCalendarTime(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="meal-duration">Duration (minutes)</Label>
              <Input
                id="meal-duration"
                type="number"
                min="15"
                step="15"
                value={calendarDuration}
                onChange={(e) => setCalendarDuration(parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => generateCalendarEvent('ical')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Download iCal
            </Button>
            <Button
              type="button"
              onClick={() => generateCalendarEvent('google')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Add to Google Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <h2 className="text-xl font-semibold">Your Saved Meal Plans</h2>
      
      {mealPlans.map((plan) => (
        <Card key={plan.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base">
                  {plan.target_user === 'mother' ? 'Mother' : 'Child'} {plan.meal_type.charAt(0).toUpperCase() + plan.meal_type.slice(1)}
                </CardTitle>
                <CardDescription>
                  {format(new Date(plan.created_at), 'MMMM d, yyyy')}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => handleDeleteMealPlan(plan.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {plan.plan_data && plan.plan_data.meals && (
              <div className="space-y-4">
                <p className="text-sm">{plan.plan_data.introduction}</p>
                
                <Accordion type="single" collapsible className="w-full">
                  {plan.plan_data.meals.map((meal, index) => (
                    <AccordionItem key={index} value={`meal-${index}`}>
                      <AccordionTrigger className="py-2">
                        <div className="flex items-center">
                          <span className="mr-2 text-xl">{meal.imageEmoji || '🍽️'}</span>
                          <span>{meal.name}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <div className="flex justify-end">
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleAddToCalendar(plan.id, index)}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Add to Calendar
                              </Button>
                            </DialogTrigger>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Ingredients</h4>
                            <ul className="text-sm space-y-1">
                              {meal.ingredients.map((ingredient, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{ingredient}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Nutrition Information</h4>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">Calories: {meal.nutrients.calories}</Badge>
                              <Badge variant="outline">Protein: {meal.nutrients.protein}g</Badge>
                              <Badge variant="outline">Carbs: {meal.nutrients.carbs}g</Badge>
                              <Badge variant="outline">Fat: {meal.nutrients.fat}g</Badge>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SavedMealPlans;
