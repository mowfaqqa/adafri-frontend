// pages/faq/page.tsx or app/faq/page.tsx (depending on your Next.js structure)
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DjombiFAQ from '@/components/faqs/DjombiFAQ';

export default function DjombiFAQPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-gradient-to-r from-blue-500 to-purple-600">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <Link 
              href="/dashboard/professional-mail"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-8 h-8 group-hover:transform group-hover:-translate-x-1 transition-transform duration-200" />
              {/* <span className="font-medium"></span> */}
            </Link>

            {/* Header Content */}
            <div className="flex-1 text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Djombi FAQ
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Everything you need to know about connecting your email and using Djombi effectively
              </p>
            </div>

            {/* Spacer for alignment */}
            <div className="w-40"></div>
          </div>
        </div>
      </div>

      {/* FAQ Component */}
      <DjombiFAQ />
    </div>
  );
}