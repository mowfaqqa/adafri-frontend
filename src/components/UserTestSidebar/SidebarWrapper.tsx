"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function SidebarWrapper() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );
}