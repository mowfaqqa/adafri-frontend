import React, { useState, useRef } from "react";
import { Send, Paperclip, Smile, Mic, X } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onSendMedia?: (media: File, caption?: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onSendMedia,
  isDisabled = false,
  placeholder = "Type a message",
}) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle sending text message
  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  // Handle sending media
  const handleSendMedia = () => {
    if (selectedFile && onSendMedia) {
      onSendMedia(selectedFile, caption.trim() || undefined);
      setSelectedFile(null);
      setCaption("");
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (selectedFile) {
        handleSendMedia();
      } else {
        handleSendMessage();
      }
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setCaption("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border-t p-3 bg-white">
      {selectedFile && (
        <div className="mb-3 p-3 bg-gray-100 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-sm">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={clearSelectedFile}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mt-2 w-full p-2 bg-white rounded border focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button
            onClick={handleSendMedia}
            className="mt-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={isDisabled}
          >
            Send Media
          </button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        {!selectedFile && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              disabled={isDisabled}
            >
              <Paperclip className="h-5 w-5" />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={isDisabled}
              />
            </button>
            <button
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              disabled={isDisabled}
            >
              <Smile className="h-5 w-5" />
            </button>
          </>
        )}

        <textarea
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 resize-none py-2 px-3 focus:outline-none rounded-md border border-gray-300 max-h-32"
          rows={1}
          disabled={isDisabled}
        />

        <button
          onClick={selectedFile ? handleSendMedia : handleSendMessage}
          disabled={
            isDisabled ||
            (!selectedFile && !message.trim()) ||
            (selectedFile && !onSendMedia)!
          }
          className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {message.trim() || selectedFile ? (
            <Send className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="mt-2 text-xs text-center text-gray-500">
        Press Shift+Enter for a new line, Enter to send
      </div>
    </div>
  );
};

export default MessageInput;
