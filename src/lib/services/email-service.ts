import { Email, ApiResponse } from "@/lib/types/email";
import { getAuthToken, getCookie } from "@/lib/utils/cookies";

const API_BASE_URL = "https://email-service-latest-agqz.onrender.com/api/v1";

export const emailService = {
    async getDraftEmails(): Promise<Email[]> {
        const token = getAuthToken();
        const linkedEmailId = getCookie("linkedEmailId");

        if (!token) {
            throw new Error("No access token available");
        }

        if (!linkedEmailId) {
            throw new Error("No linked email ID found");
        }

        const response = await fetch(
            `${API_BASE_URL}/emails/drafts?email_id=${encodeURIComponent(
                linkedEmailId
            )}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data: ApiResponse<Email[]> = await response.json();

        // Handle different response structures
        let emailsData: any[] = [];
        if (Array.isArray(data)) {
            emailsData = data;
        } else if (data.data && Array.isArray(data.data)) {
            emailsData = data.data;
        } else if (data.drafts && Array.isArray(data.drafts)) {
            emailsData = data.drafts;
        } else if (data.success === true && data.data) {
            emailsData = Array.isArray(data.data) ? data.data : [data.data];
        } else {
            // Look for any array in the response
            for (const key in data) {
                if (Array.isArray(data[key]) && data[key].length > 0) {
                    emailsData = data[key];
                    break;
                }
            }

            // Handle single draft case
            if (emailsData.length === 0 && typeof data === "object" && data !== null) {
                if (data.id || data._id) {
                    emailsData = [data];
                }
            }
        }

        // Format emails to ensure consistent structure
        return emailsData.map((email: any) => ({
            id: email.id || email._id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            to: email.to || "No recipient",
            subject: email.subject || "No subject",
            content: email.content || "",
            createdAt: email.createdAt || email.created_at || Date.now(),
            status: "draft",
        }));
    },

    async deleteDraft(id: string): Promise<boolean> {
        const token = getAuthToken();
        const linkedEmailId = getCookie("linkedEmailId");

        if (!token) {
            throw new Error("No access token found");
        }

        if (!linkedEmailId) {
            throw new Error("No linked email ID found");
        }

        try {
            // First attempt - DELETE method
            const deleteEndpoint = `${API_BASE_URL}/emails/drafts/${id}?email_id=${encodeURIComponent(linkedEmailId)}`;
            const response = await fetch(deleteEndpoint, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                return true;
            }

            // Fallback - POST method
            const postEndpoint = `${API_BASE_URL}/emails/drafts/delete`;
            const alternativeResponse = await fetch(postEndpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email_id: linkedEmailId,
                    draft_id: id,
                }),
            });

            if (!alternativeResponse.ok) {
                throw new Error(`Failed to delete draft`);
            }

            return true;
        } catch (error) {
            throw error;
        }
    },
};