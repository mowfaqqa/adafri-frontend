/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import FavoritesCardItem from "./FavoritesCardItem";

const FavoritesCard = () => {
  return (
    <div className=" p-2 flex gap-x-1 items-center max-w-4xl bg-white rounded-md shadow-md">
      {favorites.map((feature: any, index) => (
        <FavoritesCardItem
          key={`${feature.id}-${index}`}
          feature={feature}
          className="flex-shrink-0 px-3"
        />
      ))}
    </div>
  );
};

export default FavoritesCard;

const favorites = [
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
];
