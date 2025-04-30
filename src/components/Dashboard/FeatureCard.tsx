/* eslint-disable @next/next/no-img-element */
import { Feature } from "@/lib/interfaces/Dashboard/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "../ui/card";
// import { ExternalLink } from "lucide-react";
import Link from "next/link";

const FeatureCard: React.FC<{ feature: Feature; className?: string }> = ({
  feature,
  className,
}) => {
  return (
    <div className="flex flex-wrap gap-6 h-[300px] bg-grey-500 mb-8 flex justify-center items-center">
      <Link href={feature.link}>
        <div className={cn("block group no-underline", className)}>
          <Card className="w-52 h-[300px] relative flex items-center justify-center">
            <CardContent className="p-6 flex flex-col items-start relative">
              <div className="w-full">
                <h3
                  className="text-lg mt-1 font-bold group-hover:text-emerald-600 text-left"
                  style={{ fontFamily: '"Raleway", "Arial", sans-serif' }}
                >
                  {feature.title}
                </h3>
                <p className="text-xs mt-4 text-gray-500 text-left">{feature.subtitle}</p>
              </div>
              <div className="w-[80px] h-[80px] my-5 self-center relative">
                <img
                  src={feature.imageUrl}
                  alt={feature.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </Link>
    </div>

  );
};

export default FeatureCard;

{/* External Link at Bottom Right */ }
{/* <div className="absolute bottom-2 right-2">
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </div> */}