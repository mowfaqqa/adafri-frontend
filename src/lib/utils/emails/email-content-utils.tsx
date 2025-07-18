"use client";

import React, { useEffect, useRef, useState } from 'react';

/**
 * Enhanced utility functions for processing and displaying email content
 * Handles complex HTML, MIME multipart messages, and various encoding formats
 */

/**
 * More comprehensive fix for UTF-8 character encoding issues in text
 * Particularly for apostrophes, quotes and special characters
 */
function fixEncodingIssues(text: string): string {
  if (!text) return '';
  
  // Direct replacements for common problematic patterns
  let preProcessed = text;
  
  // Direct pattern fix for "—The Anthropic Team"
  preProcessed = preProcessed.replace(/â[\s\S]{0,2}The Anthropic Team/g, '—The Anthropic Team');
  
  // Handle HTML entities
  const htmlFixed = preProcessed
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&bull;/g, '•')
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '...')
    .replace(/&#8212;/g, '—')
    .replace(/&#8211;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Handle UTF-8 encoding issues - comprehensive patterns
  const result = htmlFixed
    // Fix apostrophes - multiple patterns
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â'/g, "'") 
    .replace(/â\x80\x99/g, "'")
    .replace(/\xE2\x80\x99/g, "'")
    .replace(/â\x80\x98/g, "'")
    .replace(/\xE2\x80\x98/g, "'")
    // Fix apostrophes with different byte representations
    .replace(/Ã¢â‚¬â„¢/g, "'")
    .replace(/Ã¢â‚¬Ëœ/g, "'")
    .replace(/Ã¢â‚¬â€œ/g, '"')
    .replace(/Ã¢â‚¬â€/g, '"')
    // Fix quotes
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â"/g, '"')
    .replace(/â"/g, '"')
    .replace(/â\x80\x9C/g, '"')
    .replace(/â\x80\x9D/g, '"')
    .replace(/\xE2\x80\x9C/g, '"')
    .replace(/\xE2\x80\x9D/g, '"')
    // Fix other common characters
    .replace(/â€¦/g, '...')
    .replace(/â€"/g, '—')
    .replace(/â€"/g, '–')
    .replace(/Â/g, ' ')
    // Fix even more rare variants
    .replace(/â\x80¦/g, '...')
    .replace(/â\x80"/g, '—')
    .replace(/â\x80"/g, '–')
    // Handle "â□□" patterns more comprehensively for em/en dashes
    .replace(/â□□/g, '—')
    .replace(/â□/g, '–')
    // More comprehensive - handle various Unicode box characters
    .replace(/â[\u25A1\u25A0\u2610\u2611\u2612]{2}/g, '—')
    .replace(/â[\u25A1\u25A0\u2610\u2611\u2612]/g, '–')
    // Handle non-breaking space combinations
    .replace(/â\u00A0\u00A0/g, '—')
    .replace(/â\u00A0/g, '–')
    // Fallback to catch any remaining â + box-like character sequences
    .replace(/â[\u2000-\u2FFF]{2}/g, '—')
    .replace(/â[\u2000-\u2FFF]/g, '–')
    // Double-encoded UTF-8 sequences
    .replace(/Ã¢â‚¬Â¦/g, '...')
    .replace(/Ã¢â‚¬â€"/g, '—')
    .replace(/Ã¢â‚¬â€"/g, '–')
    .replace(/Ã‚Â/g, ' ')
    // Special case fixes
    .replace(/â[^\w]*The Anthropic Team/g, '—The Anthropic Team')
    .replace(/[^\w\s]The Anthropic Team/g, '—The Anthropic Team')
    // Super aggressive fallback
    .replace(/â[^\w\s.,;:!?'"]/g, '—')
    .replace(/â$/, '—');

  // Final check for any remaining instances
  if (result.includes('â')) {
    return result.replace(/â/g, '—');
  }

  return result;
}

/**
 * Enhanced MIME boundary detection
 */
function detectMimeBoundary(content: string): string | null {
  // Try different boundary patterns
  const boundaryPatterns = [
    /boundary=["']?([^"'\r\n;]+)/i,
    /^--([a-zA-Z0-9_\-\.]+)/m,
    /Content-Type:.*?boundary=([^\r\n;]+)/i
  ];

  for (const pattern of boundaryPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  return null;
}

/**
 * Enhanced MIME part extraction
 */
function extractMimeParts(content: string, boundary: string): Array<{
  contentType: string;
  encoding: string;
  content: string;
}> {
  const parts: Array<{
    contentType: string;
    encoding: string;
    content: string;
  }> = [];

  // Split by boundary - handle both --boundary and boundary formats
  const boundaryPattern = new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
  const sections = content.split(boundaryPattern);

  for (const section of sections) {
    if (!section.trim() || section.includes('--')) continue;

    // Extract headers and content
    const headerEndIndex = section.indexOf('\r\n\r\n');
    if (headerEndIndex === -1) continue;

    const headers = section.substring(0, headerEndIndex);
    const bodyContent = section.substring(headerEndIndex + 4);

    // Parse content type
    const contentTypeMatch = headers.match(/Content-Type:\s*([^;\r\n]+)/i);
    const contentType = contentTypeMatch ? contentTypeMatch[1].trim().toLowerCase() : '';

    // Parse encoding
    const encodingMatch = headers.match(/Content-Transfer-Encoding:\s*([^\r\n;]+)/i);
    const encoding = encodingMatch ? encodingMatch[1].trim().toLowerCase() : '';

    if (contentType && bodyContent.trim()) {
      parts.push({
        contentType,
        encoding,
        content: bodyContent.trim()
      });
    }
  }

  return parts;
}

/**
 * Decode content based on encoding
 */
function decodeContent(content: string, encoding: string): string {
  switch (encoding.toLowerCase()) {
    case 'quoted-printable':
      return decodeQuotedPrintable(content);
    case 'base64':
      try {
        return atob(content.replace(/\s+/g, ''));
      } catch (e) {
        console.error('Error decoding base64 content:', e);
        return content;
      }
    case '7bit':
    case '8bit':
    default:
      return content;
  }
}

/**
 * Decode quoted-printable content
 */
function decodeQuotedPrintable(content: string): string {
  // Handle soft line breaks
  content = content.replace(/=\r\n/g, '');
  content = content.replace(/=\n/g, '');
  
  // Replace =XX with the corresponding character
  return content.replace(/=([0-9A-F]{2})/gi, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}

/**
 * Extract HTML content from MIME message with better parsing
 */
function extractHtmlFromMime(content: string): string | null {
  // Look for HTML content in the MIME message more aggressively
  const htmlRegexes = [
    // Standard MIME HTML part
    /Content-Type:\s*text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$|$)/i,
    // HTML part without strict boundaries
    /Content-Type:\s*text\/html[\s\S]*?\r\n\r\n([\s\S]*)/i,
    // Look for HTML content after quoted-printable encoding declaration
    /Content-Transfer-Encoding:\s*quoted-printable\r\nContent-Type:\s*text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$|$)/i,
    // Direct HTML detection in multipart
    /(<!DOCTYPE[\s\S]*?<\/html>)/i,
    /(<html[\s\S]*?<\/html>)/i
  ];

  for (const regex of htmlRegexes) {
    const match = content.match(regex);
    if (match && match[1] && match[1].trim()) {
      let htmlContent = match[1].trim();
      
      // If it looks like quoted-printable, decode it
      if (htmlContent.includes('=3D') || htmlContent.includes('=\r\n')) {
        htmlContent = decodeQuotedPrintable(htmlContent);
      }
      
      // Check if this actually contains HTML tags
      if (htmlContent.includes('<') && htmlContent.includes('>')) {
        return htmlContent;
      }
    }
  }

  return null;
}

/**
 * Identifies and processes different email content formats
 */
export function processEmailContent(content: string | undefined): {
  processedContent: string;
  contentType: 'html' | 'text' | 'mime';
  plainTextVersion: string;
} {
  if (!content) {
    return {
      processedContent: '',
      contentType: 'text',
      plainTextVersion: ''
    };
  }

  // First apply encoding fix to the entire content
  const fixedContent = fixEncodingIssues(content);

  // First, try to extract HTML content using aggressive parsing
  const extractedHtml = extractHtmlFromMime(fixedContent);
  if (extractedHtml) {
    const processedHtml = sanitizeHtml(extractedHtml);
    return {
      processedContent: processedHtml,
      contentType: 'html',
      plainTextVersion: extractTextFromHtml(extractedHtml)
    };
  }

  // Check if it's a MIME multipart message
  const boundary = detectMimeBoundary(fixedContent);
  
  if (boundary) {
    const parts = extractMimeParts(fixedContent, boundary);
    
    let htmlContent = '';
    let plainTextContent = '';

    // Process each MIME part
    for (const part of parts) {
      const decodedContent = decodeContent(part.content, part.encoding);
      const processedContent = fixEncodingIssues(decodedContent);

      if (part.contentType.includes('text/html')) {
        htmlContent = processedContent;
      } else if (part.contentType.includes('text/plain')) {
        plainTextContent = processedContent;
      }
    }

    // Prefer HTML content if available
    if (htmlContent) {
      return {
        processedContent: sanitizeHtml(htmlContent),
        contentType: 'html',
        plainTextVersion: plainTextContent || extractTextFromHtml(htmlContent)
      };
    } else if (plainTextContent) {
      return {
        processedContent: plainTextContent,
        contentType: 'text',
        plainTextVersion: plainTextContent
      };
    }
  }

  // Legacy MIME parsing for older formats
  if (fixedContent.includes('Content-Transfer-Encoding:') || 
      fixedContent.includes('Content-Type: text/plain') || 
      fixedContent.includes('Content-Type: text/html')) {
    const { htmlContent, plainText } = extractAndDecodeMimeContent(fixedContent);
    
    if (htmlContent) {
      return {
        processedContent: sanitizeHtml(htmlContent),
        contentType: 'html',
        plainTextVersion: plainText || extractTextFromHtml(htmlContent)
      };
    } else if (plainText) {
      return {
        processedContent: plainText,
        contentType: 'text',
        plainTextVersion: plainText
      };
    }
  }

  // Check for HTML content in the raw content
  if (
    fixedContent.includes('<!DOCTYPE') || 
    fixedContent.includes('<html') || 
    fixedContent.includes('<div') ||
    fixedContent.includes('<p>') ||
    fixedContent.includes('<body') ||
    fixedContent.includes('<table') ||
    fixedContent.includes('<tr')
  ) {
    // Check if content is encoded with =3D type encoding (quoted-printable)
    if (fixedContent.includes('=3D')) {
      const decodedContent = decodeQuotedPrintable(fixedContent);
      return {
        processedContent: sanitizeHtml(decodedContent),
        contentType: 'html',
        plainTextVersion: extractTextFromHtml(decodedContent)
      };
    }

    return {
      processedContent: sanitizeHtml(fixedContent),
      contentType: 'html',
      plainTextVersion: extractTextFromHtml(fixedContent)
    };
  }

  // Default to plain text
  return {
    processedContent: fixedContent,
    contentType: 'text',
    plainTextVersion: fixedContent
  };
}

/**
 * Legacy function for backward compatibility - enhanced
 */
function extractAndDecodeMimeContent(content: string): { htmlContent: string; plainText: string } {
  let htmlContent = '';
  let plainText = '';
  
  // Enhanced boundary detection
  const boundaryPatterns = [
    /boundary=["']?([^"'\r\n;]+)/i,
    /--([a-zA-Z0-9_\-\.]+)/,
    /Content-Type:.*?boundary=([^\r\n;]+)/i
  ];
  
  let boundary = null;
  for (const pattern of boundaryPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      boundary = match[1].trim().replace(/^["']|["']$/g, '');
      break;
    }
  }
  
  if (boundary) {
    // Try different boundary formats
    const possibleBoundaries = [
      `--${boundary}`,
      boundary,
      `${boundary}--`
    ];
    
    for (const testBoundary of possibleBoundaries) {
      const parts = content.split(testBoundary);
      
      if (parts.length > 1) {
        for (const part of parts) {
          if (!part.trim()) continue;
          
          // Look for HTML content more aggressively
          if (part.includes('Content-Type: text/html') || 
              (part.includes('Content-Type:') && part.includes('html'))) {
            
            const encoding = part.match(/Content-Transfer-Encoding:\s*([^\r\n;]+)/i)?.[1]?.toLowerCase();
            
            // Try multiple content extraction patterns
            const contentPatterns = [
              /\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$|$)/,
              /\r\n\r\n([\s\S]*)/,
              /Content-Type:.*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$|$)/i,
              /(<!DOCTYPE[\s\S]*)/i,
              /(<html[\s\S]*)/i
            ];
            
            for (const pattern of contentPatterns) {
              const contentMatch = part.match(pattern);
              if (contentMatch && contentMatch[1]) {
                let extractedContent = contentMatch[1].trim();
                extractedContent = decodeContent(extractedContent, encoding || '');
                
                // Verify it's actually HTML content
                if (extractedContent.includes('<') && extractedContent.includes('>')) {
                  htmlContent = fixEncodingIssues(extractedContent);
                  break;
                }
              }
            }
            
            if (htmlContent) break;
          } 
          
          // Look for plain text content
          else if (part.includes('Content-Type: text/plain') || 
                   (part.includes('Content-Type:') && part.includes('plain'))) {
            
            const encoding = part.match(/Content-Transfer-Encoding:\s*([^\r\n;]+)/i)?.[1]?.toLowerCase();
            const contentMatch = part.match(/\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$|$)/i);
            
            if (contentMatch && contentMatch[1]) {
              let extractedContent = contentMatch[1].trim();
              extractedContent = decodeContent(extractedContent, encoding || '');
              plainText = fixEncodingIssues(extractedContent);
            }
          }
        }
        
        if (htmlContent || plainText) break;
      }
    }
  }
  
  // If no boundary-based extraction worked, try direct pattern matching
  if (!htmlContent && !plainText) {
    // Look for HTML content directly
    const htmlPatterns = [
      /Content-Type:\s*text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$|$)/i,
      /(<!DOCTYPE[\s\S]*?<\/html>)/i,
      /(<html[\s\S]*?<\/html>)/i
    ];
    
    for (const pattern of htmlPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        let extractedHtml = match[1].trim();
        if (extractedHtml.includes('=3D')) {
          extractedHtml = decodeQuotedPrintable(extractedHtml);
        }
        if (extractedHtml.includes('<') && extractedHtml.includes('>')) {
          htmlContent = fixEncodingIssues(extractedHtml);
          break;
        }
      }
    }
    
    // Look for plain text content directly
    if (!plainText) {
      const plainTextMatch = content.match(/Content-Type:\s*text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$|$)/i);
      if (plainTextMatch && plainTextMatch[1]) {
        plainText = fixEncodingIssues(plainTextMatch[1].trim());
      }
    }
  }

  return { htmlContent, plainText };
}

/**
 * Sanitize HTML content to make it safe for rendering in iframe
 */
function sanitizeHtml(html: string): string {
  // Apply our encoding fix function
  html = fixEncodingIssues(html);

  // Add HTML and body tags if they don't exist
  if (!html.includes('<html')) {
    html = `<html><head><meta charset="UTF-8"></head><body>${html}</body></html>`;
  }

  // Fix common issues with HTML emails
  html = html.replace('<head>', `<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
      body {
        max-width: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        padding: 16px;
        line-height: 1.6;
      }
      /* Force correct apostrophes and quotes */
      * {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      /* Responsive images */
      img {
        max-width: 100%;
        height: auto;
      }
      /* Responsive tables */
      table {
        max-width: 100%;
        border-collapse: collapse;
      }
      /* Fix for long URLs */
      a {
        word-break: break-word;
      }
    </style>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Fix encoding issues in text nodes
        const fixTextNodes = function() {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          const nodesToFix = [];
          let node;
          
          while(node = walker.nextNode()) {
            if(node.nodeValue && node.nodeValue.includes('â')) {
              nodesToFix.push(node);
            }
          }
          
          nodesToFix.forEach(node => {
            node.nodeValue = node.nodeValue
              .replace(/â[\u25A1\u25A0\u2610\u2611\u2612]{1,2}/g, '—')
              .replace(/â\u00A0\u00A0/g, '—')
              .replace(/â\u00A0/g, '—')
              .replace(/â□□/g, '—')
              .replace(/â□/g, '—')
              .replace(/â[\u2000-\u2FFF]{1,2}/g, '—')
              .replace(/â[^\w\s.,;:!?'"]/g, '—')
              .replace(/â/g, '—');
          });
        };
        
        fixTextNodes();
        
        // Handle The Anthropic Team special case
        document.body.innerHTML = document.body.innerHTML.replace(/â[^\w]*The Anthropic Team/g, '—The Anthropic Team');
        
        // Ensure iframe resizes to content
        if (window.parent) {
          const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
          window.parent.postMessage({type: 'resize', height: height}, '*');
        }
      });
    </script>
  `);
  
  return html;
}

/**
 * Extracts plain text from HTML content
 */
export function extractTextFromHtml(html: string): string {
  const fixedHtml = fixEncodingIssues(html);
  
  if (typeof window === 'undefined') {
    // Server-side fallback
    return fixedHtml
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fixedHtml;
    
    // Remove unwanted elements
    const elementsToRemove = tempDiv.querySelectorAll('style, script, head, meta, link');
    elementsToRemove.forEach(el => el.remove());
    
    const text = (tempDiv.textContent || tempDiv.innerText || '').trim();
    return fixEncodingIssues(text.replace(/\s+/g, ' '));
  } catch (e) {
    console.error('Error extracting text from HTML:', e);
    return fixEncodingIssues(fixedHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
  }
}

/**
 * Creates a preview of email content
 */
export function createEmailPreview(content: string | undefined, maxLength: number = 100): string {
  if (!content) return '';
  
  content = fixEncodingIssues(content);
  
  const hasQuotedPrintable = content.includes('=3D') || content.includes('=0A') || content.includes('=20');
  
  if (typeof window === 'undefined') {
    let strippedContent;
    
    if (hasQuotedPrintable) {
      const decodedContent = decodeQuotedPrintable(content);
      strippedContent = decodedContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      strippedContent = content
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    strippedContent = fixEncodingIssues(strippedContent);
    
    return strippedContent.substring(0, maxLength) + 
      (strippedContent.length > maxLength ? '...' : '');
  }

  const { plainTextVersion } = processEmailContent(content);
  
  return plainTextVersion.substring(0, maxLength) + 
    (plainTextVersion.length > maxLength ? '...' : '');
}

/**
 * React component to render email content appropriately with auto height adjustment
 */
export const EmailContentRenderer: React.FC<{ content?: string }> = ({ content }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(400);
  
  const { processedContent, contentType, plainTextVersion } = content ? processEmailContent(content) : {
    processedContent: '',
    contentType: 'text' as const,
    plainTextVersion: ''
  };
  
  useEffect(() => {
    if (contentType === 'html' && iframeRef.current && processedContent) {
      const iframe = iframeRef.current;
      
      const handleLoad = () => {
        try {
          if (iframe.contentWindow) {
            const height = iframe.contentWindow.document.body.scrollHeight;
            setIframeHeight(Math.max(400, height + 40));
          }
        } catch (e) {
          console.error('Error adjusting iframe height:', e);
        }
      };

      // Listen for resize messages from iframe
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'resize' && typeof event.data.height === 'number') {
          setIframeHeight(Math.max(400, event.data.height + 40));
        }
      };

      iframe.onload = handleLoad;
      window.addEventListener('message', handleMessage);
      
      return () => {
        iframe.onload = null;
        window.removeEventListener('message', handleMessage);
      };
    }
    
    return () => {};
  }, [contentType, processedContent]);
  
  if (!content) return null;
  
  if (contentType === 'html') {
    return (
      <div className="email-html-container relative w-full">
        <iframe 
          ref={iframeRef}
          srcDoc={processedContent}
          title="Email Content"
          style={{ height: `${iframeHeight}px` }}
          className="w-full border-0 rounded-lg"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    );
  } else {
    return (
      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed p-4 bg-gray-50 rounded-lg">
        {processedContent}
      </div>
    );
  }
};















































// 7/9/2025
// "use client";

// import React, { useEffect, useRef, useState } from 'react';

// /**
//  * Enhanced utility functions for processing and displaying email content
//  * Handles complex HTML, MIME multipart messages, and various encoding formats
//  */

// /**
//  * More comprehensive fix for UTF-8 character encoding issues in text
//  * Particularly for apostrophes, quotes and special characters
//  */
// function fixEncodingIssues(text: string): string {
//   if (!text) return '';
  
//   // Direct replacements for common problematic patterns
//   // Pre-process common patterns that show up in your emails
//   let preProcessed = text;
  
//   // Direct pattern fix for "—The Anthropic Team"
//   preProcessed = preProcessed.replace(/â[\s\S]{0,2}The Anthropic Team/g, '—The Anthropic Team');
  
// // Handle HTML entities
// const htmlFixed = preProcessed
// .replace(/&rsquo;/g, "'")
// .replace(/&lsquo;/g, "'")
// .replace(/&rdquo;/g, '"')
// .replace(/&ldquo;/g, '"')
// .replace(/&bull;/g, '•')
// .replace(/&hellip;/g, '...')
// .replace(/&mdash;/g, '—')
// .replace(/&ndash;/g, '–')
// .replace(/&#8217;/g, "'")
// .replace(/&#8216;/g, "'")
// .replace(/&#8220;/g, '"')
// .replace(/&#8221;/g, '"')
// .replace(/&#8230;/g, '...')
// .replace(/&#8212;/g, '—')
// .replace(/&#8211;/g, '–')
// .replace(/&nbsp;/g, ' ')
// .replace(/&amp;/g, '&')
// .replace(/&lt;/g, '<')
// .replace(/&gt;/g, '>');

// // Handle UTF-8 encoding issues - more comprehensive patterns
// const result = htmlFixed
// // Fix apostrophes - multiple patterns
// .replace(/â€™/g, "'")
// .replace(/â€˜/g, "'")
// .replace(/â'/g, "'") 
// .replace(/â\x80\x99/g, "'")
// .replace(/\xE2\x80\x99/g, "'")
// .replace(/â\x80\x98/g, "'")
// .replace(/\xE2\x80\x98/g, "'")
// // Fix apostrophes with different byte representations
// .replace(/Ã¢â‚¬â„¢/g, "'")
// .replace(/Ã¢â‚¬Ëœ/g, "'")
// .replace(/Ã¢â‚¬â€œ/g, '"')
// .replace(/Ã¢â‚¬â€/g, '"')
// // Fix quotes
// .replace(/â€œ/g, '"')
// .replace(/â€/g, '"')
// .replace(/â"/g, '"')
// .replace(/â"/g, '"')
// .replace(/â\x80\x9C/g, '"')
// .replace(/â\x80\x9D/g, '"')
// .replace(/\xE2\x80\x9C/g, '"')
// .replace(/\xE2\x80\x9D/g, '"')
// // Fix other common characters
// .replace(/â€¦/g, '...')
// .replace(/â€"/g, '—')
// .replace(/â€"/g, '–')
// .replace(/Â/g, ' ')
// // Fix even more rare variants
// .replace(/â\x80¦/g, '...')
// .replace(/â\x80"/g, '—')
// .replace(/â\x80"/g, '–')

// // IMPROVED - Handle "â□□" patterns more comprehensively for em/en dashes
// // First handle common box characters that appear after â
// .replace(/â□□/g, '—')            // Simple box characters for em dash
// .replace(/â□/g, '–')             // Simple box character for en dash

// // More comprehensive - handle various Unicode box characters
// .replace(/â[\u25A1\u25A0\u2610\u2611\u2612]{2}/g, '—')  // Two box characters after â = em dash
// .replace(/â[\u25A1\u25A0\u2610\u2611\u2612]/g, '–')     // One box character after â = en dash

// // Handle non-breaking space combinations (common in encoded dashes)
// .replace(/â\u00A0\u00A0/g, '—')  // em dash
// .replace(/â\u00A0/g, '–')        // en dash

// // This is a fallback to catch any remaining â + box-like character sequences
// .replace(/â[\u2000-\u2FFF]{2}/g, '—')  // any two Unicode box-like chars after â
// .replace(/â[\u2000-\u2FFF]/g, '–')     // any one Unicode box-like char after â

// // Double-encoded UTF-8 sequences
// .replace(/Ã¢â‚¬Â¦/g, '...')
// .replace(/Ã¢â‚¬â€"/g, '—')
// .replace(/Ã¢â‚¬â€"/g, '–')
// .replace(/Ã‚Â/g, ' ')

// // Special case fixes that were previously only in createEmailPreview
// .replace(/â[^\w]*The Anthropic Team/g, '—The Anthropic Team')
// .replace(/[^\w\s]The Anthropic Team/g, '—The Anthropic Team')

// // Super aggressive fallback - any â followed by anything unusual becomes em dash
// .replace(/â[^\w\s.,;:!?'"]/g, '—')
// .replace(/â$/, '—');             // â at end of string

// // Check if we need to make a second pass for any remaining instances
// if (result.includes('â')) {
// return result.replace(/â/g, '—'); // Last resort - any remaining â becomes em dash
// }

// return result;
// }


// /**
//  * Identifies and processes different email content formats
//  * @param content The raw email content
//  * @returns Processed content with content type information
//  */
// export function processEmailContent(content: string | undefined): {
//   processedContent: string;
//   contentType: 'html' | 'text' | 'mime';
//   plainTextVersion: string;
// } {
//   if (!content) {
//     return {
//       processedContent: '',
//       contentType: 'text',
//       plainTextVersion: ''
//     };
//   }

//   // First apply encoding fix to the entire content
//   const fixedContent = fixEncodingIssues(content);

//   // Check for MIME encoded content with quoted-printable or base64 encoding
//   if (fixedContent.includes('Content-Transfer-Encoding:')) {
//     const { htmlContent, plainText } = extractAndDecodeMimeContent(fixedContent);
    
//     // If we have HTML content in the MIME message, use that
//     if (htmlContent) {
//       return {
//         processedContent: sanitizeHtml(htmlContent),
//         contentType: 'html',
//         plainTextVersion: fixEncodingIssues(plainText || extractTextFromHtml(htmlContent))
//       };
//     } else if (plainText) {
//       return {
//         processedContent: fixEncodingIssues(plainText),
//         contentType: 'text',
//         plainTextVersion: fixEncodingIssues(plainText)
//       };
//     }
//   }

//   // Check for regular MIME multipart format
//   if (fixedContent.includes('Content-Type: text/plain') || fixedContent.includes('Content-Type: text/html')) {
//     const { htmlContent, plainText } = extractMimeContent(fixedContent);
    
//     // If we have HTML content in the MIME message, use that
//     if (htmlContent) {
//       return {
//         processedContent: sanitizeHtml(htmlContent),
//         contentType: 'html',
//         plainTextVersion: plainText || extractTextFromHtml(htmlContent)
//       };
//     } else if (plainText) {
//       return {
//         processedContent: plainText,
//         contentType: 'text',
//         plainTextVersion: plainText
//       };
//     }
//   }

//   // Look for HTML content with doctype, html tags, or common HTML elements
//   if (
//     fixedContent.includes('<!DOCTYPE') || 
//     fixedContent.includes('<html') || 
//     fixedContent.includes('<div') ||
//     fixedContent.includes('<p>') ||
//     fixedContent.includes('<body') ||
//     fixedContent.includes('<table') ||
//     fixedContent.includes('<tr')
//   ) {
//     // Check if content is encoded with =3D type encoding (quoted-printable)
//     if (fixedContent.includes('=3D')) {
//       const decodedContent = decodeQuotedPrintable(fixedContent);
//       return {
//         processedContent: sanitizeHtml(decodedContent),
//         contentType: 'html',
//         plainTextVersion: extractTextFromHtml(decodedContent)
//       };
//     }

//     return {
//       processedContent: sanitizeHtml(fixedContent),
//       contentType: 'html',
//       plainTextVersion: extractTextFromHtml(fixedContent)
//     };
//   }

//   // Default to plain text
//   return {
//     processedContent: fixedContent,
//     contentType: 'text',
//     plainTextVersion: fixedContent
//   };
// }

// /**
//  * Decode quoted-printable content (like =3D for =)
//  */
// function decodeQuotedPrintable(content: string): string {
//   // Handle soft line breaks (= at end of line)
//   content = content.replace(/=\r\n/g, '');
//   content = content.replace(/=\n/g, '');
  
//   // Replace =XX with the corresponding character
//   return content.replace(/=([0-9A-F]{2})/gi, (_, hex) => {
//     return String.fromCharCode(parseInt(hex, 16));
//   });
// }

// /**
//  * Extract content from complex MIME messages with encoding
//  */
// function extractAndDecodeMimeContent(content: string): { htmlContent: string; plainText: string } {
//   let htmlContent = '';
//   let plainText = '';
  
//   // First try to find a boundary
//   const boundaryMatch = content.match(/boundary=["']?([^"'\r\n;]+)/i);
//   const boundary = boundaryMatch ? boundaryMatch[1] : null;
  
//   if (boundary) {
//     // Split by boundary
//     const parts = content.split(`--${boundary}`);
    
//     for (const part of parts) {
//       if (part.includes('Content-Type: text/html')) {
//         // Extract the content and handle encodings
//         const encoding = part.match(/Content-Transfer-Encoding:\s*([^\r\n;]+)/i)?.[1]?.toLowerCase();
//         const contentMatch = part.match(/\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$)/i);
        
//         if (contentMatch && contentMatch[1]) {
//           let extractedContent = contentMatch[1].trim();
          
//           // Handle different encodings
//           if (encoding === 'quoted-printable') {
//             extractedContent = decodeQuotedPrintable(extractedContent);
//           } else if (encoding === 'base64') {
//             try {
//               extractedContent = atob(extractedContent.replace(/\s+/g, ''));
//             } catch (e) {
//               console.error('Error decoding base64 content:', e);
//             }
//           }
          
//           htmlContent = fixEncodingIssues(extractedContent);
//         }
//       } else if (part.includes('Content-Type: text/plain')) {
//         // Extract plain text content with encoding
//         const encoding = part.match(/Content-Transfer-Encoding:\s*([^\r\n;]+)/i)?.[1]?.toLowerCase();
//         const contentMatch = part.match(/\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$)/i);
        
//         if (contentMatch && contentMatch[1]) {
//           let extractedContent = contentMatch[1].trim();
          
//           // Handle different encodings
//           if (encoding === 'quoted-printable') {
//             extractedContent = decodeQuotedPrintable(extractedContent);
//           } else if (encoding === 'base64') {
//             try {
//               extractedContent = atob(extractedContent.replace(/\s+/g, ''));
//             } catch (e) {
//               console.error('Error decoding base64 content:', e);
//             }
//           }
          
//           plainText = fixEncodingIssues(extractedContent);
//         }
//       }
//     }
//   } else {
//     // No boundary found, try normal extraction
//     return extractMimeContent(content);
//   }

//   // If no HTML content found but content looks like HTML, try to extract directly
//   if (!htmlContent && (content.includes('<!DOCTYPE') || content.includes('<html'))) {
//     // Try to find the HTML part in the whole content
//     const htmlStartIndex = content.indexOf('<!DOCTYPE') >= 0 ? 
//                           content.indexOf('<!DOCTYPE') : 
//                           content.indexOf('<html');
    
//     if (htmlStartIndex >= 0) {
//       htmlContent = content.slice(htmlStartIndex);
      
//       // Check if it's encoded
//       if (htmlContent.includes('=3D')) {
//         htmlContent = decodeQuotedPrintable(htmlContent);
//       }
      
//       // Apply encoding fix
//       htmlContent = fixEncodingIssues(htmlContent);
//     }
//   }

//   return { htmlContent, plainText };
// }

// /**
//  * Extracts plain text and HTML parts from MIME multipart messages
//  */
// function extractMimeContent(content: string): { htmlContent: string; plainText: string } {
//   let htmlContent = '';
//   let plainText = '';

//   // Extract plain text part if it exists
//   const plainTextMatch = content.match(/Content-Type: text\/plain.*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$)/i);
//   if (plainTextMatch && plainTextMatch[1]) {
//     plainText = fixEncodingIssues(plainTextMatch[1].trim());
//   }

//   // Extract HTML part if it exists
//   const htmlMatch = content.match(/Content-Type: text\/html.*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$)/i);
//   if (htmlMatch && htmlMatch[1]) {
//     htmlContent = fixEncodingIssues(htmlMatch[1].trim());
//   }

//   return { htmlContent, plainText };
// }

// /**
//  * Sanitize HTML content to make it safe for rendering in iframe
//  */
// function sanitizeHtml(html: string): string {
//   // Apply our encoding fix function
//   html = fixEncodingIssues(html);

//   // Add HTML and body tags if they don't exist
//   if (!html.includes('<html')) {
//     html = `<html><head><meta charset="UTF-8"></head><body>${html}</body></html>`;
//   }

//   // Fix common issues with HTML emails
//   // Set maximum width to prevent horizontal scrolling
//   html = html.replace('<head>', `<head>
//     <meta name="viewport" content="width=device-width, initial-scale=1">
//     <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
//     <style>
//       body {
//         max-width: 100%;
//         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
//       }
//       /* Force correct apostrophes and quotes */
//       * {
//         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
//       }
//       /* Fix apostrophes and quotes that might appear in CSS content properties */
//       [class*="quote"]:before, [class*="quote"]:after,
//       [class*="apostrophe"]:before, [class*="apostrophe"]:after {
//         content: "'" !important;
//       }
//       /* Force normal dashes */
//       .dash, [class*="dash"], [class*="mdash"], [class*="ndash"] {
//         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
//       }
//     </style>
//     <script>
//       // This script runs in the iframe to find and fix any remaining dash encoding issues
//       document.addEventListener('DOMContentLoaded', function() {
//         // Special case fix for "—The Anthropic Team"
//         const anthropicTeamFix = function() {
//           const textNodes = [];
//           const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
//           let node;
          
//           while(node = walker.nextNode()) {
//             if(node.nodeValue && node.nodeValue.includes('The Anthropic Team')) {
//               textNodes.push(node);
//             }
//           }
          
//           textNodes.forEach(node => {
//             if(node.nodeValue.match(/[^a-zA-Z0-9\s]The Anthropic Team/)) {
//               node.nodeValue = node.nodeValue.replace(/[^a-zA-Z0-9\s]The Anthropic Team/, '—The Anthropic Team');
//             } else if(node.nodeValue.trim() === 'The Anthropic Team' && node.previousSibling) {
//               // Check if previous node might contain the problematic character
//               const prevNode = node.previousSibling;
//               if(prevNode.nodeType === Node.TEXT_NODE && prevNode.nodeValue.trim().endsWith('â')) {
//                 prevNode.nodeValue = prevNode.nodeValue.replace(/â\s*$/, '—');
//               }
//             }
//           });
//         };
        
//         // Find text nodes with â characters
//         const fixDashesInText = function() {
//           const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
//           const nodesToFix = [];
//           let node;
          
//           while(node = walker.nextNode()) {
//             if(node.nodeValue && node.nodeValue.includes('â')) {
//               nodesToFix.push(node);
//             }
//           }
          
//           nodesToFix.forEach(node => {
//             node.nodeValue = node.nodeValue
//               .replace(/â[\u25A1\u25A0\u2610\u2611\u2612]{1,2}/g, '—')
//               .replace(/â\u00A0\u00A0/g, '—')
//               .replace(/â\u00A0/g, '—')
//               .replace(/â□□/g, '—')
//               .replace(/â□/g, '—')
//               .replace(/â[\u2000-\u2FFF]{1,2}/g, '—')
//               .replace(/â[^\w\s.,;:!?'"]/g, '—')
//               .replace(/â/g, '—'); // Super aggressive - any remaining â becomes em dash
//           });
//         };
        
//         // Apply fixes
//         anthropicTeamFix();
//         fixDashesInText();
        
//         // If we're dealing with any text containing âThe Anthropic Team
//         document.body.innerHTML = document.body.innerHTML.replace(/â[^\w]*The Anthropic Team/g, '—The Anthropic Team');
//       });
//     </script>
//   `);
  
//   return html;
// }

// /**
//  * Extracts plain text from HTML content
//  */
// export function extractTextFromHtml(html: string): string {
//   // First fix common encoding issues
//   const fixedHtml = fixEncodingIssues(html);
  
//   // Client-side only function
//   if (typeof window === 'undefined') {
//     // Server-side fallback (more comprehensive than before)
//     return fixedHtml
//       .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
//       .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
//       .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
//       .replace(/<[^>]*>/g, ' ') // Replace tags with space to avoid text squashing
//       .replace(/&nbsp;/g, ' ')
//       .replace(/&amp;/g, '&')
//       .replace(/&lt;/g, '<')
//       .replace(/&gt;/g, '>')
//       .replace(/&quot;/g, '"')
//       .replace(/&#39;/g, "'")
//       .replace(/\s+/g, ' ') // Collapse multiple spaces
//       .trim();
//   }

//   try {
//     // Use DOM methods for client-side (more accurate)
//     const tempDiv = document.createElement('div');
//     tempDiv.innerHTML = fixedHtml;
    
//     // Remove style, script, head tags to avoid including their content
//     const elementsToRemove = tempDiv.querySelectorAll('style, script, head, meta, link');
//     elementsToRemove.forEach(el => el.remove());
    
//     // Get text and clean up whitespace
//     const text = (tempDiv.textContent || tempDiv.innerText || '').trim();
//     // Apply final text cleanups
//     return fixEncodingIssues(text.replace(/\s+/g, ' '));
//   } catch (e) {
//     console.error('Error extracting text from HTML:', e);
//     return fixEncodingIssues(fixedHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
//   }
// }

// /**
//  * Creates a preview of email content
//  * @param content Raw email content
//  * @param maxLength Maximum length for the preview
//  * @returns A shortened text preview with no HTML
//  */
// export function createEmailPreview(content: string | undefined, maxLength: number = 100): string {
//   if (!content) return '';
  
//   // Apply encoding fixes first - this will now handle all dash issues including "â□□"
//   content = fixEncodingIssues(content);
  
//   // Quick check for quoted-printable encoding (like =3D)
//   const hasQuotedPrintable = content.includes('=3D') || content.includes('=0A') || content.includes('=20');
  
//   if (typeof window === 'undefined') {
//     // Server-side rendering, use enhanced extraction
//     let strippedContent;
    
//     if (hasQuotedPrintable) {
//       // Handle quoted-printable encoding
//       const decodedContent = decodeQuotedPrintable(content);
//       strippedContent = decodedContent
//         .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
//         .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
//         .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
//         .replace(/<[^>]*>/g, ' ')
//         .replace(/&nbsp;/g, ' ')
//         .replace(/\s+/g, ' ')
//         .trim();
//     } else {
//       // Standard extraction
//       strippedContent = content
//         .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
//         .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
//         .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
//         .replace(/<[^>]*>/g, ' ')
//         .replace(/&nbsp;/g, ' ')
//         .replace(/\s+/g, ' ')
//         .trim();
//     }
    
//     // Apply encoding fixes again after stripping to catch any missed patterns
//     strippedContent = fixEncodingIssues(strippedContent);
    
//     return strippedContent.substring(0, maxLength) + 
//       (strippedContent.length > maxLength ? '...' : '');
//   }

//   // Process the content with our enhanced processor
//   const { plainTextVersion } = processEmailContent(content);
  
//   // Create preview with limited length
//   return plainTextVersion.substring(0, maxLength) + 
//     (plainTextVersion.length > maxLength ? '...' : '');
// }

// /**
//  * React component to render email content appropriately with auto height adjustment
//  * Fixed to follow React hooks rules by moving all hooks to top level
//  */
// export const EmailContentRenderer: React.FC<{ content?: string }> = ({ content }) => {
//   const iframeRef = useRef<HTMLIFrameElement>(null);
//   const [iframeHeight, setIframeHeight] = useState(400);
  
//   // ✅ FIXED: Move all hooks to top level - don't call conditionally
//   const { processedContent, contentType, plainTextVersion } = content ? processEmailContent(content) : {
//     processedContent: '',
//     contentType: 'text' as const,
//     plainTextVersion: ''
//   };
  
//   // ✅ FIXED: Always call useEffect, but conditionally execute logic inside
//   useEffect(() => {
//     // Only execute iframe height adjustment if we have HTML content
//     if (contentType === 'html' && iframeRef.current && processedContent) {
//       const adjustHeight = () => {
//         try {
//           const iframe = iframeRef.current;
//           if (iframe && iframe.contentWindow) {
//             const height = iframe.contentWindow.document.body.scrollHeight;
//             setIframeHeight(Math.max(400, height + 20)); // Min height 400px
//           }
//         } catch (e) {
//           console.error('Error adjusting iframe height:', e);
//         }
//       };
      
//       // Set up event listener for iframe load
//       const iframe = iframeRef.current;
//       iframe.onload = adjustHeight;
      
//       // Clean up on unmount
//       return () => {
//         if (iframe) iframe.onload = null;
//       };
//     }
    
//     // Return empty cleanup function if no iframe setup needed
//     return () => {};
//   }, [contentType, processedContent]); // Include dependencies
  
//   // Early return after all hooks have been called
//   if (!content) return null;
  
//   if (contentType === 'html') {
//     return (
//       <div className="email-html-container relative w-full">
//         <iframe 
//           ref={iframeRef}
//           srcDoc={processedContent}
//           title="Email Content"
//           style={{ height: `${iframeHeight}px` }}
//           className="w-full border-0"
//           sandbox="allow-same-origin"
//         />
//       </div>
//     );
//   } else {
//     return (
//       <div className="whitespace-pre-wrap">
//         {processedContent}
//       </div>
//     );
//   }
// };












































// "use client";

// import React from 'react';

// /**
//  * Utility functions for processing and displaying email content
//  * Handles both HTML content and MIME multipart messages
//  */

// /**
//  * Identifies and processes different email content formats
//  * @param content The raw email content
//  * @returns Processed content with content type information
//  */
// export function processEmailContent(content: string | undefined): {
//   processedContent: string;
//   contentType: 'html' | 'text' | 'mime';
//   plainTextVersion: string;
// } {
//   if (!content) {
//     return {
//       processedContent: '',
//       contentType: 'text',
//       plainTextVersion: ''
//     };
//   }

//   // Check for MIME multipart format
//   if (content.includes('Content-Type: text/plain') || content.includes('Content-Type: text/html')) {
//     const { htmlContent, plainText } = extractMimeContent(content);
    
//     // If we have HTML content in the MIME message, use that
//     if (htmlContent) {
//       return {
//         processedContent: htmlContent,
//         contentType: 'html',
//         plainTextVersion: plainText || extractTextFromHtml(htmlContent)
//       };
//     } else if (plainText) {
//       return {
//         processedContent: plainText,
//         contentType: 'text',
//         plainTextVersion: plainText
//       };
//     }
//   }

//   // Check for HTML content
//   if (
//     content.includes('<!DOCTYPE html>') || 
//     content.includes('<html>') || 
//     content.includes('<div') ||
//     content.includes('<p>') ||
//     content.includes('<body')
//   ) {
//     return {
//       processedContent: content,
//       contentType: 'html',
//       plainTextVersion: extractTextFromHtml(content)
//     };
//   }

//   // Default to plain text
//   return {
//     processedContent: content,
//     contentType: 'text',
//     plainTextVersion: content
//   };
// }

// /**
//  * Extracts plain text and HTML parts from MIME multipart messages
//  */
// function extractMimeContent(content: string): { htmlContent: string; plainText: string } {
//   let htmlContent = '';
//   let plainText = '';

//   // Extract plain text part if it exists
//   const plainTextMatch = content.match(/Content-Type: text\/plain.*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$)/i);
//   if (plainTextMatch && plainTextMatch[1]) {
//     plainText = plainTextMatch[1].trim();
//   }

//   // Extract HTML part if it exists
//   const htmlMatch = content.match(/Content-Type: text\/html.*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$)/i);
//   if (htmlMatch && htmlMatch[1]) {
//     htmlContent = htmlMatch[1].trim();
//   }

//   return { htmlContent, plainText };
// }

// /**
//  * Extracts plain text from HTML content
//  */
// export function extractTextFromHtml(html: string): string {
//   // Client-side only function
//   if (typeof window === 'undefined') {
//     // Simple server-side fallback (less accurate)
//     return html
//       .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
//       .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
//       .replace(/<[^>]*>/g, '')
//       .replace(/&nbsp;/g, ' ')
//       .replace(/&amp;/g, '&')
//       .replace(/&lt;/g, '<')
//       .replace(/&gt;/g, '>')
//       .replace(/&quot;/g, '"')
//       .replace(/&#39;/g, "'")
//       .trim();
//   }

//   try {
//     // Use DOM methods for client-side (more accurate)
//     const tempDiv = document.createElement('div');
//     tempDiv.innerHTML = html;
    
//     // Remove style and script tags to avoid including their content
//     const styleScripts = tempDiv.querySelectorAll('style, script');
//     styleScripts.forEach(el => el.remove());
    
//     return (tempDiv.textContent || tempDiv.innerText || '').trim();
//   } catch (e) {
//     console.error('Error extracting text from HTML:', e);
//     return html.replace(/<[^>]*>/g, '').trim();
//   }
// }

// /**
//  * Creates a preview of email content
//  * @param content Raw email content
//  * @param maxLength Maximum length for the preview
//  * @returns A shortened text preview with no HTML
//  */
// export function createEmailPreview(content: string | undefined, maxLength: number = 100): string {
//   if (!content) return '';
  
//   if (typeof window === 'undefined') {
//     // Server-side rendering, use simpler extraction
//     const strippedContent = content
//       .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
//       .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
//       .replace(/<[^>]*>/g, '')
//       .replace(/&nbsp;/g, ' ')
//       .replace(/\s+/g, ' ')
//       .trim();
    
//     return strippedContent.substring(0, maxLength) + 
//       (strippedContent.length > maxLength ? '...' : '');
//   }

//   // Process the content
//   const { plainTextVersion } = processEmailContent(content);
  
//   // Create preview with limited length
//   return plainTextVersion.substring(0, maxLength) + 
//     (plainTextVersion.length > maxLength ? '...' : '');
// }

// /**
//  * React component to render email content appropriately
//  */
// export const EmailContentRenderer: React.FC<{ content?: string }> = ({ content }) => {
//   if (!content) return null;
  
//   const { processedContent, contentType } = processEmailContent(content);
  
//   if (contentType === 'html') {
//     return (
//       <div className="email-html-container relative w-full">
//         <iframe 
//           srcDoc={processedContent}
//           title="Email Content"
//           className="w-full min-h-[400px] border-0"
//           sandbox="allow-same-origin"
//         />
//       </div>
//     );
//   } else {
//     return (
//       <div className="whitespace-pre-wrap">
//         {processedContent}
//       </div>
//     );
//   }
// };