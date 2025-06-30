// app/invoices/page.tsx
import InvoiceOverview from '@/components/invoice/InvoiceOverview';
import React from 'react';

export const metadata = {
  title: 'Invoice Management',
  description: 'Create and manage your invoices and billing',
};

export default function InvoicesPage() {
  return (
      <div className="space-y-6">
        <InvoiceOverview />
      </div>
  );
}