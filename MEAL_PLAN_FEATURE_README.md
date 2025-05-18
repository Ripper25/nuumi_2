# Meal Plan Feature Implementation

This README explains the changes made to implement the meal plan saving and calendar integration features.

## Changes Made

1. **Created a SavedMealPlans Component**: A new component that displays all saved AI meal plans, allowing users to view and manage their saved plans.

2. **Added a "My Plans" Tab**: Added a new tab to the AIMealPlanner component that displays the saved meal plans.

3. **Enhanced the Save Functionality**: When a user saves a meal plan, they are now automatically redirected to the "My Plans" tab to see their saved plan.

4. **Added Calendar Integration**: Implemented a function that adds saved meal plans to the calendar, creating meal entries in the database and associating them with specific dates.

5. **Added Navigation to Calendar**: After adding a meal plan to the calendar, users are redirected to the meal planning page to see their calendar with the newly added meals.

## Files Changed

- `src/components/meals/AIMealPlanner.tsx`: Updated to include the SavedMealPlans component and add the "My Plans" tab.
- `src/components/meals/AIMealPlanView.tsx`: Enhanced with better error handling.
- `src/components/meals/SimpleMealPlanView.tsx`: Created a simplified version of the meal plan view component.
- `src/components/meals/SavedMealPlans.tsx`: Created a new component to display saved meal plans.
- `src/services/mealPlanning/aiMealService.js`: Enhanced with better error handling and data validation.
- `src/utils/calendarUtils.ts`: Enhanced with better error handling.

## How to Apply the Changes

Due to the large size of the repository, we've created a patch file with just the changes to the meal planning feature. You can apply this patch using the following command:

```bash
git apply meal-plan-changes.patch
```

If you encounter any conflicts, you can resolve them manually or use the `--reject` option to create `.rej` files for the conflicts:

```bash
git apply --reject meal-plan-changes.patch
```

## Features

### Save Meal Plan

The "Save Plan" button now saves the meal plan to the database and shows it in the "My Plans" tab. The saved meal plans are stored in the `ai_meal_plans` table in Supabase.

### View Saved Meal Plans

Users can view all their saved meal plans in the "My Plans" tab. Each meal plan shows the target user (mother or child), meal type, and creation date.

### Add to Calendar

Users can add any saved meal plan to their calendar with just a few clicks. The calendar is automatically updated with the meal plan details, and users are redirected to the meal planning page to see their calendar.

## Implementation Details

### Database Tables

The feature uses the following Supabase tables:

- `ai_meal_plans`: Stores the saved AI-generated meal plans.
- `meals`: Stores individual meals that can be added to the calendar.
- `meal_plans`: Associates meals with specific dates and meal types in the calendar.

### Calendar Integration

When a user adds a meal plan to the calendar, the following happens:

1. For each meal in the plan, a new entry is created in the `meals` table.
2. For each meal, a new entry is created in the `meal_plans` table, associating the meal with a specific date and meal type.
3. If a meal plan already exists for the same date and meal type, it is updated instead of creating a new one.

## Testing

To test the feature:

1. Generate a meal plan using the AI Meal Planner.
2. Save the meal plan using the "Save Plan" button.
3. Navigate to the "My Plans" tab to see the saved meal plan.
4. Click the "Add to Calendar" button on a meal in the saved plan.
5. Select a date and time, then click "Add to Google Calendar" or "Download iCal".
6. Navigate to the meal planning page to see the meal added to the calendar.
