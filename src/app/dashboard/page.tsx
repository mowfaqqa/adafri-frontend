import DashboardEmailList from "@/components/Dashboard/DashboardEmailComp";
import DashboardMessageList from "@/components/Dashboard/DirectMessagingComp";
import FavoritesCard from "@/components/Dashboard/FavoritesCard";
import FeatureCarousel from "@/components/Dashboard/featureCarousel";
import DashboardPollCard from "@/components/Dashboard/PollingCard";
import { Tab } from "@/lib/interfaces/Dashboard/types";
import React from "react";

const Dashboard = () => {
  return (
    <div className="">
    
      <div className="flex">
        <div>
          <div className="flex gap-1 max-w-3xl">
            <DashboardPollCard />
            <FavoritesCard />
          </div>
          <FeatureCarousel
            tabs={exampleData}
            className="shadow-md border border-gray-200 p-3 my-2 rounded-md"
          />
          <div>
            <DashboardMessageList />
          </div>
        </div>
        <div>
          <DashboardEmailList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

const exampleData: Tab[] = [
  {
    id: "martech",
    label: "Martech",
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
        link: "/dashboard/internal-message",
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
    label: "Adtech",
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
