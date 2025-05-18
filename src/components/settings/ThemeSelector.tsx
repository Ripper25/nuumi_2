import React from 'react';
import { Check, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Define feminine color themes with hex codes for both light and dark modes
export const colorThemes = {
  default: {
    name: 'Rose Pink',
    primary: {
      light: '#FF69B4', // Hot Pink
      dark: '#FF1493', // Deep Pink
    },
    secondary: {
      light: '#FFC0CB', // Pink
      dark: '#DB7093', // Pale Violet Red
    },
    background: {
      light: '#FFF9FB', // Very light pink tint
      dark: '#121212',
    },
    foreground: {
      light: '#000000',
      dark: '#FFFFFF',
    },
    description: 'Energetic and playful',
  },
  lavender: {
    name: 'Lavender Dream',
    primary: {
      light: '#9370DB', // Medium Purple
      dark: '#8A2BE2', // Blue Violet
    },
    secondary: {
      light: '#E6E6FA', // Lavender
      dark: '#483D8B', // Dark Slate Blue
    },
    background: {
      light: '#F8F7FF', // Very light lavender tint
      dark: '#121212',
    },
    foreground: {
      light: '#000000',
      dark: '#FFFFFF',
    },
    description: 'Calming and creative',
  },
  coral: {
    name: 'Coral Bliss',
    primary: {
      light: '#FF7F50', // Coral
      dark: '#FF6347', // Tomato
    },
    secondary: {
      light: '#FFA07A', // Light Salmon
      dark: '#E9967A', // Dark Salmon
    },
    background: {
      light: '#FFF9F5', // Very light coral tint
      dark: '#121212',
    },
    foreground: {
      light: '#000000',
      dark: '#FFFFFF',
    },
    description: 'Warm and inviting',
  },
  mint: {
    name: 'Mint Serenity',
    primary: {
      light: '#5CDB95', // Brighter Mint
      dark: '#3CB371', // Medium Sea Green
    },
    secondary: {
      light: '#E0F5EE', // Light Mint
      dark: '#2E8B57', // Sea Green
    },
    background: {
      light: '#F5FFFA', // Very light mint tint
      dark: '#121212',
    },
    foreground: {
      light: '#000000',
      dark: '#FFFFFF',
    },
    description: 'Fresh and peaceful',
  },
  peach: {
    name: 'Peach Harmony',
    primary: {
      light: '#FFAA80', // Brighter Peach
      dark: '#FF8C69', // Salmon
    },
    secondary: {
      light: '#FFE4C4', // Bisque
      dark: '#F4A460', // Sandy Brown
    },
    background: {
      light: '#FFF5F0', // Very light peach tint
      dark: '#121212',
    },
    foreground: {
      light: '#000000',
      dark: '#FFFFFF',
    },
    description: 'Soft and nurturing',
  },
};

export type ColorTheme = keyof typeof colorThemes;

interface ThemeSelectorProps {
  currentTheme: ColorTheme;
  onThemeChange: (theme: ColorTheme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Palette size={18} />
        <Label className="text-sm">Color Theme</Label>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 h-8 px-3"
            style={{
              borderColor: colorThemes[currentTheme].primary.light,
              color: colorThemes[currentTheme].primary.light
            }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colorThemes[currentTheme].primary.light }}
            />
            <span className="text-xs">{colorThemes[currentTheme].name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {Object.entries(colorThemes).map(([key, theme]) => (
            <DropdownMenuItem
              key={key}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                currentTheme === key && "font-medium"
              )}
              onClick={() => onThemeChange(key as ColorTheme)}
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="flex gap-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: theme.primary.light }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: theme.primary.dark }}
                  />
                </div>
                <div className="flex flex-col">
                  <span>{theme.name}</span>
                  <span className="text-xs text-muted-foreground">{theme.description}</span>
                </div>
              </div>
              {currentTheme === key && <Check size={16} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ThemeSelector;
