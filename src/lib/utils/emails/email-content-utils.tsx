"use client";

import React from 'react';

/**
 * Utility functions for processing and displaying email content
 * Handles both HTML content and MIME multipart messages
 */

/**
 * Identifies and processes different email content formats
 * @param content The raw email content
 * @returns Processed content with content type information
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

  // Check for MIME multipart format
  if (content.includes('Content-Type: text/plain') || content.includes('Content-Type: text/html')) {
    const { htmlContent, plainText } = extractMimeContent(content);
    
    // If we have HTML content in the MIME message, use that
    if (htmlContent) {
      return {
        processedContent: htmlContent,
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

  // Check for HTML content
  if (
    content.includes('<!DOCTYPE html>') || 
    content.includes('<html>') || 
    content.includes('<div') ||
    content.includes('<p>') ||
    content.includes('<body')
  ) {
    return {
      processedContent: content,
      contentType: 'html',
      plainTextVersion: extractTextFromHtml(content)
    };
  }

  // Default to plain text
  return {
    processedContent: content,
    contentType: 'text',
    plainTextVersion: content
  };
}

/**
 * Extracts plain text and HTML parts from MIME multipart messages
 */
function extractMimeContent(content: string): { htmlContent: string; plainText: string } {
  let htmlContent = '';
  let plainText = '';

  // Extract plain text part if it exists
  const plainTextMatch = content.match(/Content-Type: text\/plain.*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$)/i);
  if (plainTextMatch && plainTextMatch[1]) {
    plainText = plainTextMatch[1].trim();
  }

  // Extract HTML part if it exists
  const htmlMatch = content.match(/Content-Type: text\/html.*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n$)/i);
  if (htmlMatch && htmlMatch[1]) {
    htmlContent = htmlMatch[1].trim();
  }

  return { htmlContent, plainText };
}

/**
 * Extracts plain text from HTML content
 */
export function extractTextFromHtml(html: string): string {
  // Client-side only function
  if (typeof window === 'undefined') {
    // Simple server-side fallback (less accurate)
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  try {
    // Use DOM methods for client-side (more accurate)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove style and script tags to avoid including their content
    const styleScripts = tempDiv.querySelectorAll('style, script');
    styleScripts.forEach(el => el.remove());
    
    return (tempDiv.textContent || tempDiv.innerText || '').trim();
  } catch (e) {
    console.error('Error extracting text from HTML:', e);
    return html.replace(/<[^>]*>/g, '').trim();
  }
}

/**
 * Creates a preview of email content
 * @param content Raw email content
 * @param maxLength Maximum length for the preview
 * @returns A shortened text preview with no HTML
 */
export function createEmailPreview(content: string | undefined, maxLength: number = 100): string {
  if (!content) return '';
  
  if (typeof window === 'undefined') {
    // Server-side rendering, use simpler extraction
    const strippedContent = content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return strippedContent.substring(0, maxLength) + 
      (strippedContent.length > maxLength ? '...' : '');
  }

  // Process the content
  const { plainTextVersion } = processEmailContent(content);
  
  // Create preview with limited length
  return plainTextVersion.substring(0, maxLength) + 
    (plainTextVersion.length > maxLength ? '...' : '');
}

/**
 * React component to render email content appropriately
 */
export const EmailContentRenderer: React.FC<{ content?: string }> = ({ content }) => {
  if (!content) return null;
  
  const { processedContent, contentType } = processEmailContent(content);
  
  if (contentType === 'html') {
    return (
      <div className="email-html-container relative w-full">
        <iframe 
          srcDoc={processedContent}
          title="Email Content"
          className="w-full min-h-[400px] border-0"
          sandbox="allow-same-origin"
        />
      </div>
    );
  } else {
    return (
      <div className="whitespace-pre-wrap">
        {processedContent}
      </div>
    );
  }
};