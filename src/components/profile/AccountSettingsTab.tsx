import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface AccountSettingsProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const AccountSettingsTab: React.FC<AccountSettingsProps> = ({ darkMode, toggleDarkMode }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Dark Mode</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Toggle between light and dark theme
            </p>
          </div>
          <Switch 
            checked={darkMode} 
            onCheckedChange={toggleDarkMode} 
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Language</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose your preferred language
            </p>
          </div>
          <select className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Account Timezone</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set your account timezone
            </p>
          </div>
          <select className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600">
            <option value="utc">UTC</option>
            <option value="est">Eastern Time (ET)</option>
            <option value="pst">Pacific Time (PT)</option>
            <option value="cet">Central European Time (CET)</option>
          </select>
        </div>
        
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};