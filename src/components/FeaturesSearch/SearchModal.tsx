import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search } from 'lucide-react';

// Type definitions based on your data structure
interface Feature {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
}

interface Tab {
  id: string;
  label: string;
  features: Feature[];
}

interface SearchModalProps {
  tabs: Tab[];
}

const SearchModal: React.FC<SearchModalProps> = ({ tabs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Detect if user is on Mac
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

  // Flatten all features from all tabs for searching
  const allFeatures = tabs.flatMap(tab => 
    tab.features.map(feature => ({
      ...feature,
      category: tab.label
    }))
  );

  // Filter features based on search query
  const filteredFeatures = allFeatures.filter(feature =>
    feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feature.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Memoize handleNavigation to create stable reference
  const handleNavigation = useCallback((link: string) => {
    router.push(link);
    setIsOpen(false);
  }, [router]);

  // Open modal function
  const openModal = useCallback(() => {
    setIsOpen(true);
    setSearchQuery('');
    setSelectedIndex(0);
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Open modal with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    if (((isMac && event.metaKey) || (!isMac && event.ctrlKey)) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); // Prevent browser search
      openModal();
      return;
    }

    // Fallback shortcuts: Ctrl+P and Ctrl+/
    if (event.ctrlKey && (event.key === 'p' || event.key === '/')) {
      event.preventDefault();
      openModal();
      return;
    }

    // Close modal with Escape
    if (event.key === 'Escape' && isOpen) {
      setIsOpen(false);
      return;
    }

    // Navigate through results with arrow keys (only when modal is open)
    if (isOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredFeatures.length - 1 ? prev + 1 : 0
        );
      }
      
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredFeatures.length - 1
        );
      }

      // Navigate to selected item with Enter
      if (event.key === 'Enter' && filteredFeatures[selectedIndex]) {
        event.preventDefault();
        handleNavigation(filteredFeatures[selectedIndex].link);
      }
    }
  }, [isOpen, filteredFeatures, selectedIndex, handleNavigation, openModal, isMac]);

  // Add event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleFeatureClick = (feature: any) => {
    handleNavigation(feature.link);
  };

  if (!isOpen) {
    // Show helper text when modal is closed
    return (
      <div className="fixed bottom-4 right-4 z-40 text-sm text-slate-500 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-lg">
        Press <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-700 font-mono text-xs">
          {isMac ? '⌘' : 'Ctrl'} + K
        </kbd> to search
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-slate-900/60 backdrop-blur-md">
      <div className="w-full max-w-2xl mx-4 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200/50">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/80 to-white/80 rounded-t-2xl">
          <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100/50">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <input
            type="text"
            placeholder="What are you searching for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-slate-800 placeholder-slate-500 border-none outline-none text-lg font-medium"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
          >
            <span className="text-sm px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-medium transition-colors">
              Esc
            </span>
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto bg-gradient-to-b from-white/60 to-slate-50/80">
          {filteredFeatures.length > 0 ? (
            <div className="p-3">
              {filteredFeatures.map((feature, index) => (
                <div
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature)}
                  className={`group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 mb-2 ${
                    index === selectedIndex
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 shadow-md shadow-blue-100/50 scale-[1.02]'
                      : 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-white hover:shadow-lg hover:shadow-slate-200/50 hover:border hover:border-slate-200/60 hover:scale-[1.01]'
                  }`}
                >
                  <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200 ${
                    index === selectedIndex 
                      ? 'bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/50 shadow-md' 
                      : 'bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50 group-hover:from-slate-50 group-hover:to-white group-hover:shadow-md'
                  }`}>
                    <img
                      src={feature.imageUrl}
                      alt={feature.title}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        // Fallback to first letter if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-slate-600 text-lg font-bold">${feature.title.charAt(0)}</span>`;
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold truncate transition-colors duration-200 ${
                        index === selectedIndex ? 'text-blue-900' : 'text-slate-800 group-hover:text-slate-900'
                      }`}>
                        {feature.title}
                      </span>
                      {!feature.isActive && (
                        <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full border border-amber-200/50 font-medium">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className={`text-sm font-medium transition-colors duration-200 ${
                        index === selectedIndex ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-600'
                      }`}>
                        in {feature.category}
                      </span>
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <div className="text-blue-600 text-lg font-bold animate-pulse">
                      ↵
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center border border-slate-200/50 shadow-sm">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-slate-700 text-xl font-semibold mb-3">No results found</h3>
              <p className="text-slate-500 text-base max-w-sm mx-auto leading-relaxed">
                Try searching for a different feature or tool name
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center px-6 py-4 border-t border-slate-100/80 bg-gradient-to-r from-slate-50/40 to-white/60 rounded-b-2xl">
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <kbd className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium shadow-sm">↑</kbd>
              <kbd className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium shadow-sm">↓</kbd>
              <span className="font-medium">navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium shadow-sm">↵</kbd>
              <span className="font-medium">select</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium shadow-sm">
                {isMac ? '⌘' : 'Ctrl'} + K
              </kbd>
              <span className="font-medium">search</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium shadow-sm">esc</kbd>
              <span className="font-medium">close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;








































// 30/6/2025
// import React, { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { X, Search } from 'lucide-react';

// // Type definitions based on your data structure
// interface Feature {
//   id: string;
//   title: string;
//   subtitle: string;
//   imageUrl: string;
//   link: string;
//   isActive: boolean;
// }

// interface Tab {
//   id: string;
//   label: string;
//   features: Feature[];
// }

// interface SearchModalProps {
//   tabs: Tab[];
// }

// const SearchModal: React.FC<SearchModalProps> = ({ tabs }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedIndex, setSelectedIndex] = useState(0);
//   const router = useRouter();

//   // Flatten all features from all tabs for searching
//   const allFeatures = tabs.flatMap(tab => 
//     tab.features.map(feature => ({
//       ...feature,
//       category: tab.label
//     }))
//   );

//   // Filter features based on search query
//   const filteredFeatures = allFeatures.filter(feature =>
//     feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     feature.category.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   // Handle keyboard shortcuts
//   const handleKeyDown = useCallback((event: KeyboardEvent) => {
//     // Open modal with Shift+K
//     if (event.shiftKey && event.key === 'K') {
//       event.preventDefault();
//       setIsOpen(true);
//       setSearchQuery('');
//       setSelectedIndex(0);
//     }

//     // Close modal with Escape
//     if (event.key === 'Escape' && isOpen) {
//       setIsOpen(false);
//     }

//     // Navigate through results with arrow keys
//     if (isOpen) {
//       if (event.key === 'ArrowDown') {
//         event.preventDefault();
//         setSelectedIndex(prev => 
//           prev < filteredFeatures.length - 1 ? prev + 1 : 0
//         );
//       }
      
//       if (event.key === 'ArrowUp') {
//         event.preventDefault();
//         setSelectedIndex(prev => 
//           prev > 0 ? prev - 1 : filteredFeatures.length - 1
//         );
//       }

//       // Navigate to selected item with Enter
//       if (event.key === 'Enter' && filteredFeatures[selectedIndex]) {
//         event.preventDefault();
//         handleNavigation(filteredFeatures[selectedIndex].link);
//       }
//     }
//   }, [isOpen, filteredFeatures, selectedIndex]);

//   // Add event listeners
//   useEffect(() => {
//     document.addEventListener('keydown', handleKeyDown);
//     return () => document.removeEventListener('keydown', handleKeyDown);
//   }, [handleKeyDown]);

//   // Reset selected index when search query changes
//   useEffect(() => {
//     setSelectedIndex(0);
//   }, [searchQuery]);

//   const handleNavigation = (link: string) => {
//     router.push(link);
//     setIsOpen(false);
//   };

//   const handleFeatureClick = (feature: any) => {
//     handleNavigation(feature.link);
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-slate-900/60 backdrop-blur-md">
//       <div className="w-full max-w-2xl mx-4 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200/50">
//         {/* Header */}
//         <div className="flex items-center gap-4 p-6 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/80 to-white/80 rounded-t-2xl">
//           <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100/50">
//             <Search className="w-5 h-5 text-blue-600" />
//           </div>
//           <input
//             type="text"
//             placeholder="What are you searching for?"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="flex-1 bg-transparent text-slate-800 placeholder-slate-500 border-none outline-none text-lg font-medium"
//             autoFocus
//           />
//           <button
//             onClick={() => setIsOpen(false)}
//             className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
//           >
//             <span className="text-sm px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-medium transition-colors">
//               Esc
//             </span>
//           </button>
//         </div>

//         {/* Results */}
//         <div className="max-h-96 overflow-y-auto bg-gradient-to-b from-white/60 to-slate-50/80">
//           {filteredFeatures.length > 0 ? (
//             <div className="p-3">
//               {filteredFeatures.map((feature, index) => (
//                 <div
//                   key={feature.id}
//                   onClick={() => handleFeatureClick(feature)}
//                   className={`group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 mb-2 ${
//                     index === selectedIndex
//                       ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 shadow-md shadow-blue-100/50 scale-[1.02]'
//                       : 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-white hover:shadow-lg hover:shadow-slate-200/50 hover:border hover:border-slate-200/60 hover:scale-[1.01]'
//                   }`}
//                 >
//                   <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200 ${
//                     index === selectedIndex 
//                       ? 'bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/50 shadow-md' 
//                       : 'bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50 group-hover:from-slate-50 group-hover:to-white group-hover:shadow-md'
//                   }`}>
//                     <img
//                       src={feature.imageUrl}
//                       alt={feature.title}
//                       className="w-7 h-7 object-contain"
//                       onError={(e) => {
//                         // Fallback to first letter if image fails to load
//                         const target = e.target as HTMLImageElement;
//                         target.style.display = 'none';
//                         const parent = target.parentElement;
//                         if (parent) {
//                           parent.innerHTML = `<span class="text-slate-600 text-lg font-bold">${feature.title.charAt(0)}</span>`;
//                         }
//                       }}
//                     />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-3">
//                       <span className={`font-semibold truncate transition-colors duration-200 ${
//                         index === selectedIndex ? 'text-blue-900' : 'text-slate-800 group-hover:text-slate-900'
//                       }`}>
//                         {feature.title}
//                       </span>
//                       {!feature.isActive && (
//                         <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full border border-amber-200/50 font-medium">
//                           Coming Soon
//                         </span>
//                       )}
//                     </div>
//                     <div className="mt-1">
//                       <span className={`text-sm font-medium transition-colors duration-200 ${
//                         index === selectedIndex ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-600'
//                       }`}>
//                         in {feature.category}
//                       </span>
//                     </div>
//                   </div>
//                   {index === selectedIndex && (
//                     <div className="text-blue-600 text-lg font-bold animate-pulse">
//                       ↵
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="p-12 text-center">
//               <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center border border-slate-200/50 shadow-sm">
//                 <Search className="w-10 h-10 text-slate-400" />
//               </div>
//               <h3 className="text-slate-700 text-xl font-semibold mb-3">No results found</h3>
//               <p className="text-slate-500 text-base max-w-sm mx-auto leading-relaxed">
//                 Try searching for a different feature or tool name
//               </p>
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="flex items-center justify-center px-6 py-4 border-t border-slate-100/80 bg-gradient-to-r from-slate-50/40 to-white/60 rounded-b-2xl">
//           <div className="flex items-center gap-6 text-sm text-slate-600">
//             <div className="flex items-center gap-2">
//               <kbd className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium shadow-sm">↑</kbd>
//               <kbd className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium shadow-sm">↓</kbd>
//               <span className="font-medium">navigate</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <kbd className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium shadow-sm">↵</kbd>
//               <span className="font-medium">select</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <kbd className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium shadow-sm">esc</kbd>
//               <span className="font-medium">close</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SearchModal;