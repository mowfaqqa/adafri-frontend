// In app/dashboard/api/draftEmail.ts
import axios from "axios";

interface DraftEmailData {
  to?: string;
  cc?: string[];
  bcc?: string[];
  subject?: string;
  content?: string;
  signature?: string;
  email_id: string;
}

const API_URL = "https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts";
const TOKEN = process.env.AUTH_TOKEN;

export function saveDraft(draftData: DraftEmailData) {
  return axios.post(
    API_URL,
    {
      to: draftData.to || "",
      subject: draftData.subject || "",
      content: draftData.content || "",
      email_id: draftData.email_id,
      ...(draftData.cc && { cc: draftData.cc }),
      ...(draftData.bcc && { bcc: draftData.bcc }),
      ...(draftData.signature && { signature: draftData.signature }),
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  ).then(response => {
    console.log("✅ Draft saved successfully:", response.data);
    return response.data;
  }).catch(error => {
    console.error("❌ Error saving draft:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to save draft");
  });
}