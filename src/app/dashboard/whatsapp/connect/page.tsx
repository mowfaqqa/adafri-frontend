"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWhatsAppClient } from "@/lib/hooks/whatsapp/useWhatsAppClient";
import { WhatsAppClientStatus } from "@/lib/types/whatsapp";
import ConnectWhatsApp from "@/components/Whatsapp/ConnectWhatsApp";

export default function ConnectPage() {
  const router = useRouter();

  const { status, qrCode, initClient, isInitializing } = useWhatsAppClient();

  // Redirect if already connected
  useEffect(() => {
    if (status === WhatsAppClientStatus.CONNECTED) {
      router.push("/dashboard/whatsapp");
    }
  }, [status, router]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-white border-b shadow-sm">
        <h1 className="text-xl font-semibold">Connect WhatsApp</h1>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
        <ConnectWhatsApp
          status={status}
          qrCode={qrCode}
          onInitialize={initClient}
          isInitializing={isInitializing}
        />
      </div>
    </div>
  );
}
