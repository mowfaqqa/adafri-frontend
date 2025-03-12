import DashboardEmailList from "@/components/Dashboard/DashboardEmailComp";
import DashboardMessageList from "@/components/Dashboard/DirectMessagingComp";
import FavoritesCard from "@/components/Dashboard/FavoritesCard";
import FeatureCarousel from "@/components/Dashboard/featureCarousel";
import DashboardPollCard from "@/components/Dashboard/PollingCard";
import { Tab } from "@/lib/interfaces/Dashboard/types";

import React from "react";

// const Dashboard = () => {
//   return (
//     <div className="">
//       <div className="flex">
//         <div>
//           <div className="flex gap-1 max-w-3xl">
//             <DashboardPollCard />
//             <FavoritesCard />
//           </div>
//           <FeatureCarousel
//             tabs={exampleData}
//             className="shadow-md border border-gray-200 p-3 my-2 rounded-md"
//           />
//           <div>
//             <DashboardMessageList />
//           </div>
//         </div>
//         <div>
//           <DashboardEmailList />
//         </div>
//       </div>
//     </div>
//   );
// };

const Dashboard = () => {
  return (
    <div className="p-6 w-full h-screen overflow-y-auto">
      {/* Main layout grid */}

      <h1 className="font-semibold mb-5 sticky ml-5 mb-4 text-4xl lg:text-3xl">Good Morning, Muwaff</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left Section - Takes 2/3 of the space */}
        <div className="space-y-5 flex-1">
          {/* Poll & Favorites */}
          <div className="flex flex-col md:flex-row gap-6 rounded-xl">
            <DashboardPollCard />
            <FavoritesCard />
          </div>

          {/* Feature Carousel - Spans Full Width of Poll & Favorites */}
          <div className="col-span-2">
            <FeatureCarousel
              tabs={exampleData}
              className="shadow-md border border-gray-200 p-4 rounded-xl overflow-x-auto"
            />
          </div>

          {/* Direct Messaging */}
          <DashboardMessageList />
        </div>

        {/* Right Section - Takes 1/3 of the space */}
        <div className="flex-1 gap-6">
          <DashboardEmailList/>
        </div>
      </div>
    </div>
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
