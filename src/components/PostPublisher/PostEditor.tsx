import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Upload, Image, Video, Link, Code, Type, Bold, Italic, List, Quote, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface PostEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  showToolbar?: boolean;
  mode?: 'full' | 'simple' | 'minimal';
}

const PostEditor: React.FC<PostEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing your post...",
  height = 400,
  disabled = false,
  showToolbar = true,
  mode = 'full'
}) => {
  const editorRef = useRef<any>(null);

  const getToolbarConfig = () => {
    switch (mode) {
      case 'minimal':
        return 'bold italic | link';
      case 'simple':
        return 'undo redo | bold italic underline | link | bullist numlist';
      case 'full':
      default:
        return [
          'undo redo | blocks fontfamily fontsize',
          'bold italic underline strikethrough | forecolor backcolor',
          'alignleft aligncenter alignright alignjustify',
          'bullist numlist outdent indent | link image media table',
          'code codesample | preview fullscreen | help'
        ].join(' | ');
    }
  };

  const getPlugins = () => {
    const basePlugins = ['link', 'lists', 'autolink'];
    
    if (mode === 'full') {
      return [
        ...basePlugins,
        'advlist', 'charmap', 'preview', 'anchor', 'searchreplace',
        'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media',
        'table', 'wordcount', 'help', 'image', 'codesample', 'quickbars'
      ];
    }
    
    if (mode === 'simple') {
      return [...basePlugins, 'image', 'table', 'wordcount'];
    }
    
    return basePlugins;
  };

  const handleImageUpload = (blobInfo: any, success: (url: string) => void, failure: (err: string) => void) => {
    // Simulate image upload - in real implementation, upload to your server/CDN
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());
    
    // Mock upload success
    setTimeout(() => {
      const mockUrl = URL.createObjectURL(blobInfo.blob());
      success(mockUrl);
    }, 1000);
  };

  const editorConfig = {
    height,
    menubar: mode === 'full',
    plugins: getPlugins(),
    toolbar: showToolbar ? getToolbarConfig() : false,
    branding: false,
    promotion: false,
    statusbar: mode === 'full',
    resize: mode === 'full',
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
        font-size: 14px;
        line-height: 1.6;
        color: #374151;
        padding: 12px;
      }
      p { margin: 0 0 1em 0; }
      h1, h2, h3, h4, h5, h6 { 
        margin: 1.5em 0 0.5em 0; 
        font-weight: 600;
        line-height: 1.3;
      }
      ul, ol { margin: 0 0 1em 1.5em; }
      blockquote {
        margin: 1em 0;
        padding: 0 0 0 1em;
        border-left: 3px solid #e5e7eb;
        color: #6b7280;
        font-style: italic;
      }
      code {
        background-color: #f3f4f6;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        font-size: 0.9em;
      }
      pre {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 12px;
        margin: 1em 0;
        overflow-x: auto;
      }
      img {
        max-width: 100%;
        height: auto;
        border-radius: 6px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
      }
      table th, table td {
        border: 1px solid #e5e7eb;
        padding: 8px 12px;
        text-align: left;
      }
      table th {
        background-color: #f9fafb;
        font-weight: 600;
      }
    `,
    placeholder,
    skin: 'oxide',
    content_css: 'default',
    setup: (editor: any) => {
      editor.on('init', () => {
        if (disabled) {
          editor.mode.set('readonly');
        }
      });
      
      // Custom toolbar button for templates
      if (mode === 'full') {
        editor.ui.registry.addButton('templates', {
          text: 'Templates',
          icon: 'template',
          onAction: () => {
            // Open template selector modal
            console.log('Open template selector');
          }
        });
        
        editor.ui.registry.addButton('variables', {
          text: 'Variables',
          icon: 'new-document',
          onAction: () => {
            // Insert variable placeholder
            editor.insertContent('{{variable_name}}');
          }
        });
      }
    },
    images_upload_handler: handleImageUpload,
    automatic_uploads: true,
    file_picker_types: 'image',
    file_picker_callback: (callback: any, value: any, meta: any) => {
      if (meta.filetype === 'image') {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.addEventListener('change', (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
              callback(reader.result, {
                alt: file.name
              });
            });
            reader.readAsDataURL(file);
          }
        });
        input.click();
      }
    },
    // Additional configurations
    paste_data_images: true,
    paste_as_text: false,
    smart_paste: true,
    paste_webkit_styles: 'none',
    paste_remove_styles_if_webkit: true,
    paste_merge_formats: true,
    nonbreaking_force_tab: true,
    convert_urls: false,
    remove_script_host: false,
    relative_urls: false,
    // Accessibility
    accessibility_focus: true,
    accessibility_warnings: true,
    // Performance
    auto_focus: false,
    browser_spellcheck: true,
    contextmenu: mode === 'full' ? 'link image table' : false,
  };

  // Custom Quick Actions Bar (shown above editor)
  const QuickActionsBar = () => {
    if (!showToolbar || mode === 'minimal') return null;

    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
          <button
            onClick={() => editorRef.current?.execCommand('Bold')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editorRef.current?.execCommand('Italic')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editorRef.current?.execCommand('InsertUnorderedList')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editorRef.current?.execCommand('mceInsertContent', false, '<blockquote><p>Quote text here...</p></blockquote>')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {content.replace(/<[^>]*>/g, '').length} characters
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <QuickActionsBar />
      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
        onInit={(evt, editor) => editorRef.current = editor}
        value={content}
        onEditorChange={onChange}
        disabled={disabled}
        init={editorConfig}
      />
      
      {/* Word Count and Status Bar */}
      {mode === 'full' && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Words: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length}</span>
            <span>Characters: {content.replace(/<[^>]*>/g, '').length}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => editorRef.current?.execCommand('mcePreview')}
              className="text-blue-600 hover:text-blue-800"
            >
              Preview
            </button>
            <span>•</span>
            <button
              onClick={() => editorRef.current?.execCommand('mceFullScreen')}
              className="text-blue-600 hover:text-blue-800"
            >
              Fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostEditor;