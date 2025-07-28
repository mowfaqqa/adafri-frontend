import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Star, Plus } from 'lucide-react';
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
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [commandPosition, setCommandPosition] = useState({ x: 0, y: 0 });
  const [showPageNameModal, setShowPageNameModal] = useState(false);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [showLinePlusIcon, setShowLinePlusIcon] = useState(false);
  const [linePlusPosition, setLinePlusPosition] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [lineHeight, setLineHeight] = useState(24);
  const [targetLine, setTargetLine] = useState<number | null>(null);
  const [commandTrigger, setCommandTrigger] = useState<'slash' | 'plus'>('slash');

  // Calculate line height and positions
  const calculateLineHeight = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return 24;

    const iframe = editor.getContainer().querySelector('iframe');
    if (!iframe || !iframe.contentDocument) return 24;

    const body = iframe.contentDocument.body;
    const computedStyle = iframe.contentWindow?.getComputedStyle(body);
    return parseInt(computedStyle?.lineHeight || '24') || 24;
  }, []);

  // Get line number from Y position
  const getLineNumberFromY = useCallback((y: number, containerRect: DOMRect, scrollTop: number = 0) => {
    const relativeY = y - containerRect.top;
    const adjustedY = relativeY + scrollTop;
    return Math.floor(adjustedY / lineHeight);
  }, [lineHeight]);

  // Insert content at cursor or target line
  const insertContent = useCallback((content: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    if (commandTrigger === 'plus' && targetLine !== null) {
      // For plus icon, insert at beginning of target line
      insertAtTargetLine(content);
    } else {
      // For slash command, insert at cursor position
      editor.insertContent(content);
    }
  }, [commandTrigger, targetLine]);

  // Insert content at specific line (for plus icon)
  const insertAtTargetLine = useCallback((content: string) => {
    const editor = editorRef.current;
    if (!editor || targetLine === null) return;

    const iframe = editor.getContainer().querySelector('iframe');
    if (!iframe || !iframe.contentDocument) return;

    const body = iframe.contentDocument.body;
    const paragraphs = body.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, ul, ol, blockquote');
    
    if (targetLine < paragraphs.length) {
      const targetElement = paragraphs[targetLine];
      // Position cursor at the beginning of the target line
      editor.selection.setCursorLocation(targetElement, 0);
    } else {
      // If target line doesn't exist, create new paragraphs
      const newParagraphs = Array(targetLine - paragraphs.length + 1).fill('<p><br></p>').join('');
      editor.insertContent(newParagraphs);
      // Position at the target line
      setTimeout(() => {
        const updatedParagraphs = body.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, ul, ol, blockquote');
        if (targetLine < updatedParagraphs.length) {
          editor.selection.setCursorLocation(updatedParagraphs[targetLine], 0);
        }
      }, 50);
    }

    // Insert the content
    setTimeout(() => {
      editor.insertContent(content);
    }, 100);
  }, [targetLine]);

  // Handle page creation
  const handlePageCreation = (title: string) => {
    if (onCreatePage) {
      onCreatePage(title);
    }
    insertPageLink(title);
    setShowPageNameModal(false);
  };

  const insertPageLink = (title: string) => {
    const linkHtml = `<a href="#" class="page-link" data-page-title="${title}" style="color: #2563eb; text-decoration: underline; cursor: pointer;">${title}</a>`;
    insertContent(linkHtml);
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
    insertContent(`<h${level}>Heading ${level}</h${level}>`);
    setShowCommands(false);
  };

  const insertTodoList = () => {
    insertContent('<ul class="todo-list"><li><input type="checkbox" disabled> Todo item</li></ul>');
    setShowCommands(false);
  };

  const insertBulletList = () => {
    insertContent('<ul><li>Bullet point</li></ul>');
    setShowCommands(false);
  };

  const insertNumberedList = () => {
    insertContent('<ol><li>Numbered item</li></ol>');
    setShowCommands(false);
  };

  const insertTable = () => {
    insertContent('<table><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td>Cell 3</td><td>Cell 4</td></tr></table>');
    setShowCommands(false);
  };

  const insertQuote = () => {
    insertContent('<blockquote>Quote text</blockquote>');
    setShowCommands(false);
  };

  const insertDivider = () => {
    insertContent('<hr>');
    setShowCommands(false);
  };

  const insertEmoji = (emoji: string) => {
    insertContent(emoji);
    setShowCommands(false);
  };

  const insertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target?.result as string;
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
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
      
      insertContent(imageHtml);
    };
    reader.readAsDataURL(file);
    setShowCommands(false);
  };

  const handleEditorChange = (content: string) => {
    onUpdateNote({ content });
  };

  // Handle slash command trigger
  const handleEditorKeyDown = (e: any) => {
    if (e.key === '/') {
      setCommandTrigger('slash');
      setTargetLine(null);
      setTimeout(() => {
        const editor = editorRef.current;
        if (editor) {
          const container = editor.getContainer();
          const rect = container.getBoundingClientRect();
          setCommandPosition({
            x: rect.left + 40,
            y: rect.top + 100
          });
          setShowCommands(true);
        }
      }, 100);
    }

    // Handle typing detection
    setIsTyping(true);
    setShowLinePlusIcon(false);
    setTimeout(() => setIsTyping(false), 500);
  };

  // Handle command selection
  const handleCommandSelect = (commandId: string) => {
    // Remove the '/' character if it was a slash command
    if (commandTrigger === 'slash') {
      const editor = editorRef.current;
      if (editor) {
        const currentContent = editor.getContent();
        const updatedContent = currentContent.replace(/\/$/, '');
        editor.setContent(updatedContent);
        editor.selection.select(editor.getBody(), true);
        editor.selection.collapse(false);
      }
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
    setTargetLine(null);
  };

  // Handle mouse movement over editor for plus icon
  const handleEditorMouseMove = useCallback((e: MouseEvent) => {
    if (isTyping || showCommands) return;

    const editor = editorRef.current;
    const container = editorContainerRef.current;
    if (!editor || !container) return;

    const iframe = editor.getContainer().querySelector('iframe');
    if (!iframe || !iframe.contentDocument) return;

    const iframeRect = iframe.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Check if mouse is in the left margin area (first 40px of the editor)
    const relativeX = e.clientX - iframeRect.left;
    const relativeY = e.clientY - iframeRect.top;

    if (relativeX >= 0 && relativeX <= 40 && relativeY >= 0) {
      const scrollTop = iframe.contentDocument.documentElement.scrollTop || iframe.contentDocument.body.scrollTop;
      const lineNumber = getLineNumberFromY(e.clientY, iframeRect, scrollTop);
      
      // Get total number of lines in editor
      const body = iframe.contentDocument.body;
      const elements = body.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, ul, ol, blockquote');
      const totalLines = Math.max(elements.length, 5);

      if (lineNumber >= 0 && lineNumber < totalLines) {
        setHoveredLine(lineNumber);
        
        // Calculate position relative to the container
        const lineY = (lineNumber * lineHeight) + 10 - scrollTop;
        
        setLinePlusPosition({
          x: 2,
          y: lineY
        });
        setShowLinePlusIcon(true);
      } else {
        setShowLinePlusIcon(false);
        setHoveredLine(null);
      }
    } else {
      // Add delay to allow moving to plus icon
      setTimeout(() => {
        if (!document.querySelector('.line-plus-icon:hover')) {
          setShowLinePlusIcon(false);
          setHoveredLine(null);
        }
      }, 100);
    }
  }, [isTyping, showCommands, lineHeight, getLineNumberFromY]);

  // Handle plus icon click
  const handlePlusIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hoveredLine === null) return;

    setCommandTrigger('plus');
    setTargetLine(hoveredLine);
    
    // Position cursor at the beginning of the hovered line
    const editor = editorRef.current;
    if (editor) {
      const iframe = editor.getContainer().querySelector('iframe');
      if (iframe && iframe.contentDocument) {
        const body = iframe.contentDocument.body;
        const elements = body.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, ul, ol, blockquote');
        if (hoveredLine < elements.length) {
          editor.selection.setCursorLocation(elements[hoveredLine], 0);
        }
      }
    }

    // Show command suggestions near the plus icon
    const container = editorContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setCommandPosition({
        x: rect.left + 50,
        y: rect.top + linePlusPosition.y
      });
      setShowCommands(true);
      setShowLinePlusIcon(false);
    }
  };

  // Setup editor event listeners
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const iframe = editor.getContainer().querySelector('iframe');
    if (!iframe || !iframe.contentDocument) return;

    const iframeDoc = iframe.contentDocument;
    
    // Add mousemove listener to iframe document
    iframeDoc.addEventListener('mousemove', handleEditorMouseMove);
    
    // Add mouseleave listener to hide plus icon when leaving editor
    const handleMouseLeave = () => {
      setTimeout(() => {
        if (!document.querySelector('.line-plus-icon:hover')) {
          setShowLinePlusIcon(false);
          setHoveredLine(null);
        }
      }, 150);
    };
    
    iframe.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      iframeDoc.removeEventListener('mousemove', handleEditorMouseMove);
      iframe.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleEditorMouseMove]);

  // Update line height when editor content changes
  useEffect(() => {
    const newLineHeight = calculateLineHeight();
    setLineHeight(newLineHeight);
  }, [note.content, calculateLineHeight]);

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 h-full overflow-hidden relative">
      <div className="p-6 pb-20">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdateNote({ title: e.target.value })}
          className="w-full text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent bg-transparent border-none outline-none placeholder-gray-400 mb-4"
          placeholder="✨ Untitled Note"
        />
        
        <div ref={editorContainerRef} className="relative">
          <Editor
            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
            onInit={(evt, editor) => {
              editorRef.current = editor;
              
              // Set initial line height
              setTimeout(() => {
                const newLineHeight = calculateLineHeight();
                setLineHeight(newLineHeight);
              }, 500);
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
              placeholder: "Write '/' for commands or hover at the beginning of any line for the plus menu...",
              content_style: `
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
                  font-size: 14px; 
                  line-height: 1.6;
                  color: #374151;
                  padding: 8px;
                  margin: 0;
                  padding-left: 40px; /* Add left padding for plus icon space */
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

          {/* Line Plus Icon */}
          {showLinePlusIcon && !isTyping && (
            <div
              className="line-plus-icon absolute z-30 w-6 h-6 bg-white border border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200"
              style={{
                left: `${linePlusPosition.x}px`,
                top: `${linePlusPosition.y}px`,
                pointerEvents: 'auto'
              }}
              onClick={handlePlusIconClick}
              onMouseEnter={(e) => {
                e.stopPropagation();
                setShowLinePlusIcon(true);
              }}
            >
              <Plus size={14} className="text-gray-500" />
            </div>
          )}
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





























































































































// 7/25/205 2:18
// import React, { useRef, useState, useEffect, useCallback } from 'react';
// import { Star, Plus } from 'lucide-react';
// import { Note } from '@/lib/types/notes/types';
// import { PageNameModal } from './InlineEditorModal';
// import { CommandSuggestions } from './CommandSuggestions';

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
//   const textareaRef = useRef<HTMLTextAreaElement>(null);
//   const lineNumbersRef = useRef<HTMLDivElement>(null);
//   const [showCommands, setShowCommands] = useState(false);
//   const [commandPosition, setCommandPosition] = useState({ x: 0, y: 0 });
//   const [showPageNameModal, setShowPageNameModal] = useState(false);
//   const [hoveredLine, setHoveredLine] = useState<number | null>(null);
//   const [showLinePlusIcon, setShowLinePlusIcon] = useState(false);
//   const [linePlusPosition, setLinePlusPosition] = useState({ x: 0, y: 0 });
//   const [isTyping, setIsTyping] = useState(false);
//   const [cursorPosition, setCursorPosition] = useState(0);
//   const [lineHeight, setLineHeight] = useState(24);
//   const [targetLine, setTargetLine] = useState<number | null>(null); // Store the line where plus was clicked

//   // Calculate line numbers and handle line hover
//   const calculateLines = useCallback(() => {
//     const textarea = textareaRef.current;
//     if (!textarea) return [];

//     const content = textarea.value;
//     const lines = content.split('\n');
    
//     // Update line height based on computed styles
//     const computedStyle = window.getComputedStyle(textarea);
//     const newLineHeight = parseInt(computedStyle.lineHeight) || 24;
//     setLineHeight(newLineHeight);

//     return lines;
//   }, []);

//   // Get current line number from cursor position
//   const getCurrentLineNumber = useCallback(() => {
//     const textarea = textareaRef.current;
//     if (!textarea) return 0;

//     const content = textarea.value.substring(0, textarea.selectionStart);
//     return content.split('\n').length - 1;
//   }, []);

//   // Get line start position
//   const getLineStartPosition = useCallback((lineNumber: number) => {
//     const textarea = textareaRef.current;
//     if (!textarea) return 0;

//     const lines = textarea.value.split('\n');
//     let position = 0;
//     for (let i = 0; i < lineNumber; i++) {
//       position += lines[i].length + 1; // +1 for newline character
//     }
//     return position;
//   }, []);

//   // Insert content at cursor position
//   const insertContent = useCallback((content: string) => {
//     const textarea = textareaRef.current;
//     if (!textarea) return;

//     const start = textarea.selectionStart;
//     const end = textarea.selectionEnd;
//     const currentContent = textarea.value;
    
//     const newContent = currentContent.substring(0, start) + content + currentContent.substring(end);
//     onUpdateNote({ content: newContent });
    
//     // Set cursor position after inserted content
//     setTimeout(() => {
//       textarea.focus();
//       textarea.setSelectionRange(start + content.length, start + content.length);
//     }, 0);
//   }, [onUpdateNote]);

//   // Handle page creation
//   const handlePageCreation = (title: string) => {
//     if (onCreatePage) {
//       onCreatePage(title);
//     }
    
//     // Check if this is from a plus icon click or slash command
//     if (targetLine !== null) {
//       insertAtTargetLine(`[[${title}]]`);
//     } else {
//       removeSlashAndInsert(`[[${title}]]`);
//     }
//     setShowPageNameModal(false);
//   };

//   // Helper function to remove slash and insert content (for slash commands)
//   const removeSlashAndInsert = (content: string) => {
//     const textarea = textareaRef.current;
//     if (!textarea) return;

//     const start = textarea.selectionStart;
//     const currentContent = textarea.value;
    
//     // Remove the '/' character and insert new content
//     const beforeSlash = currentContent.substring(0, start - 1);
//     const afterCursor = currentContent.substring(start);
//     const newContent = beforeSlash + content + afterCursor;
    
//     onUpdateNote({ content: newContent });
    
//     // Set cursor position after inserted content
//     setTimeout(() => {
//       textarea.focus();
//       textarea.setSelectionRange(start - 1 + content.length, start - 1 + content.length);
//     }, 0);
//   };

//   const insertPageLink = (title: string) => {
//     insertContent(`[[${title}]]`);
//   };

//   // Insert various content types
//   const insertHeading = (level: number) => {
//     const prefix = '#'.repeat(level);
//     insertContent(`${prefix} Heading ${level}\n`);
//     setShowCommands(false);
//   };

//   const insertTodoList = () => {
//     insertContent('- [ ] Todo item\n');
//     setShowCommands(false);
//   };

//   const insertBulletList = () => {
//     insertContent('• Bullet point\n');
//     setShowCommands(false);
//   };

//   const insertNumberedList = () => {
//     insertContent('1. Numbered item\n');
//     setShowCommands(false);
//   };

//   const insertTable = () => {
//     const tableContent = `| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |\n`;
//     insertContent(tableContent);
//     setShowCommands(false);
//   };

//   const insertQuote = () => {
//     insertContent('> Quote text\n');
//     setShowCommands(false);
//   };

//   const insertDivider = () => {
//     insertContent('---\n');
//     setShowCommands(false);
//   };

//   const insertEmoji = (emoji: string) => {
//     insertContent(emoji);
//     setShowCommands(false);
//   };

//   const insertImage = (file: File) => {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const imageSrc = e.target?.result as string;
//       const imageMarkdown = `![Uploaded image](${imageSrc})\n`;
//       insertContent(imageMarkdown);
//     };
//     reader.readAsDataURL(file);
//     setShowCommands(false);
//   };

//   // Handle content change
//   const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     onUpdateNote({ content: e.target.value });
//   };

//   // Handle key events
//   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === '/') {
//       // For slash commands, clear target line since this is inline typing
//       setTargetLine(null);
//       setTimeout(() => {
//         const textarea = textareaRef.current;
//         if (textarea) {
//           const rect = textarea.getBoundingClientRect();
//           const lineNumber = getCurrentLineNumber();
//           setCommandPosition({
//             x: rect.left + 40,
//             y: rect.top + (lineNumber * lineHeight) + 40
//           });
//           setShowCommands(true);
//         }
//       }, 100);
//     }

//     // Handle typing detection
//     setIsTyping(true);
//     setShowLinePlusIcon(false);
//   };

//   const handleKeyUp = () => {
//     setTimeout(() => {
//       setIsTyping(false);
//     }, 500);
//   };

//   // Handle command selection
//   const handleCommandSelect = (commandId: string) => {
//     console.log('Command selected:', commandId, 'Target line:', targetLine); // Debug log
    
//     switch (commandId) {
//       case 'page':
//         setShowPageNameModal(true);
//         break;
//       case 'heading1':
//         insertAtTargetLine(`# Heading 1\n`);
//         break;
//       case 'heading2':
//         insertAtTargetLine(`## Heading 2\n`);
//         break;
//       case 'heading3':
//         insertAtTargetLine(`### Heading 3\n`);
//         break;
//       case 'todo':
//         insertAtTargetLine('- [ ] Todo item\n');
//         break;
//       case 'bullet':
//         insertAtTargetLine('• Bullet point\n');
//         break;
//       case 'numbered':
//         insertAtTargetLine('1. Numbered item\n');
//         break;
//       case 'table':
//         insertAtTargetLine(`| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |\n`);
//         break;
//       case 'quote':
//         insertAtTargetLine('> Quote text\n');
//         break;
//       case 'divider':
//         insertAtTargetLine('---\n');
//         break;
//       default:
//         break;
//     }
//     setShowCommands(false);
//     setTargetLine(null); // Reset target line
//   };

//   // Insert content at the specific target line (for plus icon commands)
//   const insertAtTargetLine = (content: string) => {
//     const textarea = textareaRef.current;
//     if (!textarea || targetLine === null) return;

//     const currentContent = textarea.value;
//     const lines = currentContent.split('\n');
    
//     // Ensure we have enough lines
//     while (lines.length <= targetLine) {
//       lines.push('');
//     }
    
//     // Insert content at the beginning of the target line
//     lines[targetLine] = content.replace(/\n$/, '') + (lines[targetLine] || '');
    
//     const newContent = lines.join('\n');
//     onUpdateNote({ content: newContent });
    
//     // Calculate cursor position after insertion
//     const insertedLines = content.split('\n');
//     const lineStartPosition = getLineStartPosition(targetLine);
//     const newCursorPosition = lineStartPosition + content.length;
    
//     setTimeout(() => {
//       textarea.focus();
//       textarea.setSelectionRange(newCursorPosition, newCursorPosition);
//     }, 0);
//   };

//   // Handle mouse events for line hovering in the margin area
//   const handleMarginMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
//     if (isTyping) return;

//     const textarea = textareaRef.current;
//     if (!textarea) return;

//     const marginRect = e.currentTarget.getBoundingClientRect();
//     const textareaRect = textarea.getBoundingClientRect();
//     const scrollTop = textarea.scrollTop;
    
//     // Calculate which line the mouse is over
//     const relativeY = e.clientY - textareaRect.top;
//     const adjustedY = relativeY + scrollTop - 16; // Account for padding-top
//     const lineNumber = Math.floor(adjustedY / lineHeight);
    
//     // Get total number of lines (including empty lines)
//     const content = textarea.value;
//     const totalLines = Math.max(content.split('\n').length, 10);
    
//     // Show plus icon if hovering over a valid line area
//     if (lineNumber >= 0 && lineNumber < totalLines) {
//       setHoveredLine(lineNumber);
      
//       // Calculate the Y position relative to the textarea container
//       const lineY = (lineNumber * lineHeight) + 16 - scrollTop + 2;
      
//       setLinePlusPosition({
//         x: 0,
//         y: lineY
//       });
//       setShowLinePlusIcon(true);
//     } else {
//       setShowLinePlusIcon(false);
//       setHoveredLine(null);
//     }
//   };

//   const handleMarginMouseLeave = () => {
//     // Use a longer delay to allow moving to the plus icon
//     setTimeout(() => {
//       if (!document.querySelector('.line-plus-icon:hover')) {
//         setShowLinePlusIcon(false);
//         setHoveredLine(null);
//       }
//     }, 150);
//   };

//   // Handle mouse events for line hovering in textarea
//   const handleMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
//     if (isTyping) return;

//     const textarea = textareaRef.current;
//     if (!textarea) return;

//     const rect = textarea.getBoundingClientRect();
//     const scrollTop = textarea.scrollTop;
    
//     // Calculate which line the mouse is over
//     const relativeY = e.clientY - rect.top;
//     const adjustedY = relativeY + scrollTop - 16; // Account for padding-top
//     const lineNumber = Math.floor(adjustedY / lineHeight);
    
//     // Get total number of lines (including empty lines)
//     const content = textarea.value;
//     const totalLines = Math.max(content.split('\n').length, 10);
    
//     // Check if mouse is in the left margin area (first 40px)
//     const x = e.clientX - rect.left;
//     if (x < 40 && lineNumber >= 0 && lineNumber < totalLines) {
//       setHoveredLine(lineNumber);
      
//       // Calculate the Y position relative to the textarea container
//       const lineY = (lineNumber * lineHeight) + 16 - scrollTop + 2;
      
//       setLinePlusPosition({
//         x: 0,
//         y: lineY
//       });
//       setShowLinePlusIcon(true);
//     } else if (x >= 40) {
//       // Don't hide if mouse is just moving to text area
//       // Let the margin mouse leave handle hiding
//     }
//   };

//   const handleMouseLeave = () => {
//     // Only hide if not moving to the margin area or plus icon
//     setTimeout(() => {
//       if (!document.querySelector('.line-plus-icon:hover') && 
//           !document.querySelector('[data-margin-area]:hover')) {
//         setShowLinePlusIcon(false);
//         setHoveredLine(null);
//       }
//     }, 100);
//   };

//   // Handle plus icon click
//   const handlePlusIconClick = (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
    
//     const textarea = textareaRef.current;
//     if (!textarea || hoveredLine === null) return;

//     // Store the target line for command insertion
//     setTargetLine(hoveredLine);
    
//     // Position cursor at the beginning of the hovered line
//     const lineStartPosition = getLineStartPosition(hoveredLine);
//     textarea.focus();
//     textarea.setSelectionRange(lineStartPosition, lineStartPosition);

//     // Show command suggestions near the plus icon
//     const rect = textarea.getBoundingClientRect();
    
//     setCommandPosition({
//       x: rect.left + 50, // Position to the right of the plus icon
//       y: rect.top + linePlusPosition.y - 10 // Align with the plus icon
//     });
//     setShowCommands(true);
//     setShowLinePlusIcon(false);
    
//     console.log('Plus icon clicked! Line:', hoveredLine, 'Line start position:', lineStartPosition); // Debug log
//   };

//   // Handle clicks on page links
//   const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
//     const textarea = textareaRef.current;
//     if (!textarea) return;

//     // Simple page link detection for [[Page Name]] format
//     const clickPosition = textarea.selectionStart;
//     const content = textarea.value;
    
//     // Find if click is within a page link
//     const beforeCursor = content.substring(0, clickPosition);
//     const afterCursor = content.substring(clickPosition);
    
//     const linkStart = beforeCursor.lastIndexOf('[[');
//     const linkEnd = afterCursor.indexOf(']]');
    
//     if (linkStart !== -1 && linkEnd !== -1) {
//       const linkContent = content.substring(linkStart + 2, clickPosition + linkEnd);
//       if (onNavigateToPage) {
//         onNavigateToPage(linkContent);
//       }
//     }
//   };

//   // Auto-resize textarea
//   useEffect(() => {
//     const textarea = textareaRef.current;
//     if (textarea) {
//       textarea.style.height = 'auto';
//       textarea.style.height = Math.max(textarea.scrollHeight, 400) + 'px';
//     }
//   }, [note.content]);

//   return (
//     <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 h-full overflow-hidden relative">
//       <div className="p-6 pb-20">
//         <input
//           type="text"
//           value={note.title}
//           onChange={(e) => onUpdateNote({ title: e.target.value })}
//           className="w-full text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent bg-transparent border-none outline-none placeholder-gray-400 mb-4"
//           placeholder="✨ Untitled Note"
//         />
        
//         <div className="relative overflow-visible">
//           {/* Left margin area for plus icons */}
//           <div 
//             className="absolute left-0 top-0 w-10 h-full z-10"
//             data-margin-area="true"
//             onMouseMove={handleMarginMouseMove}
//             onMouseLeave={handleMarginMouseLeave}
//           >
//             <div className="w-full h-full relative"></div>
//           </div>
          
//           <textarea
//             ref={textareaRef}
//             value={note.content}
//             onChange={handleContentChange}
//             onKeyDown={handleKeyDown}
//             onKeyUp={handleKeyUp}
//             onMouseMove={handleMouseMove}
//             onMouseLeave={handleMouseLeave}
//             onClick={handleTextareaClick}
//             placeholder="Write '/' for commands or hover at the beginning of any line for the plus menu..."
//             className="w-full min-h-[400px] max-h-[600px] pl-10 pr-4 py-4 border-none outline-none resize-none text-sm leading-6 bg-transparent relative"
//             style={{
//               fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
//               fontSize: '14px',
//               lineHeight: `${lineHeight}px`,
//               color: '#374151',
//               overflow: 'auto'
//             }}
//           />

//           {/* Line Plus Icon */}
//           {showLinePlusIcon && !isTyping && (
//             <div
//               className="line-plus-icon absolute z-30 w-6 h-6 bg-white rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200"
//               style={{
//                 left: '2px',
//                 top: `${linePlusPosition.y}px`,
//                 pointerEvents: 'auto'
//               }}
//               onClick={handlePlusIconClick}
//               onMouseEnter={(e) => {
//                 e.stopPropagation();
//                 setShowLinePlusIcon(true);
//               }}
//               onMouseLeave={(e) => {
//                 e.stopPropagation();
//                 // Don't hide immediately when leaving the icon
//               }}
//             >
//               <Plus size={14} className="text-gray-500" />
//             </div>
//           )}
//         </div>

//         {/* Content Preview (for rendered markdown-like content) */}
//         <div className="mt-4 p-4 bg-gray-50/50 rounded-lg border border-gray-200">
//           <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview:</h4>
//           <div className="text-sm text-gray-600 whitespace-pre-wrap">
//             {note.content.split('\n').map((line, index) => {
//               // Simple markdown-like rendering
//               if (line.startsWith('# ')) {
//                 return <h1 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
//               } else if (line.startsWith('## ')) {
//                 return <h2 key={index} className="text-lg font-bold mt-3 mb-2">{line.substring(3)}</h2>;
//               } else if (line.startsWith('### ')) {
//                 return <h3 key={index} className="text-md font-bold mt-2 mb-1">{line.substring(4)}</h3>;
//               } else if (line.startsWith('- [ ]')) {
//                 return (
//                   <div key={index} className="flex items-center gap-2 my-1">
//                     <input type="checkbox" disabled className="w-4 h-4" />
//                     <span>{line.substring(5)}</span>
//                   </div>
//                 );
//               } else if (line.startsWith('- [x]')) {
//                 return (
//                   <div key={index} className="flex items-center gap-2 my-1">
//                     <input type="checkbox" checked disabled className="w-4 h-4" />
//                     <span className="line-through text-gray-500">{line.substring(5)}</span>
//                   </div>
//                 );
//               } else if (line.startsWith('• ')) {
//                 return <li key={index} className="ml-4 my-1">{line.substring(2)}</li>;
//               } else if (line.startsWith('> ')) {
//                 return (
//                   <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">
//                     {line.substring(2)}
//                   </blockquote>
//                 );
//               } else if (line === '---') {
//                 return <hr key={index} className="my-4 border-gray-300" />;
//               } else if (line.includes('[[') && line.includes(']]')) {
//                 // Render page links
//                 const parts = line.split(/(\[\[.*?\]\])/);
//                 return (
//                   <div key={index} className="my-1">
//                     {parts.map((part, partIndex) => {
//                       if (part.startsWith('[[') && part.endsWith(']]')) {
//                         const pageName = part.substring(2, part.length - 2);
//                         return (
//                           <span
//                             key={partIndex}
//                             className="text-blue-600 underline cursor-pointer hover:bg-blue-50 px-1 rounded"
//                             onClick={() => onNavigateToPage && onNavigateToPage(pageName)}
//                           >
//                             {pageName}
//                           </span>
//                         );
//                       }
//                       return <span key={partIndex}>{part}</span>;
//                     })}
//                   </div>
//                 );
//               } else if (line.trim() === '') {
//                 return <br key={index} />;
//               } else {
//                 return <div key={index} className="my-1">{line}</div>;
//               }
//             })}
//           </div>
//         </div>
//       </div>

//       {/* Fixed Footer */}
//       <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
//         <div className="flex items-center justify-between">
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

//       {/* Command Suggestions */}
//       {showCommands && (
//         <CommandSuggestions
//           position={commandPosition}
//           onSelect={handleCommandSelect}
//           onEmojiSelect={insertEmoji}
//           onImageSelect={insertImage}
//           onClose={() => setShowCommands(false)}
//           editorRef={textareaRef}
//         />
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




























































































// Using tinymce-react for the editor 
// import React, { useRef, useState, useEffect } from 'react';
// import { Editor } from '@tinymce/tinymce-react';
// import { Star } from 'lucide-react';
// import { Note } from '@/lib/types/notes/types';
// import { PageNameModal } from './InlineEditorModal';
// import { CommandSuggestions } from './CommandSuggestions';

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
//   const [showPageNameModal, setShowPageNameModal] = useState(false);

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

//   const insertEmoji = (emoji: string) => {
//     const editor = editorRef.current;
//     if (editor) {
//       editor.insertContent(emoji);
//       setShowCommands(false);
//     }
//   };

//   const insertImage = (file: File) => {
//     const editor = editorRef.current;
//     if (editor) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const imageSrc = e.target?.result as string;
//         const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
//         // Create a responsive image with proper styling
//         const imageHtml = `
//           <figure class="image-figure" style="margin: 1rem 0; text-align: center;">
//             <img 
//               id="${imageId}" 
//               src="${imageSrc}" 
//               alt="Uploaded image" 
//               style="
//                 max-width: 100%; 
//                 height: auto; 
//                 border-radius: 8px; 
//                 box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
//                 cursor: pointer;
//               "
//               onclick="this.style.transform = this.style.transform ? '' : 'scale(1.2)'; this.style.transition = 'transform 0.3s ease';"
//             />
//             <figcaption style="
//               font-size: 0.875rem; 
//               color: #6b7280; 
//               margin-top: 0.5rem; 
//               font-style: italic;
//             ">
//               Click image to zoom
//             </figcaption>
//           </figure>
//           <p></p>
//         `;
        
//         editor.insertContent(imageHtml);
//       };
//       reader.readAsDataURL(file);
//       setShowCommands(false);
//     }
//   };

//   const handleEditorChange = (content: string) => {
//     onUpdateNote({ content });
//   };

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
//           setShowCommands(true);
//         }
//       }, 100);
//     }
//   };

//   const handleCommandSelect = (commandId: string) => {
//     // Remove the '/' character before inserting command content
//     const editor = editorRef.current;
//     if (editor) {
//       // Get current content and remove the last '/' character
//       const currentContent = editor.getContent();
//       const updatedContent = currentContent.replace(/\/$/, '');
//       editor.setContent(updatedContent);
      
//       // Position cursor at the end
//       editor.selection.select(editor.getBody(), true);
//       editor.selection.collapse(false);
//     }

//     switch (commandId) {
//       case 'page':
//         setShowPageNameModal(true);
//         break;
//       case 'heading1':
//         insertHeading(1);
//         break;
//       case 'heading2':
//         insertHeading(2);
//         break;
//       case 'heading3':
//         insertHeading(3);
//         break;
//       case 'todo':
//         insertTodoList();
//         break;
//       case 'bullet':
//         insertBulletList();
//         break;
//       case 'numbered':
//         insertNumberedList();
//         break;
//       case 'table':
//         insertTable();
//         break;
//       case 'quote':
//         insertQuote();
//         break;
//       case 'divider':
//         insertDivider();
//         break;
//       default:
//         break;
//     }
//     setShowCommands(false);
//   };

//   // Check initial content - removed as we're using TinyMCE's built-in placeholder

//   return (
//     <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 h-full overflow-hidden relative">
//       <div className="p-6 pb-20"> {/* Added bottom padding for fixed footer */}
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
//               height: 600,
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
//               placeholder: "Write '/' for commands",
//               content_style: `
//                 body { 
//                   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
//                   font-size: 14px; 
//                   line-height: 1.6;
//                   color: #374151;
//                   padding: 8px;
//                   margin: 0;
//                 }
//                 .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before {
//                   color: #9CA3AF;
//                   font-style: normal;
//                   font-weight: normal;
//                   position: relative;
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
//                 .image-figure {
//                   margin: 1rem 0;
//                   text-align: center;
//                 }
//                 .image-figure img {
//                   transition: transform 0.3s ease, box-shadow 0.3s ease;
//                   border-radius: 8px;
//                   box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
//                 }
//                 .image-figure img:hover {
//                   box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
//                 }
//                 .image-figure figcaption {
//                   font-size: 0.875rem;
//                   color: #6b7280;
//                   margin-top: 0.5rem;
//                   font-style: italic;
//                 }
//                 blockquote {
//                   border-left: 4px solid #e5e7eb;
//                   margin: 1rem 0;
//                   padding: 0.5rem 1rem;
//                   background-color: #f9fafb;
//                   font-style: italic;
//                   color: #4b5563;
//                 }
//                 table {
//                   border-collapse: collapse;
//                   width: 100%;
//                   margin: 1rem 0;
//                   border: 1px solid #e5e7eb;
//                   border-radius: 6px;
//                   overflow: hidden;
//                 }
//                 table td, table th {
//                   border: 1px solid #e5e7eb;
//                   padding: 0.5rem;
//                   text-align: left;
//                 }
//                 table th {
//                   background-color: #f3f4f6;
//                   font-weight: 600;
//                 }
//                 hr {
//                   border: none;
//                   border-top: 2px solid #e5e7eb;
//                   margin: 2rem 0;
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
//       </div>

//       {/* Fixed Footer */}
//       <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
//         <div className="flex items-center justify-between">
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

//       {/* Command Suggestions */}
//       {showCommands && (
//         <CommandSuggestions
//           position={commandPosition}
//           onSelect={handleCommandSelect}
//           onEmojiSelect={insertEmoji}
//           onImageSelect={insertImage}
//           onClose={() => setShowCommands(false)}
//           editorRef={editorRef}
//         />
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