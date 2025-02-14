import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";
import React from "react";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full overflow-hidden flex" id="main">
      <div className="top-0">
        <Sidebar />
      </div>
      <div className="flex-1 bg-gray-100 overflow-hidden">
        <div className="flex justify-between items-center">
          <h2 className="text-4xl font-medium text-gray-900 mt-10 mx-4 mb-3">
            Good Morning, Muwaf
          </h2>
          <div className="flex items-center gap-4 mx-6">
            <Bell className="w-5 h-5" />
            <Settings className="w-5 h-5" />
            <Button className="bg-gradient-to-r from-[#00A791] to-[#014D42]">
              Chat with us
            </Button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
