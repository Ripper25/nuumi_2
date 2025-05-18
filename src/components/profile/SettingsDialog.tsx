import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  LogOut,
  Moon,
  Sun,
  Bell,
  Shield,
  HelpCircle,
  FileText,
  UserCog,
  Trash2,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ThemeSelector, { ColorTheme, colorThemes } from '@/components/settings/ThemeSelector';
import { useTheme } from '@/components/theme/ThemeProvider';

interface SettingsDialogProps {
  trigger: React.ReactNode;
}

interface UserSettings {
  dark_mode: boolean;
  notifications_enabled: boolean;
  privacy_mode: boolean;
  color_theme?: ColorTheme;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ trigger }) => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch user settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async (): Promise<UserSettings> => {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_settings')
        .select('dark_mode, notifications_enabled, privacy_mode, color_theme')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching settings:', error);

        // If no settings found, create default settings
        if (error.code === 'PGRST116') {
          const defaultSettings = {
            dark_mode: false,
            notifications_enabled: true,
            privacy_mode: false,
            color_theme: 'default' as ColorTheme
          };

          // Insert default settings
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert({
              user_id: user.id,
              ...defaultSettings
            });

          if (insertError) {
            console.error('Error creating default settings:', insertError);
          }

          return defaultSettings;
        }

        // Return default settings for any other error
        return {
          dark_mode: false,
          notifications_enabled: true,
          privacy_mode: false,
          color_theme: 'default' as ColorTheme
        };
      }

      // Ensure color_theme has a default value if not set
      return {
        ...data,
        color_theme: data.color_theme || 'default' as ColorTheme
      };
    },
    enabled: open // Only fetch when dialog is open
  });

  // Get theme from ThemeProvider
  const {
    theme: currentTheme,
    mode: currentMode,
    setTheme: updateGlobalTheme,
    setMode: updateGlobalMode,
    toggleMode
  } = useTheme();

  // Update settings mutation - using direct table update instead of RPC
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      // Log the parameters being sent
      console.log('Updating settings with:', newSettings);

      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update the settings directly in the table
      const { data, error } = await supabase
        .from('user_settings')
        .update(newSettings)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  });

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setOpen(false);
      navigate('/auth');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const toggleDarkMode = async () => {
    if (!settings) return;

    try {
      // Toggle the mode using the ThemeProvider
      await toggleMode();

      // No need to update the database as the ThemeProvider already does that
      toast.success(`${currentMode === 'light' ? 'Dark' : 'Light'} mode enabled`);
    } catch (error) {
      console.error('Error toggling dark mode:', error);
      toast.error('Failed to toggle dark mode');
    }
  };

  const toggleNotifications = () => {
    if (!settings) return;

    const newValue = !settings.notifications_enabled;

    updateSettingsMutation.mutate({
      notifications_enabled: newValue
    });

    toast.success(`Notifications ${newValue ? 'enabled' : 'disabled'}`);
  };

  const togglePrivacyMode = () => {
    if (!settings) return;

    const newValue = !settings.privacy_mode;

    updateSettingsMutation.mutate({
      privacy_mode: newValue
    });

    toast.success(`Privacy mode ${newValue ? 'enabled' : 'disabled'}`);
  };

  const handleThemeChange = async (theme: ColorTheme) => {
    if (!settings) return;

    try {
      // Update the global theme first for immediate feedback
      await updateGlobalTheme(theme);

      // Then update in the database
      updateSettingsMutation.mutate({
        color_theme: theme
      });

      toast.success(`Theme changed to ${colorThemes[theme].name}`);
    } catch (error) {
      console.error('Error changing theme:', error);
      toast.error('Failed to change theme');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Settings</DialogTitle>
            {(isLoading || updateSettingsMutation.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh]">
          {/* Account Section */}
          <div className="px-6 py-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Account</h3>
            <div className="space-y-1">
              <SettingsItem
                icon={<UserCog size={18} />}
                label="Account Settings"
                onClick={() => {}}
              />
              <SettingsItem
                icon={<Shield size={18} />}
                label="Privacy & Safety"
                onClick={() => {}}
              />
            </div>
          </div>

          {/* Preferences Section */}
          <div className="px-6 py-2 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 mt-2">Preferences</h3>
            <div className="space-y-3">
              <ThemeSelector
                currentTheme={currentTheme}
                onThemeChange={handleThemeChange}
              />

              <div className="h-px w-full bg-border my-2"></div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {currentMode === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                  <Label htmlFor="dark-mode" className="text-sm">Dark Mode</Label>
                </div>
                <Switch
                  id="dark-mode"
                  checked={currentMode === 'dark'}
                  onCheckedChange={toggleDarkMode}
                  disabled={isLoading || updateSettingsMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell size={18} />
                  <Label htmlFor="notifications" className="text-sm">Notifications</Label>
                </div>
                <Switch
                  id="notifications"
                  checked={settings?.notifications_enabled || false}
                  onCheckedChange={toggleNotifications}
                  disabled={isLoading || updateSettingsMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield size={18} />
                  <Label htmlFor="privacy" className="text-sm">Privacy Mode</Label>
                </div>
                <Switch
                  id="privacy"
                  checked={settings?.privacy_mode || false}
                  onCheckedChange={togglePrivacyMode}
                  disabled={isLoading || updateSettingsMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* Help & Support Section */}
          <div className="px-6 py-2 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 mt-2">Help & Support</h3>
            <div className="space-y-1">
              <SettingsItem
                icon={<HelpCircle size={18} />}
                label="Help Center"
                onClick={() => {}}
              />
              <SettingsItem
                icon={<FileText size={18} />}
                label="Terms of Service"
                onClick={() => {}}
              />
              <SettingsItem
                icon={<FileText size={18} />}
                label="Privacy Policy"
                onClick={() => {}}
              />
            </div>
          </div>

          {/* Danger Zone */}
          <div className="px-6 py-2 border-t">
            <h3 className="text-sm font-medium text-destructive mb-2 mt-2">Danger Zone</h3>
            <div className="space-y-1">
              <SettingsItem
                icon={<Trash2 size={18} className="text-destructive" />}
                label="Delete Account"
                onClick={() => {}}
                className="text-destructive hover:bg-destructive/10"
              />
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="p-6 border-t">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, label, onClick, className }) => {
  return (
    <button
      className={`w-full flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-muted transition-colors ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <ChevronRight size={16} className="text-muted-foreground" />
    </button>
  );
};

export default SettingsDialog;
