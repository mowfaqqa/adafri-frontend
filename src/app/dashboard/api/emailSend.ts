// api/sendEmail.ts

import { EmailData, EmailSendData } from '@/lib/types/email';
import { getAuthToken } from '@/lib/utils/cookies';
import { DjombiProfileService } from '@/lib/services/DjombiProfileService';

/**
 * Get Djombi access token for email service
 */
const getDjombiAccessToken = (): string | null => {
  // First try from DjombiProfileService
  const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
  if (accessToken) {
    return accessToken;
  }
  
  // Fallback to localStorage directly
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('djombi_access_token');
    if (storedToken) {
      return storedToken;
    }
  }
  
  return null;
};

/**
 * Sends an email using the Djombi access token (not the Adafri token)
 * @param emailData Object containing email details
 * @returns Response from the email service
 */
export async function sendEmail(emailData: EmailSendData): Promise<any> {
  console.log("sendEmail function called with data:", emailData);

  // Get the Djombi token instead of the general auth token
  const djombiToken = getDjombiAccessToken();
  console.log("Djombi token retrieved:", djombiToken ? `${djombiToken.substring(0, 10)}...` : 'No Djombi token found');

  // Also log the regular auth token for comparison
  const regularToken = getAuthToken();
  console.log("Regular auth token:", regularToken ? `${regularToken.substring(0, 10)}...` : 'No regular token found');

  if (!djombiToken) {
    console.error("No Djombi access token available. Make sure user is authenticated with Djombi.");
    throw new Error("No Djombi access token available. Please log in again.");
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
    content: emailData.content,
    signature: emailData.signature || undefined,
    email_id: emailData.email_id
  };

  console.log("Prepared request body:", requestBody);

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${djombiToken}` // Use Djombi token here
      },
      body: JSON.stringify(requestBody)
    });

    console.log("API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error response:", errorText);
      
      // Handle specific authentication errors
      if (response.status === 401) {
        throw new Error("Authentication failed. Your session may have expired. Please log in again.");
      } else if (response.status === 403) {
        throw new Error("Access denied. You don't have permission to send emails.");
      } else {
        throw new Error(errorText || `Failed to send email: ${response.status}`);
      }
    }

    const responseData = await response.json();
    console.log("API success response:", responseData);
    return responseData;
  } catch (error) {
    console.error('Error in sendEmail function:', error);
    throw error;
  }
}

































// // api/sendEmail.ts

// import { EmailData, EmailSendData } from '@/lib/types/email';
// import { getAuthToken } from '@/lib/utils/cookies';

// /**
//  * Sends an email using the stored access token
//  * @param emailData Object containing email details
//  * @returns Response from the email service
//  */
// export async function sendEmail(emailData: EmailSendData): Promise<any> {
//   console.log("sendEmail function called with data:", emailData);

//   const token = getAuthToken();
//   console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');

//   if (!token) {
//     throw new Error("No access token available");
//   }

//   // API endpoint
//   const apiEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/send';
//   console.log("Sending request to API endpoint:", apiEndpoint);

//   // Prepare the request body
//   const requestBody = {
//     to: emailData.to,
//     cc: emailData.cc || [],
//     bcc: emailData.bcc || [],
//     subject: emailData.subject,
//     content: emailData.content,
//     signature: emailData.signature || undefined,
//     email_id: emailData.email_id
//   };

//   console.log("Prepared request body:", requestBody);

//   try {
//     const response = await fetch(apiEndpoint, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       },
//       body: JSON.stringify(requestBody)
//     });

//     console.log("API response status:", response.status);

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error("API error response:", errorText);
//       throw new Error(errorText || `Failed to send email: ${response.status}`);
//     }

//     const responseData = await response.json();
//     console.log("API success response:", responseData);
//     return responseData;
//   } catch (error) {
//     console.error('Error in sendEmail function:', error);
//     throw error;
//   }
// }























// // api/sendEmail.ts

// import { EmailData } from '@/lib/types/email';

// /**
//  * Safely gets the access token from localStorage
//  */
// export const getAccessToken = (): string | null => {
//   if (typeof window !== 'undefined') {
//     return localStorage.getItem('token');
//   }
//   return null;
// };

// /**
//  * Sends an email using the stored access token
//  * @param emailData Object containing email details
//  * @returns Response from the email service
//  */
// export async function sendEmail(emailData: EmailData): Promise<any> {
//   console.log("sendEmail function called with data:", emailData);

//   const token = getAccessToken();
//   console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');

//   if (!token) {
//     throw new Error("No access token available");
//   }

//   // API endpoint
//   const apiEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/send';
//   console.log("Sending request to API endpoint:", apiEndpoint);

//   // Prepare the request body
//   const requestBody = {
//     to: emailData.to,
//     cc: emailData.cc || [],
//     bcc: emailData.bcc || [],
//     subject: emailData.subject,
//     content: emailData.content,
//     signature: emailData.signature || undefined,
//     email_id: emailData.email_id
//   };

//   console.log("Prepared request body:", requestBody);

//   try {
//     const response = await fetch(apiEndpoint, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       },
//       body: JSON.stringify(requestBody)
//     });

//     console.log("API response status:", response.status);

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error("API error response:", errorText);
//       throw new Error(errorText || `Failed to send email: ${response.status}`);
//     }

//     const responseData = await response.json();
//     console.log("API success response:", responseData);
//     return responseData;
//   } catch (error) {
//     console.error('Error in sendEmail function:', error);
//     throw error;
//   }
// }






















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