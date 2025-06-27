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
import { useState, useEffect } from "react";

interface SearchFilterBarProps {
  emailFilter: EmailFilter;
  onFilterChange: (filter: EmailFilter) => void;
  emailAccountType: EmailAccountType;
  onAccountTypeChange: (type: EmailAccountType) => void;
}

interface EmailResponse {
  type: string;
  // Add other properties as needed
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  emailFilter,
  onFilterChange,
  emailAccountType,
  onAccountTypeChange
}) => {
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Fetch email data and extract available types
  useEffect(() => {
    const fetchEmailTypes = async () => {
      try {
        const linkedEmailId = localStorage.getItem('linkedEmailId');
        if (!linkedEmailId) return;

        const response = await fetch(
          `https://email-service-latest-agqz.onrender.com/api/v1/emails?offset=1&limit=20&email_id=${linkedEmailId}`
        );
        
        if (response.ok) {
          const data: EmailResponse[] = await response.json();
          // Extract unique types from the response
          const types = [...new Set(data.map(email => email.type))];
          setAvailableTypes(types);
        }
      } catch (error) {
        console.error('Error fetching email types:', error);
      }
    };

    fetchEmailTypes();
  }, []);

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
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
      <div className="sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
          <div className="flex-shrink-0">
            {/* Email Inbox title with dropdown chevron */}
            <div className="flex items-center gap-3 mb-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500"
                    title="Switch email account type"
                  >
                    <ChevronDown className="w-5 h-5 text-white" />
                  </button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
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
                {/* Dynamic types from API response */}
                {availableTypes.map((type) => (
                  <DropdownMenuItem 
                    key={type}
                    onClick={() => onAccountTypeChange(type as EmailAccountType)}
                    className="flex items-center gap-2"
                  >
                    {type === "personal" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Briefcase className="w-4 h-4" />
                    )}
                    <span className="capitalize">{type}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Email Inbox
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto sm:justify-start">
            {/* Search and Filter Section */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={emailFilter.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="pl-10 pr-4 w-48 h-10 bg-white/90 backdrop-blur-sm border-white/20 rounded-xl text-sm"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/90 backdrop-blur-sm h-10 px-3 border-white/20 hover:bg-white">
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
      </div>
    </div>
  );
};

export default SearchFilterBar;



















































// import { Search, Filter, User, Briefcase, ChevronDown } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { EmailFilter, EmailAccountType } from "@/lib/types/email2";

// interface SearchFilterBarProps {
//   emailFilter: EmailFilter;
//   onFilterChange: (filter: EmailFilter) => void;
//   emailAccountType: EmailAccountType;
//   onAccountTypeChange: (type: EmailAccountType) => void;
// }

// const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
//   emailFilter,
//   onFilterChange,
//   emailAccountType,
//   onAccountTypeChange
// }) => {
//   const handleFilterChange = (key: keyof EmailFilter, value: any) => {
//     onFilterChange({ ...emailFilter, [key]: value });
//   };

//   const clearFilters = () => {
//     onFilterChange({ 
//       searchTerm: "", 
//       dateRange: "all", 
//       hasAttachment: null, 
//       isRead: null 
//     });
//   };

//   return (
//     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
//       <div className="flex-shrink-0">
//         <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-2">
//           Email Inbox
//         </h1>
//       </div>
      
//       <div className="flex items-center gap-4 w-full sm:w-auto sm:justify-start">
//         {/* Email Account Type Toggle */}
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button
//               variant="outline"
//               className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50"
//             >
//               {emailAccountType === "personal" ? (
//                 <User className="w-4 h-4" />
//               ) : (
//                 <Briefcase className="w-4 h-4" />
//               )}
//               <span className="capitalize">{emailAccountType}</span>
//               <ChevronDown className="w-4 h-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end" className="w-48">
//             <DropdownMenuItem 
//               onClick={() => onAccountTypeChange("personal")}
//               className="flex items-center gap-2"
//             >
//               <User className="w-4 h-4" />
//               Personal Email
//             </DropdownMenuItem>
//             <DropdownMenuItem 
//               onClick={() => onAccountTypeChange("professional")}
//               className="flex items-center gap-2"
//             >
//               <Briefcase className="w-4 h-4" />
//               Professional Email
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>

//         {/* Search and Filter Section */}
//         <div className="flex items-center gap-2">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//             <Input
//               placeholder="Search..."
//               value={emailFilter.searchTerm}
//               onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
//               className="pl-10 pr-4 w-48 h-10 bg-white/80 backdrop-blur-sm border-gray-200 rounded-xl text-sm"
//             />
//           </div>
          
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/80 backdrop-blur-sm h-10 px-3">
//                 <Filter className="w-4 h-4" />
//                 <span className="hidden sm:inline">Filters</span>
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-48">
//               <DropdownMenuItem 
//                 onClick={() => handleFilterChange('hasAttachment', emailFilter.hasAttachment === true ? null : true)}
//               >
//                 {emailFilter.hasAttachment === true ? "✓ " : ""}With Attachments
//               </DropdownMenuItem>
//               <DropdownMenuItem 
//                 onClick={() => handleFilterChange('isRead', emailFilter.isRead === false ? null : false)}
//               >
//                 {emailFilter.isRead === false ? "✓ " : ""}Unread Only
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={clearFilters}>
//                 Clear Filters
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SearchFilterBar;