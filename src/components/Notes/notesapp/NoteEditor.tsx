import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Star } from 'lucide-react';
import { Note } from '@/lib/types/notes/types';
import { PageNameModal } from './InlineEditorModal';
import { CommandSuggestions } from './CommandSuggestions';

interface NoteEditorProps {
  note: Note;
  isEditing: boolean;
  onUpdateNote: (updates: Partial<Note>) => void;
  onToggleFavorite: (noteId: string) => void;
  onToggleShare: (noteId: string) => void;
  onCreatePage?: (title: string) => void;
  onNavigateToPage?: (pageTitle: string) => void;
  notes?: Note[];
}

export default function NoteEditor({ 
  note, 
  isEditing, 
  onUpdateNote, 
  onToggleFavorite, 
  onToggleShare,
  onCreatePage,
  onNavigateToPage,
  notes = []
}: NoteEditorProps) {
  const editorRef = useRef<any>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [commandPosition, setCommandPosition] = useState({ x: 0, y: 0 });
  const [showPageNameModal, setShowPageNameModal] = useState(false);

  const handlePageCreation = (title: string) => {
    if (onCreatePage) {
      onCreatePage(title);
    }
    insertPageLink(title);
    setShowPageNameModal(false);
  };

  const insertPageLink = (title: string) => {
    const editor = editorRef.current;
    if (editor) {
      const linkHtml = `<a href="#" class="page-link" data-page-title="${title}" style="color: #2563eb; text-decoration: underline; cursor: pointer;">${title}</a>`;
      editor.insertContent(linkHtml);
    }
  };

  // Handle click on page links
  const handlePageLinkClick = (event: Event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('page-link')) {
      event.preventDefault();
      const pageTitle = target.getAttribute('data-page-title');
      if (pageTitle && onNavigateToPage) {
        onNavigateToPage(pageTitle);
      }
    }
  };

  const insertHeading = (level: number) => {
    const editor = editorRef.current;
    if (editor) {
      editor.insertContent(`<h${level}>Heading ${level}</h${level}>`);
      setShowCommands(false);
    }
  };

  const insertTodoList = () => {
    const editor = editorRef.current;
    if (editor) {
      editor.insertContent('<ul class="todo-list"><li><input type="checkbox" disabled> Todo item</li></ul>');
      setShowCommands(false);
    }
  };

  const insertBulletList = () => {
    const editor = editorRef.current;
    if (editor) {
      editor.insertContent('<ul><li>Bullet point</li></ul>');
      setShowCommands(false);
    }
  };

  const insertNumberedList = () => {
    const editor = editorRef.current;
    if (editor) {
      editor.insertContent('<ol><li>Numbered item</li></ol>');
      setShowCommands(false);
    }
  };

  const insertTable = () => {
    const editor = editorRef.current;
    if (editor) {
      editor.insertContent('<table><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td>Cell 3</td><td>Cell 4</td></tr></table>');
      setShowCommands(false);
    }
  };

  const insertQuote = () => {
    const editor = editorRef.current;
    if (editor) {
      editor.insertContent('<blockquote>Quote text</blockquote>');
      setShowCommands(false);
    }
  };

  const insertDivider = () => {
    const editor = editorRef.current;
    if (editor) {
      editor.insertContent('<hr>');
      setShowCommands(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    const editor = editorRef.current;
    if (editor) {
      editor.insertContent(emoji);
      setShowCommands(false);
    }
  };

  const insertImage = (file: File) => {
    const editor = editorRef.current;
    if (editor) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string;
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create a responsive image with proper styling
        const imageHtml = `
          <figure class="image-figure" style="margin: 1rem 0; text-align: center;">
            <img 
              id="${imageId}" 
              src="${imageSrc}" 
              alt="Uploaded image" 
              style="
                max-width: 100%; 
                height: auto; 
                border-radius: 8px; 
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                cursor: pointer;
              "
              onclick="this.style.transform = this.style.transform ? '' : 'scale(1.2)'; this.style.transition = 'transform 0.3s ease';"
            />
            <figcaption style="
              font-size: 0.875rem; 
              color: #6b7280; 
              margin-top: 0.5rem; 
              font-style: italic;
            ">
              Click image to zoom
            </figcaption>
          </figure>
          <p></p>
        `;
        
        editor.insertContent(imageHtml);
      };
      reader.readAsDataURL(file);
      setShowCommands(false);
    }
  };

  const handleEditorChange = (content: string) => {
    onUpdateNote({ content });
  };

  const handleEditorKeyDown = (e: any) => {
    if (e.key === '/') {
      setTimeout(() => {
        const editor = editorRef.current;
        if (editor) {
          const rect = editor.getContainer().getBoundingClientRect();
          setCommandPosition({
            x: rect.left + 20,
            y: rect.top + 100
          });
          setShowCommands(true);
        }
      }, 100);
    }
  };

  const handleCommandSelect = (commandId: string) => {
    // Remove the '/' character before inserting command content
    const editor = editorRef.current;
    if (editor) {
      // Get current content and remove the last '/' character
      const currentContent = editor.getContent();
      const updatedContent = currentContent.replace(/\/$/, '');
      editor.setContent(updatedContent);
      
      // Position cursor at the end
      editor.selection.select(editor.getBody(), true);
      editor.selection.collapse(false);
    }

    switch (commandId) {
      case 'page':
        setShowPageNameModal(true);
        break;
      case 'heading1':
        insertHeading(1);
        break;
      case 'heading2':
        insertHeading(2);
        break;
      case 'heading3':
        insertHeading(3);
        break;
      case 'todo':
        insertTodoList();
        break;
      case 'bullet':
        insertBulletList();
        break;
      case 'numbered':
        insertNumberedList();
        break;
      case 'table':
        insertTable();
        break;
      case 'quote':
        insertQuote();
        break;
      case 'divider':
        insertDivider();
        break;
      default:
        break;
    }
    setShowCommands(false);
  };

  // Check initial content - removed as we're using TinyMCE's built-in placeholder

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 h-full overflow-hidden relative">
      <div className="p-6 pb-20"> {/* Added bottom padding for fixed footer */}
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdateNote({ title: e.target.value })}
          className="w-full text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent bg-transparent border-none outline-none placeholder-gray-400 mb-4"
          placeholder="✨ Untitled Note"
        />
        
        <div className="relative">
          <Editor
            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
            onInit={(evt, editor) => {
              editorRef.current = editor;
            }}
            value={note.content}
            onEditorChange={handleEditorChange}
            onKeyDown={handleEditorKeyDown}
            init={{
              height: 600,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | link image | help',
              placeholder: "Write '/' for commands",
              content_style: `
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
                  font-size: 14px; 
                  line-height: 1.6;
                  color: #374151;
                  padding: 8px;
                  margin: 0;
                }
                .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before {
                  color: #9CA3AF;
                  font-style: normal;
                  font-weight: normal;
                  position: relative;
                }
                .todo-list { list-style: none; padding-left: 0; }
                .todo-list li { margin: 0.5rem 0; }
                .todo-list input[type="checkbox"] { margin-right: 0.5rem; }
                .page-link { 
                  color: #2563eb; 
                  text-decoration: underline; 
                  cursor: pointer;
                }
                .page-link:hover { 
                  background-color: #dbeafe; 
                  padding: 2px 4px; 
                  border-radius: 4px; 
                }
                .image-figure {
                  margin: 1rem 0;
                  text-align: center;
                }
                .image-figure img {
                  transition: transform 0.3s ease, box-shadow 0.3s ease;
                  border-radius: 8px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .image-figure img:hover {
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                .image-figure figcaption {
                  font-size: 0.875rem;
                  color: #6b7280;
                  margin-top: 0.5rem;
                  font-style: italic;
                }
                blockquote {
                  border-left: 4px solid #e5e7eb;
                  margin: 1rem 0;
                  padding: 0.5rem 1rem;
                  background-color: #f9fafb;
                  font-style: italic;
                  color: #4b5563;
                }
                table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 1rem 0;
                  border: 1px solid #e5e7eb;
                  border-radius: 6px;
                  overflow: hidden;
                }
                table td, table th {
                  border: 1px solid #e5e7eb;
                  padding: 0.5rem;
                  text-align: left;
                }
                table th {
                  background-color: #f3f4f6;
                  font-weight: 600;
                }
                hr {
                  border: none;
                  border-top: 2px solid #e5e7eb;
                  margin: 2rem 0;
                }
              `,
              skin: 'oxide',
              content_css: 'default',
              branding: false,
              elementpath: false,
              statusbar: false,
              setup: (editor: any) => {
                editor.on('keydown', handleEditorKeyDown);
                editor.on('click', handlePageLinkClick);
              }
            }}
          />
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isEditing ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`}></div>
            {isEditing ? 'Saving changes...' : `Saved ${note.updatedAt.toLocaleString()}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleShare(note.id)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                note.isShared 
                  ? 'text-green-500 bg-green-50 shadow-lg scale-110' 
                  : 'text-gray-400 hover:text-green-500 hover:bg-green-50 hover:scale-110'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16,6 12,2 8,6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </button>
            <button
              onClick={() => onToggleFavorite(note.id)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                note.isFavorite 
                  ? 'text-yellow-500 bg-yellow-50 shadow-lg scale-110' 
                  : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 hover:scale-110'
              }`}
            >
              <Star size={16} fill={note.isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      {/* Command Suggestions */}
      {showCommands && (
        <CommandSuggestions
          position={commandPosition}
          onSelect={handleCommandSelect}
          onEmojiSelect={insertEmoji}
          onImageSelect={insertImage}
          onClose={() => setShowCommands(false)}
          editorRef={editorRef}
        />
      )}

      {/* Page Name Modal */}
      <PageNameModal
        show={showPageNameModal}
        onConfirm={handlePageCreation}
        onCancel={() => setShowPageNameModal(false)}
      />
    </div>
  );
}































































// Former code 7/11/2025
// import React, { useRef, useState, useEffect } from 'react';
// import { Editor } from '@tinymce/tinymce-react';
// import { Star } from 'lucide-react';
// import { Note } from '@/lib/types/notes/types';
// import { PageNameModal } from './InlineEditorModal';

// interface NoteEditorProps {
//   note: Note;
//   isEditing: boolean;
//   onUpdateNote: (updates: Partial<Note>) => void;
//   onToggleFavorite: (noteId: string) => void;
//   onToggleShare: (noteId: string) => void;
//   onCreatePage?: (title: string) => void;
//   onNavigateToPage?: (pageTitle: string) => void;
//   notes?: Note[];
// }

// interface CommandSuggestion {
//   id: string;
//   label: string;
//   description: string;
//   icon: string;
//   action: () => void;
// }

// export default function NoteEditor({ 
//   note, 
//   isEditing, 
//   onUpdateNote, 
//   onToggleFavorite, 
//   onToggleShare,
//   onCreatePage,
//   onNavigateToPage,
//   notes = []
// }: NoteEditorProps) {
//   const editorRef = useRef<any>(null);
//   const [showCommands, setShowCommands] = useState(false);
//   const [commandPosition, setCommandPosition] = useState({ x: 0, y: 0 });
//   const [filteredCommands, setFilteredCommands] = useState<CommandSuggestion[]>([]);
//   const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
//   const [showPageNameModal, setShowPageNameModal] = useState(false);

//   const commands: CommandSuggestion[] = [
//     {
//       id: 'page',
//       label: 'Page',
//       description: 'Create a new page',
//       icon: '📄',
//       action: () => {
//         setShowCommands(false);
//         setShowPageNameModal(true);
//       }
//     },
//     {
//       id: 'heading1',
//       label: 'Heading 1',
//       description: 'Large heading',
//       icon: 'H1',
//       action: () => insertHeading(1)
//     },
//     {
//       id: 'heading2',
//       label: 'Heading 2',
//       description: 'Medium heading',
//       icon: 'H2',
//       action: () => insertHeading(2)
//     },
//     {
//       id: 'heading3',
//       label: 'Heading 3',
//       description: 'Small heading',
//       icon: 'H3',
//       action: () => insertHeading(3)
//     },
//     {
//       id: 'todo',
//       label: 'To-do list',
//       description: 'Track tasks with a to-do list',
//       icon: '☐',
//       action: () => insertTodoList()
//     },
//     {
//       id: 'bullet',
//       label: 'Bulleted list',
//       description: 'Create a simple bulleted list',
//       icon: '•',
//       action: () => insertBulletList()
//     },
//     {
//       id: 'numbered',
//       label: 'Numbered list',
//       description: 'Create a list with numbering',
//       icon: '1.',
//       action: () => insertNumberedList()
//     },
//     {
//       id: 'table',
//       label: 'Table',
//       description: 'Add a table',
//       icon: '⊞',
//       action: () => insertTable()
//     },
//     {
//       id: 'quote',
//       label: 'Quote',
//       description: 'Capture a quote',
//       icon: '"',
//       action: () => insertQuote()
//     },
//     {
//       id: 'divider',
//       label: 'Divider',
//       description: 'Visually divide blocks',
//       icon: '---',
//       action: () => insertDivider()
//     }
//   ];

//   const handlePageCreation = (title: string) => {
//     if (onCreatePage) {
//       onCreatePage(title);
//     }
//     insertPageLink(title);
//     setShowPageNameModal(false);
//   };

//   const insertPageLink = (title: string) => {
//     const editor = editorRef.current;
//     if (editor) {
//       const pageId = title.toLowerCase().replace(/\s+/g, '-');
//       const linkHtml = `<a href="#" class="page-link" data-page-title="${title}" style="color: #2563eb; text-decoration: underline; cursor: pointer;">${title}</a>`;
//       editor.insertContent(linkHtml);
//     }
//   };

//   // Handle click on page links
//   const handlePageLinkClick = (event: Event) => {
//     const target = event.target as HTMLElement;
//     if (target.classList.contains('page-link')) {
//       event.preventDefault();
//       const pageTitle = target.getAttribute('data-page-title');
//       if (pageTitle && onNavigateToPage) {
//         onNavigateToPage(pageTitle);
//       }
//     }
//   };

//   const insertHeading = (level: number) => {
//     const editor = editorRef.current;
//     if (editor) {
//       editor.insertContent(`<h${level}>Heading ${level}</h${level}>`);
//       setShowCommands(false);
//     }
//   };

//   const insertTodoList = () => {
//     const editor = editorRef.current;
//     if (editor) {
//       editor.insertContent('<ul class="todo-list"><li><input type="checkbox" disabled> Todo item</li></ul>');
//       setShowCommands(false);
//     }
//   };

//   const insertBulletList = () => {
//     const editor = editorRef.current;
//     if (editor) {
//       editor.insertContent('<ul><li>Bullet point</li></ul>');
//       setShowCommands(false);
//     }
//   };

//   const insertNumberedList = () => {
//     const editor = editorRef.current;
//     if (editor) {
//       editor.insertContent('<ol><li>Numbered item</li></ol>');
//       setShowCommands(false);
//     }
//   };

//   const insertTable = () => {
//     const editor = editorRef.current;
//     if (editor) {
//       editor.insertContent('<table><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td>Cell 3</td><td>Cell 4</td></tr></table>');
//       setShowCommands(false);
//     }
//   };

//   const insertQuote = () => {
//     const editor = editorRef.current;
//     if (editor) {
//       editor.insertContent('<blockquote>Quote text</blockquote>');
//       setShowCommands(false);
//     }
//   };

//   const insertDivider = () => {
//     const editor = editorRef.current;
//     if (editor) {
//       editor.insertContent('<hr>');
//       setShowCommands(false);
//     }
//   };

//   const handleEditorChange = (content: string) => {
//     onUpdateNote({ content });
//   };

//   const handleKeyDown = (e: KeyboardEvent) => {
//     if (showCommands) {
//       if (e.key === 'ArrowDown') {
//         e.preventDefault();
//         setSelectedCommandIndex((prev) => 
//           prev < filteredCommands.length - 1 ? prev + 1 : 0
//         );
//       } else if (e.key === 'ArrowUp') {
//         e.preventDefault();
//         setSelectedCommandIndex((prev) => 
//           prev > 0 ? prev - 1 : filteredCommands.length - 1
//         );
//       } else if (e.key === 'Enter') {
//         e.preventDefault();
//         if (filteredCommands[selectedCommandIndex]) {
//           filteredCommands[selectedCommandIndex].action();
//         }
//       } else if (e.key === 'Escape') {
//         e.preventDefault();
//         setShowCommands(false);
//       }
//     }
//   };

//   useEffect(() => {
//     if (showCommands) {
//       document.addEventListener('keydown', handleKeyDown);
//       return () => document.removeEventListener('keydown', handleKeyDown);
//     }
//   }, [showCommands, filteredCommands, selectedCommandIndex]);

//   const handleEditorKeyDown = (e: any) => {
//     if (e.key === '/') {
//       setTimeout(() => {
//         const editor = editorRef.current;
//         if (editor) {
//           const rect = editor.getContainer().getBoundingClientRect();
//           setCommandPosition({
//             x: rect.left + 20,
//             y: rect.top + 100
//           });
//           setFilteredCommands(commands);
//           setSelectedCommandIndex(0);
//           setShowCommands(true);
//         }
//       }, 100);
//     }
//   };

//   return (
//     <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 h-full overflow-hidden relative">
//       <div className="p-6">
//         <input
//           type="text"
//           value={note.title}
//           onChange={(e) => onUpdateNote({ title: e.target.value })}
//           className="w-full text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent bg-transparent border-none outline-none placeholder-gray-400 mb-4"
//           placeholder="✨ Untitled Note"
//         />
        
//         <div className="relative">
//           <Editor
//             apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
//             onInit={(evt, editor) => {
//               editorRef.current = editor;
//             }}
//             value={note.content}
//             onEditorChange={handleEditorChange}
//             onKeyDown={handleEditorKeyDown}
//             init={{
//               height: 700,
//               menubar: false,
//               plugins: [
//                 'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
//                 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
//                 'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
//               ],
//               toolbar: 'undo redo | blocks | ' +
//                 'bold italic forecolor | alignleft aligncenter ' +
//                 'alignright alignjustify | bullist numlist outdent indent | ' +
//                 'removeformat | link image | help',
//               content_style: `
//                 body { 
//                   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
//                   font-size: 14px; 
//                   line-height: 1.6;
//                   color: #374151;
//                 }
//                 .todo-list { list-style: none; padding-left: 0; }
//                 .todo-list li { margin: 0.5rem 0; }
//                 .todo-list input[type="checkbox"] { margin-right: 0.5rem; }
//                 .page-link { 
//                   color: #2563eb; 
//                   text-decoration: underline; 
//                   cursor: pointer;
//                 }
//                 .page-link:hover { 
//                   background-color: #dbeafe; 
//                   padding: 2px 4px; 
//                   border-radius: 4px; 
//                 }
//               `,
//               skin: 'oxide',
//               content_css: 'default',
//               branding: false,
//               elementpath: false,
//               statusbar: false,
//               setup: (editor: any) => {
//                 editor.on('keydown', handleEditorKeyDown);
//                 editor.on('click', handlePageLinkClick);
//               }
//             }}
//           />
//         </div>

