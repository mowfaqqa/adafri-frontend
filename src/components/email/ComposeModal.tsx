"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useEmailStore } from "@/store/email-store";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComposeModal = ({ isOpen, onClose }: ComposeModalProps) => {
  const { addEmail, draftEmail, updateDraft } = useEmailStore();
  const [email, setEmail] = useState({
    to: draftEmail?.to || "",
    subject: draftEmail?.subject || "",
    content: draftEmail?.content || "",
  });

  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      if (isOpen && (email.to || email.subject || email.content)) {
        updateDraft({
          to: email.to,
          subject: email.subject,
          content: email.content,
          status: "draft",
        });
      }
    }, 5000);

    return () => {
      clearInterval(autosaveInterval);
      if (email.to || email.subject || email.content) {
        addEmail({
          from: "danielodedara@gmail.com",
          to: email.to,
          subject: email.subject,
          content: email.content,
          hasAttachment: false,
          status: "draft",
        });
      }
    };
  }, [isOpen, email, updateDraft, addEmail]);

  const handleSend = () => {
    if (email.to && email.subject) {
      addEmail({
        from: "danielodedara@gmail.com",
        to: email.to,
        subject: email.subject,
        content: email.content,
        hasAttachment: false,
        status: "sent",
      });
      setEmail({ to: "", subject: "", content: "" });
      updateDraft(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              value="danielodedara@gmail.com"
              disabled
              className="bg-gray-100"
            />
          </div>
          <div className="flex items-center">
            <Input
              placeholder="To"
              value={email.to}
              onChange={(e) => setEmail({ ...email, to: e.target.value })}
            />
            <Button variant="ghost" className="ml-2">
              Cc
            </Button>
            <Button variant="ghost">Bcc</Button>
          </div>
          <Input
            placeholder="Subject"
            value={email.subject}
            onChange={(e) => setEmail({ ...email, subject: e.target.value })}
          />
          <textarea
            className="w-full h-64 p-2 border rounded-md"
            placeholder="Compose email"
            value={email.content}
            onChange={(e) => setEmail({ ...email, content: e.target.value })}
          />
          <div className="flex justify-between">
            <Button onClick={handleSend}>Send</Button>
            <Button variant="outline">Send Later</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
