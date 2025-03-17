// api/sendEmail.ts

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
 * Sends an email using the stored access token
 * @param emailData Object containing email details
 * @returns Response from the email service
 */
export async function sendEmail(emailData: EmailData): Promise<any> {
  console.log("sendEmail function called with data:", emailData);

  const token = getAccessToken();
  console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');

  if (!token) {
    throw new Error("No access token available");
  }

  // API endpoint
  const apiEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/send';
  console.log("Sending request to API endpoint:", apiEndpoint);

  // Prepare the request body
  const requestBody = {
    to: emailData.to,
    cc: emailData.cc || [],
    bcc: emailData.bcc || [],
    subject: emailData.subject,
    body: emailData.body,
    signature: emailData.signature || undefined,
    email_id: emailData.email_id
  };

  console.log("Prepared request body:", requestBody);

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log("API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error response:", errorText);
      throw new Error(errorText || `Failed to send email: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("API success response:", responseData);
    return responseData;
  } catch (error) {
    console.error('Error in sendEmail function:', error);
    throw error;
  }
}






















// import axios from "axios";

// interface EmailData {
//   to: string;
//   cc?: string[];
//   bcc?: string[];
//   subject: string;
//   body: string;
//   signature?: string;
//   email_id: string;
// }

// const API_URL = "https://email-service-latest-agqz.onrender.com/api/v1/emails/send";
// const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJjYjdlYWNhLWNmNWYtNGQ0Ni1iNGYxLTFmODcyYzcxMWE1YiIsImlhdCI6MTc0MTYxMzU3MCwiZXhwIjoxNzQxNjE3MTcwfQ.srlm27QtxhBr4AoI_iCTX_2bMKOYLliYG_utmDix0yo";

// Export as a function declaration instead of arrow function
// export function sendEmail(emailData: EmailData): Promise<any> {
//   return axios.post(
//     API_URL,
//     {
//       ...emailData,
//       cc: emailData.cc || undefined,
//       bcc: emailData.bcc || undefined,
//       signature: emailData.signature || undefined,
//     },
//     {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${TOKEN}`,
//       },
//     }
//   ).then(response => {
//     console.log("✅ Email sent successfully:", response.data);
//     return response.data;
//   }).catch(error => {
//     console.error("❌ Error sending email:", error);
//     throw new Error(error.response?.data?.message || error.message || "Email sending failed");
//   });
// }