//         <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
//           <div className="text-xs text-gray-500 flex items-center gap-2">
//             <div className={`w-2 h-2 rounded-full ${isEditing ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`}></div>
//             {isEditing ? 'Saving changes...' : `Saved ${note.updatedAt.toLocaleString()}`}
//           </div>
//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => onToggleShare(note.id)}
//               className={`p-2 rounded-xl transition-all duration-200 ${
//                 note.isShared 
//                   ? 'text-green-500 bg-green-50 shadow-lg scale-110' 
//                   : 'text-gray-400 hover:text-green-500 hover:bg-green-50 hover:scale-110'
//               }`}
//             >
//               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
//                 <polyline points="16,6 12,2 8,6"/>
//                 <line x1="12" y1="2" x2="12" y2="15"/>
//               </svg>
//             </button>
//             <button
//               onClick={() => onToggleFavorite(note.id)}
//               className={`p-2 rounded-xl transition-all duration-200 ${
//                 note.isFavorite 
//                   ? 'text-yellow-500 bg-yellow-50 shadow-lg scale-110' 
//                   : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 hover:scale-110'
//               }`}
//             >
//               <Star size={16} fill={note.isFavorite ? 'currentColor' : 'none'} />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Command Palette */}
//       {showCommands && (
//         <div 
//           className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-y-auto"
//           style={{
//             left: commandPosition.x,
//             top: commandPosition.y
//           }}
//         >
//           <div className="p-2">
//             <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
//               BASIC BLOCKS
//             </div>
//             {filteredCommands.map((command, index) => (
//               <div
//                 key={command.id}
//                 className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-md ${
//                   index === selectedCommandIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
//                 }`}
//                 onClick={() => {
//                   command.action();
//                   setShowCommands(false);
//                 }}
//               >
//                 <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-sm">
//                   {command.icon}
//                 </div>
//                 <div className="flex-1">
//                   <div className="font-medium text-sm text-gray-900">{command.label}</div>
//                   <div className="text-xs text-gray-500">{command.description}</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Page Name Modal */}
//       <PageNameModal
//         show={showPageNameModal}
//         onConfirm={handlePageCreation}
//         onCancel={() => setShowPageNameModal(false)}
//       />
//     </div>
//   );
// }










































































