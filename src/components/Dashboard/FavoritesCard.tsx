/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import FavoritesCardItem from "./FavoritesCardItem";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Code to edit FavoritesCard
const FavoritesCard = () => {
  return (
    <div className=" p-2 flex gap-x-1 items-center max-w-6xl bg-white rounded-xl relative pt-10 shadow-md mb-5">
      <CardHeader className="pb-0 absolute top-0 left-0">
        <CardTitle className="text-xl mb-6">Favourites</CardTitle>
      </CardHeader>
      {favorites.map((feature: any, index) => (
        <FavoritesCardItem
          key={`${feature.id}-${index}`}
          feature={feature}
          className="flex-shrink-0 px-3 mt-6"
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
