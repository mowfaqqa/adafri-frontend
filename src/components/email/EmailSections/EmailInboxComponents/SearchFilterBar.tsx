import { Search, Filter, User, Briefcase, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmailFilter, EmailAccountType } from "@/lib/types/email2";

interface SearchFilterBarProps {
  emailFilter: EmailFilter;
  onFilterChange: (filter: EmailFilter) => void;
  emailAccountType: EmailAccountType;
  onAccountTypeChange: (type: EmailAccountType) => void;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  emailFilter,
  onFilterChange,
  emailAccountType,
  onAccountTypeChange
}) => {
  const handleFilterChange = (key: keyof EmailFilter, value: any) => {
    onFilterChange({ ...emailFilter, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({ 
      searchTerm: "", 
      dateRange: "all", 
      hasAttachment: null, 
      isRead: null 
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
      <div className="flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-2">
          Email Inbox
        </h1>
      </div>
      
      <div className="flex items-center gap-4 w-full sm:w-auto sm:justify-start">
        {/* Email Account Type Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50"
            >
              {emailAccountType === "personal" ? (
                <User className="w-4 h-4" />
              ) : (
                <Briefcase className="w-4 h-4" />
              )}
              <span className="capitalize">{emailAccountType}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => onAccountTypeChange("personal")}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Personal Email
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAccountTypeChange("professional")}
              className="flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              Professional Email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search and Filter Section */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search..."
              value={emailFilter.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10 pr-4 w-48 h-10 bg-white/80 backdrop-blur-sm border-gray-200 rounded-xl text-sm"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/80 backdrop-blur-sm h-10 px-3">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => handleFilterChange('hasAttachment', emailFilter.hasAttachment === true ? null : true)}
              >
                {emailFilter.hasAttachment === true ? "✓ " : ""}With Attachments
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleFilterChange('isRead', emailFilter.isRead === false ? null : false)}
              >
                {emailFilter.isRead === false ? "✓ " : ""}Unread Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clearFilters}>
                Clear Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;