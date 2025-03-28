// Create a new file: app/dashboard/api/emailSend.ts

import axios from "axios";

interface EmailData {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  signature?: string;
  email_id: string;
}

const API_URL = "https://email-service-latest-agqz.onrender.com/api/v1/emails/send";
const TOKEN = process.env.AUTH_TOKEN;

// Export as a function declaration instead of arrow function
export function sendEmail(emailData: EmailData) {
  return axios.post(
    API_URL,
    {
      ...emailData,
      cc: emailData.cc || undefined,
      bcc: emailData.bcc || undefined,
      signature: emailData.signature || undefined,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  ).then(response => {
    console.log("✅ Email sent successfully:", response.data);
    return response.data;
  }).catch(error => {
    console.error("❌ Error sending email:", error);
    throw new Error(error.response?.data?.message || error.message || "Email sending failed");
  });
}