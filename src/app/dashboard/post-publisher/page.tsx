import PostDashboard from '@/components/PostPublisher/PostDashboard';
import React from 'react';

export const metadata = {
  title: 'Post Publisher - Djombi App',
  description: 'Manage content across all channels with advanced publishing tools',
};

export default function PostPage() {
  return (
    <div className="space-y-6 p-6">
      <PostDashboard />
    </div>
  );
}