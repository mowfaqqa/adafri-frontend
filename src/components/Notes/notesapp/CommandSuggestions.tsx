import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Upload, X } from 'lucide-react';

interface CommandSuggestionsProps {
  position: { x: number; y: number };
  onSelect: (commandId: string) => void;
  onEmojiSelect: (emoji: string) => void;
  onImageSelect: (file: File) => void;
  onClose: () => void;
  editorRef?: React.RefObject<any>;
}

interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: 'basic' | 'media';
}

export function CommandSuggestions({ 
  position, 
  onSelect, 
  onEmojiSelect, 
  onImageSelect, 
  onClose,
  editorRef
}: CommandSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    // Basic blocks
    {
      id: 'page',
      label: 'Page',
      description: 'Create a new page',
      icon: '📄',
      category: 'basic'
    },
    {
      id: 'heading1',
      label: 'Heading 1',
      description: 'Large heading',
      icon: 'H1',
      category: 'basic'
    },
    {
      id: 'heading2',
      label: 'Heading 2',
      description: 'Medium heading',
      icon: 'H2',
      category: 'basic'
    },
    {
      id: 'heading3',
      label: 'Heading 3',
      description: 'Small heading',
      icon: 'H3',
      category: 'basic'
    },
    {
      id: 'todo',
      label: 'To-do list',
      description: 'Track tasks with a to-do list',
      icon: '☐',
      category: 'basic'
    },
    {
      id: 'bullet',
      label: 'Bulleted list',
      description: 'Create a simple bulleted list',
      icon: '•',
      category: 'basic'
    },
    {
      id: 'numbered',
      label: 'Numbered list',
      description: 'Create a list with numbering',
      icon: '1.',
      category: 'basic'
    },
    {
      id: 'table',
      label: 'Table',
      description: 'Add a table',
      icon: '⊞',
      category: 'basic'
    },
    {
      id: 'quote',
      label: 'Quote',
      description: 'Capture a quote',
      icon: '"',
      category: 'basic'
    },
    {
      id: 'divider',
      label: 'Divider',
      description: 'Visually divide blocks',
      icon: '---',
      category: 'basic'
    },
    // Media commands
    {
      id: 'emoji',
      label: 'Emoji',
      description: 'Add an emoji',
      icon: '😀',
      category: 'media'
    },
    {
      id: 'image',
      label: 'Image',
      description: 'Upload an image',
      icon: '🖼️',
      category: 'media'
    }
  ];

  const basicCommands = commands.filter(cmd => cmd.category === 'basic');
  const mediaCommands = commands.filter(cmd => cmd.category === 'media');

  const handleKeyDown = (e: KeyboardEvent) => {
    if (showEmojiPicker || showImageUpload) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % commands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleCommandSelect(commands[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const removeSlashCharacter = () => {
    if (editorRef?.current) {
      const editor = editorRef.current;
      const currentContent = editor.getContent();
      const updatedContent = currentContent.replace(/\/$/, '');
      editor.setContent(updatedContent);
      
      // Position cursor at the end
      editor.selection.select(editor.getBody(), true);
      editor.selection.collapse(false);
    }
  };

  const handleCommandSelect = (command: Command) => {
    if (command.id === 'emoji') {
      setShowEmojiPicker(true);
    } else if (command.id === 'image') {
      setShowImageUpload(true);
    } else {
      onSelect(command.id);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    removeSlashCharacter();
    onEmojiSelect(emojiData.emoji);
    setShowEmojiPicker(false);
    onClose();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      removeSlashCharacter();
      onImageSelect(file);
      setShowImageUpload(false);
      onClose();
    } else {
      alert('Please select a valid image file');
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, showEmojiPicker, showImageUpload]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.command-suggestions-panel')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (showEmojiPicker) {
    return (
      <div 
        className="command-suggestions-panel fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200"
        style={{
          left: position.x,
          top: position.y
        }}
      >
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Choose an emoji</span>
          <button
            onClick={() => setShowEmojiPicker(false)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          width={320}
          height={400}
          searchDisabled={false}
          skinTonesDisabled={false}
          previewConfig={{
            showPreview: true
          }}
        />
      </div>
    );
  }

  if (showImageUpload) {
    return (
      <div 
        className="command-suggestions-panel fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80"
        style={{
          left: position.x,
          top: position.y
        }}
      >
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Upload an image</span>
          <button
            onClick={() => setShowImageUpload(false)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <div className="p-4">
          <div
            onClick={triggerImageUpload}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                  if (file.size > 10 * 1024 * 1024) {
                    alert('File size must be less than 10MB');
                    return;
                  }
                  removeSlashCharacter();
                  onImageSelect(file);
                  setShowImageUpload(false);
                  onClose();
                } else {
                  alert('Please drop a valid image file');
                }
              }
            }}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Upload size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="command-suggestions-panel fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-y-auto"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      <div className="p-2">
        {/* Basic Blocks Section */}
        <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
          BASIC BLOCKS
        </div>
        {basicCommands.map((command, index) => (
          <div
            key={command.id}
            className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-md ${
              index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
            }`}
            onClick={() => handleCommandSelect(command)}
          >
            <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-sm">
              {command.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900">{command.label}</div>
              <div className="text-xs text-gray-500">{command.description}</div>
            </div>
          </div>
        ))}

        {/* Media Section */}
        <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100 mt-2">
          MEDIA
        </div>
        {mediaCommands.map((command, index) => {
          const adjustedIndex = index + basicCommands.length;
          return (
            <div
              key={command.id}
              className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-md ${
                adjustedIndex === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
              }`}
              onClick={() => handleCommandSelect(command)}
            >
              <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-sm">
                {command.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{command.label}</div>
                <div className="text-xs text-gray-500">{command.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}