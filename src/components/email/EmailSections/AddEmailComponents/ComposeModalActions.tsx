"use client";

import { Button } from "@/components/ui/button";
import { useEmailStore } from "@/store/email-store";
import { useCallback } from "react";

interface ComposeModalActionsProps {
  loading: boolean;
  onSend: () => void;
  onSendLater: () => void;
  error?: string;
  onClose?: () => void;
}

export const ComposeModalActions = ({
  loading,
  onSend,
  onSendLater,
  error,
  onClose
}: ComposeModalActionsProps) => {
  
  // FIXED: Get refreshCurrentCategory from email store
  const { refreshCurrentCategory, activeCategory } = useEmailStore();
  
  // FIXED: Enhanced send handler that ensures refresh after sending
  const handleSend = useCallback(async () => {
    try {
      // Call the original send function
      await onSend();
      
      // FIXED: Force refresh of current category if it's 'sent'
      if (activeCategory === 'sent') {
        console.log('ComposeModalActions: Refreshing sent emails after send');
        setTimeout(() => {
          refreshCurrentCategory();
        }, 500);
      }
      
    } catch (error) {
      console.error('Error in ComposeModalActions handleSend:', error);
    }
  }, [onSend, activeCategory, refreshCurrentCategory]);
  
  // FIXED: Enhanced send later handler that ensures refresh after saving draft
  const handleSendLater = useCallback(async () => {
    try {
      // Call the original send later function
      await onSendLater();
      
      // FIXED: Force refresh of current category if it's 'draft'
      if (activeCategory === 'draft') {
        console.log('ComposeModalActions: Refreshing drafts after save');
        setTimeout(() => {
          refreshCurrentCategory();
        }, 500);
      }
      
    } catch (error) {
      console.error('Error in ComposeModalActions handleSendLater:', error);
    }
  }, [onSendLater, activeCategory, refreshCurrentCategory]);

  return (
    <div className="space-y-2">
      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-x-2 items-center">
        <Button
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Sending...' : 'Send Email'}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleSendLater} 
          disabled={loading}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Send Later
        </Button>
      </div>
    </div>
  );
};