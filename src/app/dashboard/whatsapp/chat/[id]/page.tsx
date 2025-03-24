"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWhatsAppClient } from "@/lib/hooks/whatsapp/useWhatsAppClient";
import { useChat } from "@/lib/hooks/whatsapp/useChat";
import { WhatsAppClientStatus } from "@/lib/types/whatsapp";
import ChatArea from "@/components/Whatsapp/ChatArea";

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter();
  const chatId = params.id;

  const {
    status,
    messages,
    fetchMessages,
    selectChat,
    sendTextMessage,
    sendMediaMessage,
  } = useWhatsAppClient();

  const { chats } = useChat();

  // Find chat object
  const chat = chats.find((c) => c.id === chatId);

  // Set current chat and fetch messages
  useEffect(() => {
    if (status === WhatsAppClientStatus.CONNECTED) {
      selectChat(chatId);
      fetchMessages(chatId);
    }
  }, [status, chatId, selectChat, fetchMessages]);

  // Redirect if not connected
  useEffect(() => {
    if (
      status === WhatsAppClientStatus.NOT_INITIALIZED ||
      status === WhatsAppClientStatus.INITIALIZING ||
      status === WhatsAppClientStatus.QR_READY ||
      status === WhatsAppClientStatus.AUTHENTICATED
    ) {
      router.push("/dashboard/whatsapp");
    }
  }, [status, router]);

  // Handle back button
  const handleBack = () => {
    router.push("/dashboard/whatsapp");
  };

  return (
    <div className="h-full flex flex-col">
      <ChatArea
        chat={chat}
        messages={messages[chatId] || []}
        onSendMessage={(message) => sendTextMessage({ chatId, message })}
        onSendMedia={(media, caption) =>
          sendMediaMessage({ chatId, media, caption })
        }
        onBack={handleBack}
        onRefresh={() => fetchMessages(chatId)}
      />
    </div>
  );
}
