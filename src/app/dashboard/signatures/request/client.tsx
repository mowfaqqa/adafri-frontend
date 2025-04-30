"use client";

import { useSearchParams } from "next/navigation";
import SignatureRequestForm from "@/components/E-signature/Signature/SignatureRequestForm";

export default function SignatureRequestClient() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");

  return <SignatureRequestForm documentId={documentId || ""} />;
}
