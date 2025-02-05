"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmailColumns } from "@/components/email/EmailColumns";
import { ComposeModal } from "@/components/email/ComposeModal";
import { useState } from "react";
import { useEmailStore } from "@/store/email-store";
import { ArrowLeft, Bell, Settings } from "lucide-react";
import { EmailCategory } from "@/lib/types/email";

export default function EmailDashboard() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const { activeCategory, setActiveCategory } = useEmailStore();

  return (
    <div className="min-h-screen bg-white">
      <header className="p-4 border-b">
        <div className="flex justify-between items-center">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            go back to dashboard
          </Button>
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5" />
            <Settings className="w-5 h-5" />
            <Button>Chat with us</Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <Tabs
          value={activeCategory}
          onValueChange={(value) => setActiveCategory(value as EmailCategory)}
        >
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="inbox">Inbox</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="spam">Spam</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
            </TabsList>
            <Input placeholder="Search mail..." className="max-w-sm" />
          </div>

          <TabsContent value={activeCategory}>
            <EmailColumns />
          </TabsContent>
        </Tabs>

        <Button
          className="fixed bottom-8 md:left-[12%] shadow-lg"
          onClick={() => setIsComposeOpen(true)}
        >
          Compose
        </Button>
      </main>

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />
    </div>
  );
}
