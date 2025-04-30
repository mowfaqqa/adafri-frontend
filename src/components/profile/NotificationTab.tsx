import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const NotificationTab: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Push Notifications</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive push notifications on your device
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Sound Alerts</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Play sound when receiving notifications
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Desktop Notifications</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Show notifications on your desktop
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

export default NotificationTab;