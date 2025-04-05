// app/e-signature/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ESignatureOverview from '@/components/ESignature/ESignatureOverview';
import React from 'react';


export const metadata = {
  title: 'E-Signature Workflow',
  description: 'Manage document signatures securely',
};

export default function ESignature() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <ESignatureOverview />
        </div>
      </div>
    </ProtectedRoute>
  );
}