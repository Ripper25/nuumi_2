/**
 * Service for interacting with AI meal planning functionality
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Initialize the Zimbabwe foods database
 * This should be called once to set up the initial data
 * @returns {Promise<Object>} Result of the initialization
 */
export const initializeZimbabweFoods = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('setup-zimbabwe-foods', {
      method: 'POST',
    });

    if (error) {
      console.error('Error initializing Zimbabwe foods:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error initializing Zimbabwe foods:', error);
    throw error;
  }
};

/**
 * Generate a meal plan using the AI model
 * @param {Object} preferences - User preferences for the meal plan
 * @returns {Promise<Object>} Generated meal plan
 */
export const generateAIMealPlan = async (preferences) => {
  try {
    console.log('Generating meal plan with preferences:', preferences);

    // First try the Python backend
    try {
      console.log('Attempting to use Python backend at /api/meal-plan');

      // Try with absolute URL first
      const backendUrl = 'http://localhost:8000/api/meal-plan';
      console.log('Using absolute URL:', backendUrl);

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      console.log('Python backend response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        const text = await response.text();
        console.log('Raw response text:', text);
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Invalid JSON response from backend');
      }

      console.log('Python backend response data:', data);

      if (!data.mealPlan) {
        console.warn('Python backend response missing mealPlan property:', data);
        throw new Error('Invalid response format from Python backend');
      }

      // Validate meal plan structure
      if (!data.mealPlan.meals || !Array.isArray(data.mealPlan.meals)) {
        console.warn('Python backend response has invalid meal plan structure:', data.mealPlan);
        throw new Error('Invalid meal plan structure from Python backend');
      }

      // Create a safe copy of the meal plan with default values for missing properties
      const safeMealPlan = {
        introduction: data.mealPlan.introduction || 'Your personalized meal plan',
        meals: data.mealPlan.meals.map(meal => ({
          name: meal.name || 'Unnamed Meal',
          ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
          instructions: Array.isArray(meal.instructions) ? meal.instructions : [],
          nutrients: {
            calories: meal.nutrients?.calories || 0,
            protein: meal.nutrients?.protein || 0,
            carbs: meal.nutrients?.carbs || 0,
            fat: meal.nutrients?.fat || 0
          },
          benefits: meal.benefits || '',
          imageEmoji: meal.imageEmoji || '🍽️'
        })),
        tips: Array.isArray(data.mealPlan.tips) ? data.mealPlan.tips : []
      };

      return safeMealPlan;
    } catch (backendError) {
      console.warn('Error using Python backend, falling back to Edge Function:', backendError);

      // Fall back to Edge Function if Python backend fails
      console.log('Attempting to use Supabase Edge Function');

      const { data, error } = await supabase.functions.invoke('ai-meal-planner', {
        method: 'POST',
        body: { preferences },
      });

      if (error) {
        console.error('Error generating meal plan with Edge Function:', error);
        throw error;
      }

      console.log('Edge Function response data:', data);

      if (!data.mealPlan) {
        console.warn('Edge Function response missing mealPlan property:', data);
        throw new Error('Invalid response format from Edge Function');
      }

      // Validate meal plan structure
      if (!data.mealPlan.meals || !Array.isArray(data.mealPlan.meals)) {
        console.warn('Edge Function response has invalid meal plan structure:', data.mealPlan);
        throw new Error('Invalid meal plan structure from Edge Function');
      }

      // Create a safe copy of the meal plan with default values for missing properties
      const safeMealPlan = {
        introduction: data.mealPlan.introduction || 'Your personalized meal plan',
        meals: data.mealPlan.meals.map(meal => ({
          name: meal.name || 'Unnamed Meal',
          ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
          instructions: Array.isArray(meal.instructions) ? meal.instructions : [],
          nutrients: {
            calories: meal.nutrients?.calories || 0,
            protein: meal.nutrients?.protein || 0,
            carbs: meal.nutrients?.carbs || 0,
            fat: meal.nutrients?.fat || 0
          },
          benefits: meal.benefits || '',
          imageEmoji: meal.imageEmoji || '🍽️'
        })),
        tips: Array.isArray(data.mealPlan.tips) ? data.mealPlan.tips : []
      };

      return safeMealPlan;
    }
  } catch (error) {
    console.error('Error generating meal plan:', error);

    // Return a fallback meal plan in case of error
    return {
      introduction: "We couldn't generate a personalized meal plan at this time. Here's a simple meal suggestion instead.",
      meals: [
        {
          name: "Simple Nutritious Breakfast",
          ingredients: ["Oatmeal", "Milk", "Honey", "Banana"],
          instructions: ["Mix oatmeal with milk", "Heat for 2 minutes", "Add honey and sliced banana"],
          nutrients: { calories: 300, protein: 10, carbs: 45, fat: 5 },
          benefits: "Provides energy and essential nutrients to start the day.",
          imageEmoji: "🥣"
        }
      ],
      tips: ["Prepare ingredients the night before for quicker cooking."]
    };
  }
};

