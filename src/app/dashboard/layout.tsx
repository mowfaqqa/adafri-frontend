import Sidebar from "@/components/Sidebar";
import React from "react";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full overflow-y-auto flex" id="main">
      <div>
        <Sidebar className="hidden md:flex" />
      </div>
      <div className="ml-[10%] flex-1">{children}</div>
    </div>
  );
};

export default DashboardLayout;
