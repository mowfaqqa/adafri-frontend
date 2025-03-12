"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmailColumns } from "@/components/email/EmailColumns";
import { ComposeModal } from "@/components/email/ComposeModal";
import { useState } from "react";
import { useEmailStore } from "@/store/email-store";
import { ArrowLeft, Bell, Settings, Pencil } from "lucide-react";
import { EmailCategory } from "@/lib/types/email";
import { EmailSent } from "@/components/email/EmailSent";
import { LinkEmailModal } from "@/components/email/LinkEmailModal";

export default function EmailDashboard() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const { activeCategory, setActiveCategory } = useEmailStore();

  return (
    <div className="min-h-screen">

      <main className="p-6 ">
        <Tabs
          value={activeCategory}
          onValueChange={(value) => setActiveCategory(value as EmailCategory)}
        >
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="inbox" className="">Inbox</TabsTrigger>
              <TabsTrigger value="sent" className="">Sent</TabsTrigger>
              <TabsTrigger value="draft" className="">Draft</TabsTrigger>
              <TabsTrigger value="spam" className="">Spam</TabsTrigger>
              <TabsTrigger value="agenda" className="">Agenda</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3">
              <LinkEmailModal />
              <Input placeholder="Search mail..." className="max-w-sm" />
            </div>
          </div>

          <TabsContent value={activeCategory}>
            <EmailColumns />
          </TabsContent>
          <TabsContent value="sent">
            <EmailSent />
          </TabsContent>
        </Tabs>

        <Button
          className="fixed bottom-8 md:right-[90px] shadow-lg"
          onClick={() => setIsComposeOpen(true)}
        > <Pencil className="w-4 h-4" />
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
