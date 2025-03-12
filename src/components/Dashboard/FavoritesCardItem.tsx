/* eslint-disable @next/next/no-img-element */
import { Feature } from "@/lib/interfaces/Dashboard/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "../ui/card";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

const FavoritesCardItem: React.FC<{ feature: Feature; className?: string }> = ({
  feature,
  className,
}) => {
  return (
    // <Link href={feature.link}>
    //   <div className={cn("block group no-underline w-full", className)}>
    //     <Card className="w-full h-full transition-shadow hover:shadow-md flex flex-col justify-between p-4">
    //       <CardContent className=" flex flex-col items-center text-center flex-grow">
    //         <h3 className="font-bold mb-0.5 group-hover:text-emerald-600">
    //           {feature.title}
    //         </h3>
    //         <p className="text-[10px] text-gray-500">{feature.subtitle}</p>
    //         <div className="w-[60px] h-[60px] my-3 relative">
    //           <img
    //             src={feature.imageUrl}
    //             alt={feature.title}
    //             className="w-full h-full object-contain"
    //           />
    //           <ExternalLink className="w-4 h-4 self-end text-gray-400" />
    //         </div>
    //       </CardContent>
    //     </Card>
    //   </div>
    // </Link>

    //  TO edit the favourites section inner cards
    <div className="flex flex-wrap gap-6 h-[250px]">
      <Link href={feature.link} className="group no-underline w-full">
        <Card className="w-full h-full mb-5 m-auto hover:shadow-md flex flex-col justify-center items-center p-3 shadow-none px-3">
          <CardContent className="flex flex-col items-center text-center justify-center flex-grow">
            <div className="w-[60px] h-[60px] mb-5 flex items-center justify-center">
              <img
                src={feature.imageUrl}
                alt={feature.title}
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="font-bold mb-0.5 group-hover:text-emerald-600">
              {feature.title}
            </h3>
            <p className="text-[10px] text-gray-500">{feature.subtitle}</p>
          </CardContent>
        </Card>
      </Link>
    </div>

  );
};

export default FavoritesCardItem;