// original code
// import React from 'react';
// import { Star } from 'lucide-react';
// import { Note } from '@/lib/types/notes/types';

// interface NoteEditorProps {
//   note: Note;
//   isEditing: boolean;
//   onUpdateNote: (updates: Partial<Note>) => void;
//   onToggleFavorite: (noteId: string) => void;
//   onToggleShare: (noteId: string) => void;
// }

// export default function NoteEditor({ 
//   note, 
//   isEditing, 
//   onUpdateNote, 
//   onToggleFavorite, 
//   onToggleShare 
// }: NoteEditorProps) {
//   return (
//     <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 h-full overflow-hidden">
//       <div className="p-6">
//         <input
//           type="text"
//           value={note.title}
//           onChange={(e) => onUpdateNote({ title: e.target.value })}
//           className="w-full text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent bg-transparent border-none outline-none placeholder-gray-400 mb-4"
//           placeholder="✨ Untitled Note"
//         />
//         <textarea
//           value={note.content}
//           onChange={(e) => onUpdateNote({ content: e.target.value })}
//           className="w-full h-96 text-gray-700 bg-transparent border-none outline-none resize-none placeholder-gray-400 leading-relaxed text-sm"
//           placeholder="Start writing something amazing..."
//         />
//         <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
//           <div className="text-xs text-gray-500 flex items-center gap-2">
//             <div className={`w-2 h-2 rounded-full ${isEditing ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`}></div>
//             {isEditing ? 'Saving changes...' : `Saved ${note.updatedAt.toLocaleString()}`}
//           </div>
//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => onToggleShare(note.id)}
//               className={`p-2 rounded-xl transition-all duration-200 ${
//                 note.isShared 
//                   ? 'text-green-500 bg-green-50 shadow-lg scale-110' 
//                   : 'text-gray-400 hover:text-green-500 hover:bg-green-50 hover:scale-110'
//               }`}
//             >
//               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
//                 <polyline points="16,6 12,2 8,6"/>
//                 <line x1="12" y1="2" x2="12" y2="15"/>
//               </svg>
//             </button>
//             <button
//               onClick={() => onToggleFavorite(note.id)}
//               className={`p-2 rounded-xl transition-all duration-200 ${
//                 note.isFavorite 
//                   ? 'text-yellow-500 bg-yellow-50 shadow-lg scale-110' 
//                   : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 hover:scale-110'
//               }`}
//             >
//               <Star size={16} fill={note.isFavorite ? 'currentColor' : 'none'} />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }