// app/(dashboard)/signatures/request/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SignatureRequestClient from "./client";

export default function SignatureRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading signature request...</span>
        </div>
      }
    >
      <SignatureRequestClient />
    </Suspense>
  );
}
