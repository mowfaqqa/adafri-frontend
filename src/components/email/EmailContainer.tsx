import { useState } from "react";
import { EmailSent } from "./EmailSent";
import { EmailDraft } from "./EmailDraft";
import { EmailSpam } from "./EmailSpam";
// import { EmailAgenda } from "./EmailAgenda";
import { EmailCategory } from "@/lib/types/email";
import { EmailColumns2 } from "./EmailColumns2";

interface EmailContainerProps {
  selectedCategory: EmailCategory;
  onBack?: () => void;
}

export const EmailContainer = ({ selectedCategory, onBack }: EmailContainerProps) => {
  // Render different components based on the selected category
  switch (selectedCategory) {
    case "sent":
      return <EmailSent onBack={onBack} />;
    case "draft":
      return <EmailDraft onBack={onBack} />;
    case "spam":
      return <EmailSpam onBack={onBack} />;
    case "agenda":
    //   return <EmailAgenda onBack={onBack} />;
    case "inbox":
    default:
      // For inbox, use the original EmailColumns component
      return <EmailColumns2 />;
  }
};