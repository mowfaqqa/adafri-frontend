"use client";
import React, { useState, useEffect } from "react";
// import DashboardEmailList from "@/components/Dashboard/DashboardEmailComp";
// import DashboardMessageList from "@/components/Dashboard/DirectMessagingComp";
// import FavoritesCard from "@/components/Dashboard/FavoritesCard";
import FeatureCarousel from "@/components/Dashboard/featureCarousel";
// import DashboardPollCard from "@/components/Dashboard/PollingCard";
import { Tab } from "@/lib/interfaces/Dashboard/types";
import FavoritesCard2 from "@/components/Dashboard/FavoritesCard2";
import EmailOnlineMessaging from "@/components/Dashboard/EmailOnlineMessaging";
import { PollingCard2 } from "@/components/Dashboard/PollingCard2";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getUserInfo, clearAuthCookies } from "@/lib/utils/cookies";



const Dashboard = () => {
  const [userInfo, setUserInfo] = useState({ name: ""});
  const [pollData, setPollData] = useState({
    title: "Vote for the Next Feature",
    options: [
      { id: "e-sign", label: "E-Sign", votes: 50 },
      { id: "image-editor", label: "Image Editor", votes: 70 },
      { id: "ai-calling", label: "AI Calling", votes: 40 },
      { id: "crm", label: "CRM", votes: 30 },
    ],
  });

  const handleVote = (optionId: string) => {
    setPollData((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.id === optionId ? { ...option, votes: option.votes + 1 } : option
      ),
    }));
  };

  // Load user info from cookies on component mount
    useEffect(() => {
      const cookieInfo = getUserInfo();
      setUserInfo({
        name: cookieInfo.name || "User",
      });
    }, []);

  return (
    <ProtectedRoute>
      <div className="p-6 min-h-screen overflow-hidden overflow-y-auto transition-all duration-300">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-700 text-white p-8 rounded-xl mb-8 mt-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-2xl font-medium">Welcome {userInfo.name}</h1>
            <p>We are here to help you</p>
          </div>
          {/* Polling Card */}
          <PollingCard2 options={pollData.options} />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Section (Expanded) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <FavoritesCard2 className="" />
            <FeatureCarousel
              tabs={exampleData}
              className="shadow-md border border-gray-200 rounded-xl overflow-hidden"
            />
          </div>

          {/* Right Section */}
          <div className="col-span-1 lg:col-span-1 w-full min-w-0">
            <EmailOnlineMessaging className="w-full" />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;





// Feature cards list

const exampleData: Tab[] = [
  {
    id: "martech",
    label: "Marketing",
    features: [
      {
        id: "mass-mailing",
        title: "Mass Mailing",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/mass-mailing.png",
        link: "/dashboard/mass-mailing",
      },
      {
        id: "crm",
        title: "CRM",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/crm.png",
        link: "/dashboard/intern-message",
      },
      {
        id: "social-listening",
        title: "Social Listening",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/social.png",
        link: "/dashboard/social-listening",
      },
      {
        id: "post-publisher",
        title: "Post Publisher",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/post-publisher.png",
        link: "/dashboard/post-publisher",
      },
      {
        id: "ai-calling",
        title: "AI Calling",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/ai-calling.png",
        link: "/dashboard/ai-calling",
      },
      {
        id: "sms",
        title: "SMS",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/sms.png",
        link: "/dashboard/sms",
      },
    ],
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
      },
      {
        id: "website-builder",
        title: "Website Builder",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/website-builder.png",
        link: "/dashboard/website-builder",
      },
      {
        id: "internal-message",
        title: "Internal Message",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/internal-message.png",
        link: "/dashboard/messaging",
      },
      {
        id: "online-meeting",
        title: "Online Meeting",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/online-meeting.png",
        link: "/dashboard/online-message",
      },
      {
        id: "e-sign",
        title: "E-Sign",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/e-sign.png",
        link: "/dashboard/e-sign",
      },
      {
        id: "task-manager",
        title: "Task Manager",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/task-manager.png",
        link: "/dashboard/task-manager",
      },
      {
        id: "image-editor",
        title: "Image Editor",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/image-editor.png",
        link: "/dashboard/image-editor",
      },
    ],
  },
  {
    id: "adtech",
    label: "Advertising",
    features: [
      {
        id: "google-ads",
        title: "Google Ads",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/google-ads.png",
        link: "/dashboard/google-ads",
      },
      {
        id: "Meta",
        title: "Meta",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/meta.png",
        link: "/dashboard/meta",
      },
      {
        id: "twitter",
        title: "Twitter",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/twitter.png",
        link: "/dashboard/twitter",
      },
      {
        id: "tiktok",
        title: "Tiktok",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/tiktok.png",
        link: "/dashboard/tiktok",
      },
      {
        id: "linkedIn",
        title: "LinkedIn",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/linkedin.png",
        link: "/dashboard/linkedin",
      },
      {
        id: "spotify",
        title: "Spotify",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/spotify.png",
        link: "/dashboard/spotify",
      },
    ],
  },
];