/**
 * Save a generated meal plan to the database
 * @param {Object} mealPlan - The generated meal plan
 * @param {Object} options - Additional options (userId, targetUser, mealType)
 * @returns {Promise<Object>} Result of the save operation
 */
export const saveMealPlan = async (mealPlan, { userId, targetUser, mealType }) => {
  try {
    // Get auth token for the Python backend
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Try to use the Python backend first
    if (token) {
      try {
        const response = await fetch('/api/user-meal-plans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            mealPlan,
            userId,
            targetUser,
            mealType
          }),
        });

        if (response.ok) {
          return await response.json();
        }

        // If Python backend fails, fall back to direct Supabase
        console.warn('Error saving to Python backend, falling back to direct Supabase');
      } catch (backendError) {
        console.warn('Error using Python backend for saving, falling back to direct Supabase:', backendError);
      }
    }

    // Fall back to direct Supabase
    const { data, error } = await supabase
      .from('ai_meal_plans')
      .insert({
        user_id: userId,
        plan_data: mealPlan,
        target_user: targetUser,
        meal_type: mealType,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error saving meal plan:', error);
    throw error;
  }
};

/**
 * Get all saved meal plans for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of meal plans
 */
export const getUserMealPlans = async (userId) => {
  try {
    // Get auth token for the Python backend
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Try to use the Python backend first
    if (token) {
      try {
        const response = await fetch('/api/user-meal-plans', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          return data.mealPlans || [];
        }

        // If Python backend fails, fall back to direct Supabase
        console.warn('Error fetching from Python backend, falling back to direct Supabase');
      } catch (backendError) {
        console.warn('Error using Python backend for fetching, falling back to direct Supabase:', backendError);
      }
    }

    // Fall back to direct Supabase
    const { data, error } = await supabase
      .from('ai_meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    throw error;
  }
};

/**
 * Delete a meal plan
 * @param {string} planId - The ID of the meal plan to delete
 * @returns {Promise<Object>} Result of the delete operation
 */
export const deleteMealPlan = async (planId) => {
  try {
    // Get auth token for the Python backend
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Try to use the Python backend first
    if (token) {
      try {
        const response = await fetch(`/api/user-meal-plans/${planId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          return { success: true };
        }

        // If Python backend fails, fall back to direct Supabase
        console.warn('Error deleting from Python backend, falling back to direct Supabase');
      } catch (backendError) {
        console.warn('Error using Python backend for deleting, falling back to direct Supabase:', backendError);
      }
    }

    // Fall back to direct Supabase
    const { error } = await supabase
      .from('ai_meal_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    throw error;
  }
};

/**
 * Initialize the Zimbabwe foods database on app startup
 * This is called when the app loads to ensure the data is available
 */
export const initializeDataOnStartup = async () => {
  try {
    // Check if we already have data
    const { data, error } = await supabase
      .from('zimbabwe_foods')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error checking Zimbabwe foods:', error);
      return;
    }

    // If no data exists, initialize it
    if (!data || data.length === 0) {
      console.log('Initializing Zimbabwe foods database...');
      await initializeZimbabweFoods();
      console.log('Zimbabwe foods database initialized successfully');
    } else {
      console.log('Zimbabwe foods database already initialized');
    }
  } catch (error) {
    console.error('Error initializing data on startup:', error);
  }
};

// Initialize the data when this module is imported
initializeDataOnStartup().catch(console.error);
