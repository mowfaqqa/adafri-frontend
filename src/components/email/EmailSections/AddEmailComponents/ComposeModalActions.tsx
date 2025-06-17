"use client";

import { Button } from "@/components/ui/button";

interface ComposeModalActionsProps {
  loading: boolean;
  onSend: () => void;
  onSendLater: () => void;
  error?: string;
}

export const ComposeModalActions = ({
  loading,
  onSend,
  onSendLater,
  error
}: ComposeModalActionsProps) => {
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
          onClick={onSend}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Sending...' : 'Send Email'}
        </Button>
        <Button 
          variant="outline" 
          onClick={onSendLater} 
          disabled={loading}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Send Later
        </Button>
      </div>
    </div>
  );
};