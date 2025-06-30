import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Column } from "@/lib/types/taskManager/types";
import React, { useState, useRef, useEffect } from "react";

interface ColumnData {
  id?: string;
  title: string;
  name: string;
  icon?: {
    name: string;
    icon: React.ComponentType<any>;
  };
  gradient?: string;
  color?: string;
}

interface AddColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddColumn: (column: ColumnData) => void;
  existingColumns: Column[];
}

const AddColumnDialog: React.FC<AddColumnDialogProps> = ({ 
  open, 
  onOpenChange, 
  onAddColumn, 
  existingColumns 
}) => {
  const [columnName, setColumnName] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when creating mode is activated
  useEffect(() => {
    if (isCreatingList && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingList]);

  const handleAddColumn = () => {
    if (!columnName.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    // Check for existing columns by name or title
    const existingColumnNames = existingColumns.map(col => 
      (col.name || col.title || "").toLowerCase()
    );
    
    if (existingColumnNames.includes(columnName.toLowerCase())) {
      toast.error("A list with a similar name already exists.");
      return;
    }

    const columnData: ColumnData = {
      id: columnName.toLowerCase().replace(/\s+/g, '-'),
      title: columnName,
      name: columnName,
      gradient: "bg-gray-400", // Default color
      color: "bg-gray-400"
    };

    onAddColumn(columnData);

    // Reset form
    setColumnName("");
    setIsCreatingList(false);
    toast.success(`Created new "${columnName}" list`);
  };

  const handleCancel = () => {
    setColumnName("");
    setIsCreatingList(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddColumn();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isCreatingList) {
    // Creating mode - Trello input form
    return (
      <div className="w-72 flex-shrink-0">
        <div 
          className="rounded-md p-3"
          style={{ backgroundColor: '#ebecf0' }} // Same as column background
        >
          <Input
            ref={inputRef}
            placeholder="Enter list name..."
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="mb-2 rounded-sm border-2 border-blue-500 focus:border-blue-500 focus:ring-0 bg-white text-sm font-normal h-8 px-3"
            style={{ 
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              outline: 'none',
              boxShadow: 'none'
            }}
          />
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAddColumn}
              disabled={!columnName.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium text-sm px-3 py-1 h-8 rounded-sm"
            >
              Add list
            </Button>
            <Button
              onClick={handleCancel}
              variant="ghost"
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-200 p-1 h-8 w-8 rounded-sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default mode - "Add another list" button
  return (
    <div className="w-72 flex-shrink-0">
      <Button
        onClick={() => setIsCreatingList(true)}
        variant="ghost"
        className="w-full justify-start rounded-md p-3 h-auto transition-all hover:shadow-sm text-gray-700 hover:text-gray-900"
        style={{ 
          backgroundColor: 'hsla(218, 38.20%, 48.20%, 0.16)',
          minHeight: '44px' // Match Trello button height
        }}
      >
        <Plus className="w-4 h-4 mr-2" />
        <span className="text-sm font-medium">Add another list</span>
      </Button>
    </div>
  );
};

export default AddColumnDialog;

















































































// Daniel UI Designs 16th June 2025
// import { useState } from "react";
// import { 
//   Plus, 
//   Mail, 
//   Inbox, 
//   Send, 
//   Archive, 
//   Star, 
//   AlertCircle, 
//   CheckCircle, 
//   Clock, 
//   Flag, 
//   Heart, 
//   Bookmark, 
//   Folder, 
//   FileText, 
//   User, 
//   Users, 
//   Building, 
//   Briefcase, 
//   Calendar, 
//   Bell,
//   Shield,
//   Zap,
//   Target,
//   Award,
//   Lightbulb,
//   Gift,
//   Home,
//   Coffee,
//   Palette
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { toast } from "sonner";
// import { Column } from "@/lib/types/taskManager/types";

// interface IconOption {
//   icon: React.ComponentType<any>;
//   name: string;
// }

// interface ColumnData {
//   id?: string;
//   title: string;
//   name: string;
//   icon: IconOption;
//   gradient: string;
//   color?: string;
// }

// interface AddColumnDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onAddColumn: (column: ColumnData) => void;
//   existingColumns: Column[];
// }

// const AVAILABLE_ICONS: IconOption[] = [
//   { icon: Mail, name: "Mail" },
//   { icon: Inbox, name: "Inbox" },
//   { icon: Send, name: "Send" },
//   { icon: Archive, name: "Archive" },
//   { icon: Star, name: "Star" },
//   { icon: AlertCircle, name: "Alert" },
//   { icon: CheckCircle, name: "Check" },
//   { icon: Clock, name: "Clock" },
//   { icon: Flag, name: "Flag" },
//   { icon: Heart, name: "Heart" },
//   { icon: Bookmark, name: "Bookmark" },
//   { icon: Folder, name: "Folder" },
//   { icon: FileText, name: "File" },
//   { icon: User, name: "User" },
//   { icon: Users, name: "Users" },
//   { icon: Building, name: "Building" },
//   { icon: Briefcase, name: "Briefcase" },
//   { icon: Calendar, name: "Calendar" },
//   { icon: Bell, name: "Bell" },
//   { icon: Shield, name: "Shield" },
//   { icon: Zap, name: "Zap" },
//   { icon: Target, name: "Target" },
//   { icon: Award, name: "Award" },
//   { icon: Lightbulb, name: "Lightbulb" },
//   { icon: Gift, name: "Gift" },
//   { icon: Home, name: "Home" },
//   { icon: Coffee, name: "Coffee" },
//   { icon: Palette, name: "Palette" }
// ];

// const GRADIENT_OPTIONS = [
//   { name: "Blue", gradient: "from-blue-500 to-cyan-500", preview: "bg-blue-500" },
//   { name: "Red", gradient: "from-red-500 to-orange-500", preview: "bg-red-500" },
//   { name: "Purple", gradient: "from-purple-500 to-pink-500", preview: "bg-purple-500" },
//   { name: "Green", gradient: "from-green-500 to-teal-500", preview: "bg-green-500" },
//   { name: "Indigo", gradient: "from-indigo-500 to-purple-500", preview: "bg-indigo-500" },
//   { name: "Yellow", gradient: "from-yellow-500 to-orange-500", preview: "bg-yellow-500" },
//   { name: "Pink", gradient: "from-pink-500 to-rose-500", preview: "bg-pink-500" },
//   { name: "Teal", gradient: "from-emerald-500 to-cyan-500", preview: "bg-teal-500" },
//   { name: "Violet", gradient: "from-violet-500 to-fuchsia-500", preview: "bg-violet-500" },
//   { name: "Gray", gradient: "from-slate-500 to-gray-500", preview: "bg-gray-500" },
//   { name: "Orange", gradient: "from-amber-500 to-orange-500", preview: "bg-orange-500" },
//   { name: "Sky", gradient: "from-sky-500 to-blue-500", preview: "bg-sky-500" }
// ];

// const AddColumnDialog: React.FC<AddColumnDialogProps> = ({ 
//   open, 
//   onOpenChange, 
//   onAddColumn, 
//   existingColumns 
// }) => {
//   const [columnName, setColumnName] = useState("");
//   const [selectedIcon, setSelectedIcon] = useState<IconOption>(AVAILABLE_ICONS[0]);
//   const [selectedGradient, setSelectedGradient] = useState(GRADIENT_OPTIONS[0]);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);

//   const handleAddColumn = () => {
//     if (!columnName.trim()) {
//       toast.error("Please enter a column name");
//       return;
//     }

//     const newColumnId = columnName.toLowerCase().replace(/\s+/g, '-');

//     // Check for existing columns by name or title
//     const existingColumnNames = existingColumns.map(col => 
//       (col.name || col.title || "").toLowerCase()
//     );
    
//     if (existingColumnNames.includes(columnName.toLowerCase())) {
//       toast.error("A column with a similar name already exists.");
//       return;
//     }

//     const columnData: ColumnData = {
//       id: newColumnId,
//       title: columnName,
//       name: columnName,
//       icon: selectedIcon,
//       gradient: selectedGradient.gradient,
//       color: selectedGradient.gradient
//     };

//     onAddColumn(columnData);

//     // Reset form
//     setColumnName("");
//     setSelectedIcon(AVAILABLE_ICONS[0]);
//     setSelectedGradient(GRADIENT_OPTIONS[0]);
//     setIsDialogOpen(false);
//     toast.success(`Created new "${columnName}" column`);
//   };

//   return (
//     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//       <DialogTrigger asChild>
//         <div className="min-w-[240px] sm:min-w-[260px] w-[240px] sm:w-[280px] flex-shrink-0 group cursor-pointer">
//           <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/60 backdrop-blur-sm rounded-2xl p-5 border-2 border-dashed border-gray-300/60 hover:border-gray-400/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-hover:from-blue-50/80 group-hover:to-purple-50/60">
//             <div className="flex flex-col items-center justify-center space-y-3 py-6">
//               <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 group-hover:from-blue-500 group-hover:to-purple-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
//                 <Plus className="w-6 h-6 text-white" />
//               </div>
//               <div className="text-center">
//                 <h3 className="font-semibold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
//                   Create New Status
//                 </h3>
//                 <p className="text-sm text-gray-500 mt-1">
//                   Add a custom workflow stage
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </DialogTrigger>
      
//       <DialogContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm max-w-md">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
//             Create New Status
//           </DialogTitle>
//         </DialogHeader>
        
//         <div className="space-y-6 mt-4">
//           {/* Two-column layout: Icons/Colors on left, Name/Preview on right */}
//           <div className="flex gap-6">
//             <div className="flex-1 space-y-4">
//               {/* Icon Selection */}
//               <div className="space-y-3">
//                 <label className="text-sm font-semibold text-gray-700">Icon</label>
//                 <div className="grid grid-cols-7 gap-2">
//                   {AVAILABLE_ICONS.map((iconOption, index) => {
//                     const IconComponent = iconOption.icon;
//                     const isSelected = selectedIcon.name === iconOption.name;
                    
//                     return (
//                       <button
//                         key={index}
//                         onClick={() => setSelectedIcon(iconOption)}
//                         className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
//                           isSelected
//                             ? `bg-gradient-to-r ${selectedGradient.gradient} text-white shadow-md scale-110`
//                             : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
//                         }`}
//                         title={iconOption.name}
//                       >
//                         <IconComponent className="w-4 h-4" />
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Color Selection */}
//               <div className="space-y-3">
//                 <label className="text-sm font-semibold text-gray-700">Color</label>
//                 <div className="grid grid-cols-6 gap-2">
//                   {GRADIENT_OPTIONS.map((gradientOption, index) => {
//                     const isSelected = selectedGradient.gradient === gradientOption.gradient;
                    
//                     return (
//                       <button
//                         key={index}
//                         onClick={() => setSelectedGradient(gradientOption)}
//                         className={`w-8 h-8 rounded-full transition-all duration-200 ${gradientOption.preview} ${
//                           isSelected
//                             ? "ring-2 ring-blue-500 ring-offset-2 scale-110"
//                             : "hover:scale-105"
//                         }`}
//                         title={gradientOption.name}
//                       />
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Right side: Column Name and Preview */}
//             <div className="flex-1 space-y-4">
//               {/* Column Name Input */}
//               <div className="space-y-3">
//                 <label className="text-sm font-semibold text-gray-700">Name</label>
//                 <Input
//                   placeholder="Column name..."
//                   value={columnName}
//                   onChange={(e) => setColumnName(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter') {
//                       handleAddColumn();
//                     }
//                   }}
//                   className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white h-10"
//                 />
//               </div>

//               {/* Preview */}
//               <div className="space-y-3">
//                 <label className="text-sm font-semibold text-gray-700">Preview</label>
//                 <div className="p-3 bg-gray-50/50 rounded-lg border">
//                   <div className="flex items-center gap-2">
//                     <div className={`w-6 h-6 bg-gradient-to-r ${selectedGradient.gradient} rounded-lg flex items-center justify-center`}>
//                       <selectedIcon.icon className="w-4 h-4 text-white" />
//                     </div>
//                     <span className="text-sm font-semibold text-gray-800">{columnName || "Column Name"}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Create Button */}
//           <Button
//             onClick={handleAddColumn}
//             disabled={!columnName.trim()}
//             className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
//           >
//             <div className="flex items-center gap-2">
//               <Plus className="w-4 h-4" />
//               Create Status
//             </div>
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default AddColumnDialog;











































// import { useState } from "react";
// import { 
//   Plus, 
//   Mail, 
//   Inbox, 
//   Send, 
//   Archive, 
//   Star, 
//   AlertCircle, 
//   CheckCircle, 
//   Clock, 
//   Flag, 
//   Heart, 
//   Bookmark, 
//   Folder, 
//   FileText, 
//   User, 
//   Users, 
//   Building, 
//   Briefcase, 
//   Calendar, 
//   Bell,
//   Shield,
//   Zap,
//   Target,
//   Award,
//   Lightbulb,
//   Gift,
//   Home,
//   Coffee,
//   Palette
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { toast } from "sonner";
// import { Column } from "@/lib/types/taskManager/types";


// interface IconOption {
//   icon: React.ComponentType<any>;
//   name: string;
// }

// interface ColumnData {
//   id?: string;
//   title: string;
//   name: string;
//   icon: IconOption;
//   gradient: string;
//   color?: string;
// }

// interface AddColumnDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onAddColumn: (column: ColumnData) => void;
//   existingColumns: Column[];
// }

// const AVAILABLE_ICONS: IconOption[] = [
//   { icon: Mail, name: "Mail" },
//   { icon: Inbox, name: "Inbox" },
//   { icon: Send, name: "Send" },
//   { icon: Archive, name: "Archive" },
//   { icon: Star, name: "Star" },
//   { icon: AlertCircle, name: "Alert" },
//   { icon: CheckCircle, name: "Check" },
//   { icon: Clock, name: "Clock" },
//   { icon: Flag, name: "Flag" },
//   { icon: Heart, name: "Heart" },
//   { icon: Bookmark, name: "Bookmark" },
//   { icon: Folder, name: "Folder" },
//   { icon: FileText, name: "File" },
//   { icon: User, name: "User" },
//   { icon: Users, name: "Users" },
//   { icon: Building, name: "Building" },
//   { icon: Briefcase, name: "Briefcase" },
//   { icon: Calendar, name: "Calendar" },
//   { icon: Bell, name: "Bell" },
//   { icon: Shield, name: "Shield" },
//   { icon: Zap, name: "Zap" },
//   { icon: Target, name: "Target" },
//   { icon: Award, name: "Award" },
//   { icon: Lightbulb, name: "Lightbulb" },
//   { icon: Gift, name: "Gift" },
//   { icon: Home, name: "Home" },
//   { icon: Coffee, name: "Coffee" },
//   { icon: Palette, name: "Palette" }
// ];

// const GRADIENT_OPTIONS = [
//   { name: "Blue", gradient: "from-blue-500 to-cyan-500", preview: "bg-blue-500" },
//   { name: "Red", gradient: "from-red-500 to-orange-500", preview: "bg-red-500" },
//   { name: "Purple", gradient: "from-purple-500 to-pink-500", preview: "bg-purple-500" },
//   { name: "Green", gradient: "from-green-500 to-teal-500", preview: "bg-green-500" },
//   { name: "Indigo", gradient: "from-indigo-500 to-purple-500", preview: "bg-indigo-500" },
//   { name: "Yellow", gradient: "from-yellow-500 to-orange-500", preview: "bg-yellow-500" },
//   { name: "Pink", gradient: "from-pink-500 to-rose-500", preview: "bg-pink-500" },
//   { name: "Teal", gradient: "from-emerald-500 to-cyan-500", preview: "bg-teal-500" },
//   { name: "Violet", gradient: "from-violet-500 to-fuchsia-500", preview: "bg-violet-500" },
//   { name: "Gray", gradient: "from-slate-500 to-gray-500", preview: "bg-gray-500" },
//   { name: "Orange", gradient: "from-amber-500 to-orange-500", preview: "bg-orange-500" },
//   { name: "Sky", gradient: "from-sky-500 to-blue-500", preview: "bg-sky-500" }
// ];

// const AddColumnDialog: React.FC<AddColumnDialogProps> = ({ 
//   open, 
//   onOpenChange, 
//   onAddColumn, 
//   existingColumns 
// }) => {
//   const [columnName, setColumnName] = useState("");
//   const [selectedIcon, setSelectedIcon] = useState<IconOption>(AVAILABLE_ICONS[0]);
//   const [selectedGradient, setSelectedGradient] = useState(GRADIENT_OPTIONS[0]);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);

//   const handleAddColumn = () => {
//     if (!columnName.trim()) {
//       toast.error("Please enter a column name");
//       return;
//     }

//     const newColumnId = columnName.toLowerCase().replace(/\s+/g, '-');

//     // Check for existing columns by name or title
//     const existingColumnNames = existingColumns.map(col => 
//       (col.name || col.title || "").toLowerCase()
//     );
    
//     if (existingColumnNames.includes(columnName.toLowerCase())) {
//       toast.error("A column with a similar name already exists.");
//       return;
//     }

//     const columnData: ColumnData = {
//       id: newColumnId,
//       title: columnName,
//       name: columnName,
//       icon: selectedIcon,
//       gradient: selectedGradient.gradient,
//       color: selectedGradient.gradient
//     };

//     onAddColumn(columnData);

//     // Reset form
//     setColumnName("");
//     setSelectedIcon(AVAILABLE_ICONS[0]);
//     setSelectedGradient(GRADIENT_OPTIONS[0]);
//     setIsDialogOpen(false);
//     toast.success(`Created new "${columnName}" column`);
//   };

//   return (
//     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//       <DialogTrigger asChild>
//         <div className="min-w-[240px] sm:min-w-[260px] w-[240px] sm:w-[280px] flex-shrink-0 group cursor-pointer">
//           <div className="bg-white backdrop-blur-sm rounded-2xl p-5 border-2 border-dashed border-gray-300/60 hover:border-gray-400/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-hover:from-blue-50/80 group-hover:to-purple-50/60">
//             <div className="flex flex-col items-center justify-center space-y-3 py-6">
//               <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 group-hover:from-blue-500 group-hover:to-purple-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
//                 <Plus className="w-6 h-6 text-white" />
//               </div>
//               <div className="text-center">
//                 <h3 className="font-semibold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
//                   Create New Status
//                 </h3>
//                 <p className="text-sm text-gray-500 mt-1">
//                   Add a custom workflow stage
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </DialogTrigger>
      
//       <DialogContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm max-w-md">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
//             Create New Status
//           </DialogTitle>
//         </DialogHeader>
        
//         <div className="space-y-6 mt-4">
//           {/* Two-column layout: Icons/Colors on left, Name/Preview on right */}
//           <div className="flex gap-6">
//             <div className="flex-1 space-y-4">
//               {/* Icon Selection */}
//               <div className="space-y-3">
//                 <label className="text-sm font-semibold text-gray-700">Icon</label>
//                 <div className="grid grid-cols-7 gap-2">
//                   {AVAILABLE_ICONS.map((iconOption, index) => {
//                     const IconComponent = iconOption.icon;
//                     const isSelected = selectedIcon.name === iconOption.name;
                    
//                     return (
//                       <button
//                         key={index}
//                         onClick={() => setSelectedIcon(iconOption)}
//                         className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
//                           isSelected
//                             ? `bg-gradient-to-r ${selectedGradient.gradient} text-white shadow-md scale-110`
//                             : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
//                         }`}
//                         title={iconOption.name}
//                       >
//                         <IconComponent className="w-4 h-4" />
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Color Selection */}
//               <div className="space-y-3">
//                 <label className="text-sm font-semibold text-gray-700">Color</label>
//                 <div className="grid grid-cols-6 gap-2">
//                   {GRADIENT_OPTIONS.map((gradientOption, index) => {
//                     const isSelected = selectedGradient.gradient === gradientOption.gradient;
                    
//                     return (
//                       <button
//                         key={index}
//                         onClick={() => setSelectedGradient(gradientOption)}
//                         className={`w-8 h-8 rounded-full transition-all duration-200 ${gradientOption.preview} ${
//                           isSelected
//                             ? "ring-2 ring-blue-500 ring-offset-2 scale-110"
//                             : "hover:scale-105"
//                         }`}
//                         title={gradientOption.name}
//                       />
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Right side: Column Name and Preview */}
//             <div className="flex-1 space-y-4">
//               {/* Column Name Input */}
//               <div className="space-y-3">
//                 <label className="text-sm font-semibold text-gray-700">Name</label>
//                 <Input
//                   placeholder="Column name..."
//                   value={columnName}
//                   onChange={(e) => setColumnName(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter') {
//                       handleAddColumn();
//                     }
//                   }}
//                   className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white h-10"
//                 />
//               </div>

//               {/* Preview */}
//               <div className="space-y-3">
//                 <label className="text-sm font-semibold text-gray-700">Preview</label>
//                 <div className="p-3 bg-gray-50/50 rounded-lg border">
//                   <div className="flex items-center gap-2">
//                     <div className={`w-6 h-6 bg-gradient-to-r ${selectedGradient.gradient} rounded-lg flex items-center justify-center`}>
//                       <selectedIcon.icon className="w-4 h-4 text-white" />
//                     </div>
//                     <span className="text-sm font-semibold text-gray-800">{columnName || "Column Name"}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Create Button */}
//           <Button
//             onClick={handleAddColumn}
//             disabled={!columnName.trim()}
//             className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
//           >
//             <div className="flex items-center gap-2">
//               <Plus className="w-4 h-4" />
//               Create Status
//             </div>
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default AddColumnDialog;