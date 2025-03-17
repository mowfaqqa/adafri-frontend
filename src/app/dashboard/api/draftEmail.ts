// api/draftEmail.ts

import { EmailData } from '@/lib/types/email';

/**
 * Safely gets the access token from localStorage
 */
export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

/**
 * Saves an email as a draft using the stored access token
 * @param emailData Object containing email details
 * @returns Response from the email service
 */
export async function saveDraft(emailData: EmailData): Promise<any> {
  console.log("📤 Draft function called with data:", emailData);

  const token = getAccessToken();
  console.log("🔑 Token:", token ? `${token.substring(0, 10)}...` : "No token found");

  if (!token) {
    throw new Error("No access token available");
  }

  const apiEndpoint = "https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts";

  const requestBody = {
    to: emailData.to || "", // Ensure empty fields are sent as empty strings
    subject: emailData.subject || "",
    content: emailData.body || "", // Fix: API expects "content", not "body"
    email_id: emailData.email_id || "", // Ensure this is never undefined
  };

  console.log("📤 Final request body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📥 API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API error response:", errorText);
      throw new Error(errorText || `Failed to save draft: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("✅ API success response:", responseData);
    return responseData;
  } catch (error) {
    console.error("❌ Error in draftEmail function:", error);
    throw error;
  }
}














// In app/dashboard/api/draftEmail.ts
// import axios from "axios";

// interface DraftEmailData {
//   to?: string;
//   cc?: string[];
//   bcc?: string[];
//   subject?: string;
//   content?: string;
//   signature?: string;
//   email_id: string;
// }

// const API_URL = "https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts";
// const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJjYjdlYWNhLWNmNWYtNGQ0Ni1iNGYxLTFmODcyYzcxMWE1YiIsImlhdCI6MTc0MTAzNDYwOSwiZXhwIjoxNzQxMDM4MjA5fQ.5fZUpWPX11oKxhf1lOOqilqvmo40L-MKHm1Qt1uUxbs";

// export function saveDraft(draftData: DraftEmailData): Promise<any> {
//   return axios.post(
//     API_URL,
//     {
//       to: draftData.to || "",
//       subject: draftData.subject || "",
//       content: draftData.content || "",
//       email_id: draftData.email_id,
//       ...(draftData.cc && { cc: draftData.cc }),
//       ...(draftData.bcc && { bcc: draftData.bcc }),
//       ...(draftData.signature && { signature: draftData.signature }),
//     },
//     {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${TOKEN}`,
//       },
//     }
//   ).then(response => {
//     console.log("✅ Draft saved successfully:", response.data);
//     return response.data;
//   }).catch(error => {
//     console.error("❌ Error saving draft:", error);
//     throw new Error(error.response?.data?.message || error.message || "Failed to save draft");
//   });
// }