// File: TabbedCommunication.tsx
"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EmailList, sampleEmails } from "./EmailComponent";
import { MessageList, sampleMessages } from "./OnlineMessageComponent";

interface TabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNavigation: React.FC<TabProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 space-x-2 max-w-sm mx-auto">
  <button
    onClick={() => setActiveTab("email")}
    className={cn(
      "w-36 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
      activeTab === "email"
        ? "bg-teal-600 text-white shadow-sm"
        : "text-gray-500 hover:bg-gray-200"
    )}
  >
    Email
  </button>
  <button
    onClick={() => setActiveTab("message")}
    className={cn(
      "w-36 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
      activeTab === "message"
        ? "bg-teal-600 text-white shadow-sm"
        : "text-gray-500 hover:bg-gray-200"
    )}
  >
    Online Message
  </button>
</div>


  );
};

const EmailOnlineMessaging: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [activeTab, setActiveTab] = useState("email");

  return (
    <div className={`min-h-screen ${className}`}>
      <Card className="h-auto flex flex-col py-2 rounded-xl bg-white ml-auto shadow-md">
        <CardHeader className="pb-2 border-b">
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        </CardHeader>
        <CardContent className="flex-1 p-0">
          {activeTab === "email" ? (
            <EmailList emails={sampleEmails} />
          ) : (
            <MessageList messages={sampleMessages} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailOnlineMessaging;
