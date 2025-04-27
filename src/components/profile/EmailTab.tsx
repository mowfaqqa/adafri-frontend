import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const EmailTab: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Email Settings</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Email Notifications</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive email notifications for important updates
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Marketing Emails</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive newsletters and promotional emails
            </p>
          </div>
          <Switch />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Weekly Digest</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive a weekly summary of activity
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default EmailTab;
