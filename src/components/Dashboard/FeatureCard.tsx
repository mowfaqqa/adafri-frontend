import { Feature } from "@/lib/interfaces/Dashboard/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "../ui/card";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

const FeatureCard: React.FC<{ feature: Feature; className?: string }> = ({
  feature,
  className,
}) => {
  return (
    <Link href={feature.link}>
      <div className={cn("block group no-underline", className)}>
        <Card className="w-52 h-52 transition-shadow hover:shadow-lg">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <h3 className="text-lg font-bold mb-0.5 group-hover:text-emerald-600">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-500">{feature.subtitle}</p>
            <div className="w-[80px] h-[80px] my-5 relative">
              <img
                src={feature.imageUrl}
                alt={feature.title}
                className="w-full h-full object-contain"
              />
              <ExternalLink className="w-4 h-4 absolute bottom-0 right-0 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </Link>
  );
};

export default FeatureCard;
