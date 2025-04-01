/* eslint-disable @typescript-eslint/no-explicit-any */
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
const TOKEN = process.env.AUTH_TOKEN; // Replace with actual token

const sendEmailAPI = async (emailData: EmailData): Promise<any> => {
    try {
      // Input validation
      if (!emailData.to || !emailData.subject || !emailData.body) {
        throw new Error("To, Subject, and Body are required");
      }
  
      console.log("📩 Preparing to send email:", emailData);
  
      // Prepare request data - clean up undefined values
      const requestData = {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        email_id: emailData.email_id,
        ...(emailData.cc && { cc: emailData.cc }),
        ...(emailData.bcc && { bcc: emailData.bcc }),
        ...(emailData.signature && { signature: emailData.signature }),
      };
  
      // Make the API request with a timeout
      const response = await axios.post(API_URL, requestData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        timeout: 10000, // 10 second timeout
      });
  
      console.log("✅ Email sent successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error sending email:", error);
      
      // Enhanced error handling
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const responseData = error.response?.data;
        
        if (statusCode === 401) {
          throw new Error("Authentication failed. Your session may have expired.");
        } else if (statusCode === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        } else if (statusCode === 400) {
          throw new Error(responseData?.message || "Invalid email data provided.");
        } else if (statusCode === 500) {
          throw new Error("Server error. Please try again later.");
        } else if (error.code === 'ECONNABORTED') {
          throw new Error("Request timed out. Please check your connection and try again.");
        }
        
        throw new Error(responseData?.message || error.message || "Email sending failed");
      }
      
      throw new Error(error.message || "Email sending failed");
    }
  };

  export default sendEmailAPI;