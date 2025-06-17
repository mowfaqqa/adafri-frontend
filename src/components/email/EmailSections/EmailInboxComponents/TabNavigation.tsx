import { Button } from "@/components/ui/button";
import { TabType, TabConfig } from "@/lib/types/email2";

interface TabNavigationProps {
  tabs: TabConfig[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50 overflow-x-auto">
      <div className="flex items-center justify-between gap-4 min-w-max sm:min-w-0">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={`relative px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/50"
                }`}
                onClick={() => onTabChange(tab.id as TabType)}
              >
                <div className="flex items-center gap-2">
                  <IconComponent className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                  <span className="text-sm sm:text-base">{tab.label}</span>
                </div>
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;