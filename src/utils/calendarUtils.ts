/**
 * Utility functions for calendar integration
 */

/**
 * Generate a Google Calendar event URL
 * @param {Object} params - Event parameters
 * @returns {string} Google Calendar URL
 */
export const generateGoogleCalendarUrl = (params: {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}) => {
  const { title, description, location = '', startDate, endDate } = params;

  // Format dates for Google Calendar
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const startDateFormatted = formatDate(startDate);
  const endDateFormatted = formatDate(endDate);

  // Build URL
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', title);
  url.searchParams.append('details', description);
  url.searchParams.append('location', location);
  url.searchParams.append('dates', `${startDateFormatted}/${endDateFormatted}`);

  return url.toString();
};

/**
 * Generate an iCal file content
 * @param {Object} params - Event parameters
 * @returns {string} iCal file content
 */
export const generateICalContent = (params: {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}) => {
  const { title, description, location = '', startDate, endDate } = params;

  // Format dates for iCal
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const startDateFormatted = formatDate(startDate);
  const endDateFormatted = formatDate(endDate);
  const now = formatDate(new Date());

  // Generate a unique ID
  const uid = `${now}-${Math.floor(Math.random() * 100000)}@mommingle.com`;

  // Build iCal content
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MomMingle//AI Meal Planner//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${startDateFormatted}
DTEND:${endDateFormatted}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
};

/**
 * Download an iCal file
 * @param {Object} params - Event parameters
 */
export const downloadICalFile = (params: {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}) => {
  const { title } = params;
  const content = generateICalContent(params);

  // Create a blob and download link
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Format meal plan details for calendar description
 * @param {Object} meal - Meal object
 * @returns {string} Formatted description
 */
export const formatMealDescription = (meal: {
  name: string;
  ingredients: string[];
  instructions: string[];
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}) => {
  try {
    if (!meal) {
      console.error('Meal is undefined or null');
      return 'No meal details available';
    }

    const { name, ingredients, instructions, nutrients } = meal;

    if (!name || !ingredients || !instructions || !nutrients) {
      console.error('Meal is missing required properties:', meal);
      return `${name || 'Unnamed Meal'}\n\nMeal details incomplete`;
    }

    let description = `${name}\n\n`;

    // Add ingredients
    description += 'INGREDIENTS:\n';
    if (Array.isArray(ingredients)) {
      ingredients.forEach((ingredient, index) => {
        description += `${index + 1}. ${ingredient}\n`;
      });
    } else {
      description += 'No ingredients available\n';
    }

    description += '\nINSTRUCTIONS:\n';
    if (Array.isArray(instructions)) {
      instructions.forEach((instruction, index) => {
        description += `${index + 1}. ${instruction}\n`;
      });
    } else {
      description += 'No instructions available\n';
    }

    description += '\nNUTRITION INFO:\n';
    if (nutrients) {
      description += `Calories: ${nutrients.calories || 'N/A'}, `;
      description += `Protein: ${nutrients.protein || 'N/A'}g, `;
      description += `Carbs: ${nutrients.carbs || 'N/A'}g, `;
      description += `Fat: ${nutrients.fat || 'N/A'}g`;
    } else {
      description += 'Nutritional information not available';
    }

    return description;
  } catch (error) {
    console.error('Error formatting meal description:', error);
    return 'Error formatting meal description';
  }
};
