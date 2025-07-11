'use client';

import React from 'react';
import SearchModal from './SearchModal';

// Your existing data structure
const exampleData = [
  {
    id: "dashboard",
    label: "Dashboard",
    features: [
      {
        id: "dashboard-overview",
        title: "Dashboard Overview",
        subtitle: "View all your stats",
        imageUrl: "/icons/dashboardnew.png",
        link: "/dashboard",
        isActive: true
      }
    ]
  },
  {
    id: "marketing",
    label: "Marketing", 
    features: [
      {
        id: "crm",
        title: "CRM",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/crm.png",
        link: "/dashboard/intern-message",
        isActive: false
      },
      {
        id: "social-listening",
        title: "Social Listening",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/social.png",
        link: "/dashboard/social-listening",
        isActive: false
      },
      {
        id: "post-publisher",
        title: "Post Publisher",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/post-publisher.png",
        link: "/dashboard/post-publisher",
        isActive: true
      },
      {
        id: "ai-calling",
        title: "AI Calling",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/ai-calling.png",
        link: "/dashboard/ai-calling",
        isActive: false
      },
    ]
  },
  {
    id: "tools",
    label: "Tools",
    features: [
      {
        id: "professional-mail",
        title: "Professional Mail",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/online-meeting.png",
        link: "/dashboard/professional-mail",
        isActive: true
      },
      {
        id: "task-manager",
        title: "Task Manager",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/task-manager.png",
        link: "/dashboard/task-manager",
        isActive: true
      },
      {
        id: "website-builder",
        title: "Website Builder",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/website-builder.png",
        link: "/dashboard/website-builder",
        isActive: false
      },
      {
        id: "internal-message",
        title: "Internal Message",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/internal-message.png",
        link: "/dashboard/messaging",
        isActive: false
      },
      {
        id: "online-meeting",
        title: "Online Meeting",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/online-meeting.png",
        link: "/dashboard/online-message",
        isActive: false
      },
      {
        id: "e-sign",
        title: "E-Sign",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/e-sign.png",
        link: "/dashboard/e-sign",
        isActive: false
      },
      {
        id: "image-editor",
        title: "Image Editor",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/image-editor.png",
        link: "/dashboard/image-editor",
        isActive: false
      },
      {
        id: "note",
        title: "Note",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/note.png",
        link: "/dashboard/notes",
        isActive: true
      },
    ],
  },
  {
    id: "advertising",
    label: "Advertising",
    features: [
      {
        id: "google-ads",
        title: "Google Ads",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/google-ads.png",
        link: "/dashboard/google-ads",
        isActive: true
      },
      {
        id: "sms",
        title: "SMS",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/sms.png",
        link: "/dashboard/google-ads",
        isActive: true
      },
      {
        id: "mass-mailing",
        title: "Mass Mailing",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/mass-mailing.png",
        link: "/dashboard/google-ads",
        isActive: false
      },
      {
        id: "Meta",
        title: "Meta",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/meta.png",
        link: "/dashboard/meta",
        isActive: false
      },
      {
        id: "twitter",
        title: "Twitter",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/twitter.png",
        link: "/dashboard/twitter",
        isActive: false
      },
      {
        id: "tiktok",
        title: "Tiktok",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/tiktok.png",
        link: "/dashboard/tiktok",
        isActive: false
      },
      {
        id: "linkedIn",
        title: "LinkedIn",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/linkedin.png",
        link: "/dashboard/linkedin",
        isActive: false
      },
      {
        id: "spotify",
        title: "Spotify",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/spotify.png",
        link: "/dashboard/spotify",
        isActive: false
      },
    ],
  },
  {
    id: "whatsapp",
    label: "Whatsapp",
    features: [
      {
        id: "whatsapp-messaging",
        title: "WhatsApp Messaging",
        subtitle: "Connect with customers",
        imageUrl: "/icons/whatsapp.png",
        link: "/dashboard/whatsapp",
        isActive: true
      }
    ]
  },
  {
    id: "chatgpt",
    label: "ChatGPT", 
    features: [
      {
        id: "chatgpt-assistant",
        title: "ChatGPT Assistant",
        subtitle: "AI-powered assistance",
        imageUrl: "/icons/chatgpt.png",
        link: "/dashboard/chatgpt",
        isActive: true
      }
    ]
  },
  {
    id: "telegram",
    label: "Telegram",
    features: [
      {
        id: "telegram-messaging",
        title: "Telegram Messaging",
        subtitle: "Secure communication",
        imageUrl: "/icons/telegram.png", 
        link: "/dashboard/telegram",
        isActive: true
      }
    ]
  }
];

interface SearchProviderProps {
  children: React.ReactNode;
}

const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <SearchModal tabs={exampleData} />
    </>
  );
};

export default SearchProvider;