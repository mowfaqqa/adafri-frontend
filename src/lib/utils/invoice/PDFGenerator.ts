import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { DocumentData } from '@/lib/types/invoice/types';

export interface PDFGenerationOptions {
  filename?: string;
  quality?: number;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

export class PDFGenerator {
  private static defaultOptions: PDFGenerationOptions = {
    quality: 1.0,
    format: 'a4',
    orientation: 'portrait'
  };

  /**
   * Generate PDF from HTML element with proper CSS handling
   */
  static async generateFromElement(
    element: HTMLElement,
    document: DocumentData,
    options: PDFGenerationOptions = {}
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    const filename = opts.filename || this.generateFilename(document);

    try {
      // Wait for fonts and images to load
      await this.waitForAssets();

      // Create a clone of the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Apply inline styles to ensure proper rendering
      await this.inlineStyles(clonedElement);

      // Create a temporary container with proper styling
      const tempContainer = window.document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '794px'; // A4 width in pixels at 96 DPI
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      tempContainer.appendChild(clonedElement);
      
      if (window.document.body) {
        window.document.body.appendChild(tempContainer);
      }

      try {
        // Configure html2canvas with optimized settings
        const canvas = await html2canvas(clonedElement, {
          scale: 2, // Higher resolution
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          removeContainer: false,
          foreignObjectRendering: true,
          width: 794, // A4 width
          height: clonedElement.scrollHeight,
          windowWidth: 794,
          windowHeight: clonedElement.scrollHeight,
          onclone: (clonedDoc: Document) => {
            // Ensure Tailwind CSS is available in cloned document
            this.ensureTailwindInClone(clonedDoc);
          }
        });

        // Create PDF
        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // PDF dimensions (A4 in points: 595 x 842)
        const pdfWidth = opts.format === 'a4' ? 595 : 612;
        const pdfHeight = opts.format === 'a4' ? 842 : 792;

        const pdf = new jsPDF({
          orientation: opts.orientation,
          unit: 'pt',
          format: opts.format
        });

        // Calculate scaling to fit content
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;

        // Center the content
        const x = (pdfWidth - scaledWidth) / 2;
        const y = 20; // Small margin from top

        // Handle multi-page content
        if (scaledHeight > pdfHeight - 40) {
          await this.addMultiPageContent(pdf, imgData, scaledWidth, scaledHeight, pdfWidth, pdfHeight);
        } else {
          pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
        }

        // Add metadata
        pdf.setProperties({
          title: `${document.type.toUpperCase()} ${document.invoiceNumber}`,
          subject: `${document.type === 'invoice' ? 'Invoice' : 'Quote'} for ${document.toCompany}`,
          author: document.companyInfo.name,
          creator: 'Invoice System',
          keywords: `${document.type}, ${document.invoiceNumber}, ${document.toCompany}`
        });

        // Save the PDF
        pdf.save(filename);
        return filename;

      } finally {
        // Clean up
        if (window.document.body && tempContainer.parentNode) {
          window.document.body.removeChild(tempContainer);
        }
      }

    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error('Failed to generate PDF. Please try again.');
    }
  }

  /**
   * Add multi-page content to PDF
   */
  private static async addMultiPageContent(
    pdf: jsPDF,
    imgData: string,
    imgWidth: number,
    imgHeight: number,
    pdfWidth: number,
    pdfHeight: number
  ): Promise<void> {
    const pageHeight = pdfHeight - 40; // Account for margins
    const totalPages = Math.ceil(imgHeight / pageHeight);

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      const yOffset = -i * pageHeight;
      const x = (pdfWidth - imgWidth) / 2;
      
      pdf.addImage(
        imgData,
        'PNG',
        x,
        yOffset + 20,
        imgWidth,
        imgHeight
      );
    }
  }

  /**
   * Ensure Tailwind CSS is available in cloned document
   */
  private static ensureTailwindInClone(clonedDoc: Document): void {
    // Add Tailwind CSS if not present
    const tailwindLink = clonedDoc.querySelector('link[href*="tailwind"]');
    if (!tailwindLink) {
      const link = clonedDoc.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.tailwindcss.com';
      clonedDoc.head.appendChild(link);
    }

    // Add custom styles for better PDF rendering
    const style = clonedDoc.createElement('style');
    style.textContent = `
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }
      .bg-gradient-to-r, .bg-gradient-to-br {
        background: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to)) !important;
      }
      .from-blue-600 { --tw-gradient-from: #2563eb !important; }
      .to-purple-600 { --tw-gradient-to: #9333ea !important; }
      .to-indigo-600 { --tw-gradient-to: #4f46e5 !important; }
      .from-blue-50 { --tw-gradient-from: #eff6ff !important; }
      .to-indigo-100 { --tw-gradient-to: #e0e7ff !important; }
      .text-transparent { color: transparent !important; }
      .bg-clip-text { -webkit-background-clip: text !important; background-clip: text !important; }
    `;
    clonedDoc.head.appendChild(style);
  }

  /**
   * Apply inline styles to element to ensure proper rendering
   */
  private static async inlineStyles(element: HTMLElement): Promise<void> {
    const allElements = element.querySelectorAll('*');
    
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlEl);
      
      // Apply critical styles inline
      const importantStyles = [
        'color', 'backgroundColor', 'fontSize', 'fontWeight', 'fontFamily',
        'padding', 'margin', 'border', 'borderRadius', 'display', 'width',
        'height', 'textAlign', 'lineHeight', 'boxShadow', 'background'
      ];
      
      importantStyles.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        if (value && value !== 'initial') {
          htmlEl.style.setProperty(prop, value, 'important');
        }
      });

      // Handle gradient backgrounds specifically
      if (htmlEl.classList.contains('bg-gradient-to-r') || htmlEl.classList.contains('bg-gradient-to-br')) {
        if (htmlEl.classList.contains('from-blue-600') && htmlEl.classList.contains('to-purple-600')) {
          htmlEl.style.setProperty('background', 'linear-gradient(to right, #2563eb, #9333ea)', 'important');
        }
        if (htmlEl.classList.contains('from-blue-600') && htmlEl.classList.contains('to-indigo-600')) {
          htmlEl.style.setProperty('background', 'linear-gradient(to right, #2563eb, #4f46e5)', 'important');
        }
        if (htmlEl.classList.contains('from-blue-50') && htmlEl.classList.contains('to-indigo-100')) {
          htmlEl.style.setProperty('background', 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)', 'important');
        }
        if (htmlEl.classList.contains('from-indigo-600') && htmlEl.classList.contains('to-blue-600')) {
          htmlEl.style.setProperty('background', 'linear-gradient(to right, #4338ca, #2563eb)', 'important');
        }
      }
    });
  }

  /**
   * Wait for fonts and images to load
   */
  private static async waitForAssets(): Promise<void> {
    // Wait for fonts
    if ('fonts' in window.document) {
      await window.document.fonts.ready;
    }

    // Wait for images
    const images = window.document.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });

    await Promise.all(imagePromises);
    
    // Additional wait to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Generate optimized text-based PDF (smaller file size)
   */
  static async generateOptimizedPDF(
    element: HTMLElement,
    documentData: DocumentData,
    options: PDFGenerationOptions = {}
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    const filename = opts.filename || this.generateFilename(documentData);

    try {
      const pdf = new jsPDF({
        orientation: opts.orientation,
        unit: 'mm',
        format: opts.format === 'a4' ? 'a4' : 'letter'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 30;

      // Colors (RGB values)
      const primaryColor: [number, number, number] = [37, 99, 235]; // Blue-600
      const secondaryColor: [number, number, number] = [99, 102, 241]; // Indigo-500
      const textColor: [number, number, number] = [31, 41, 55]; // Gray-900
      const lightGray: [number, number, number] = [156, 163, 175]; // Gray-400

      // Header
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(documentData.companyInfo.name, margin, 20);
      
      pdf.setFontSize(16);
      pdf.text(`${documentData.type.toUpperCase()}`, pageWidth - margin, 15, { align: 'right' });
      pdf.setFontSize(12);
      pdf.text(`#${documentData.invoiceNumber}`, pageWidth - margin, 25, { align: 'right' });
      pdf.text(new Date(documentData.date).toLocaleDateString(), pageWidth - margin, 35, { align: 'right' });

      yPos = 60;

      // Company Information
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FROM:', margin, yPos);
      pdf.text('BILL TO:', pageWidth / 2 + margin, yPos);

      pdf.setFont('helvetica', 'normal');
      yPos += 8;

      // From section
      pdf.setFont('helvetica', 'bold');
      pdf.text(documentData.companyInfo.name, margin, yPos);
      pdf.setFont('helvetica', 'normal');
      
      const fromLines = documentData.companyInfo.address.split('\n');
      fromLines.forEach((line) => {
        yPos += 5;
        pdf.text(line, margin, yPos);
      });
      yPos += 5;
      pdf.text(documentData.companyInfo.email, margin, yPos);
      yPos += 5;
      pdf.text(documentData.companyInfo.phone, margin, yPos);

      // To section
      let toYPos = 68;
      pdf.setFont('helvetica', 'bold');
      pdf.text(documentData.toCompany, pageWidth / 2 + margin, toYPos);
      pdf.setFont('helvetica', 'normal');
      
      toYPos += 5;
      pdf.text(documentData.toContact, pageWidth / 2 + margin, toYPos);
      
      const toLines = documentData.toAddress.split('\n');
      toLines.forEach((line) => {
        toYPos += 5;
        pdf.text(line, pageWidth / 2 + margin, toYPos);
      });
      toYPos += 5;
      pdf.text(documentData.toEmail, pageWidth / 2 + margin, toYPos);

      yPos = Math.max(yPos, toYPos) + 20;

      // Items table
      const colWidths = [80, 25, 35, 35];
      const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

      // Table header
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('DESCRIPTION', colPositions[0] + 2, yPos);
      pdf.text('QTY', colPositions[1] + 2, yPos);
      pdf.text('PRICE', colPositions[2] + 2, yPos);
      pdf.text('TOTAL', colPositions[3] + 2, yPos);

      yPos += 10;

      // Table content
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.setFont('helvetica', 'normal');
      
      documentData.items.forEach((item, index) => {
        if (index % 2 === 0) {
          pdf.setFillColor(248, 250, 252); // Gray-50
          pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
        }

        const description = item.description.length > 40 ? item.description.substring(0, 37) + '...' : item.description;
        pdf.text(description, colPositions[0] + 2, yPos);
        pdf.text(item.quantity.toString(), colPositions[1] + 2, yPos);
        pdf.text(`$${item.unitPrice.toFixed(2)}`, colPositions[2] + 2, yPos);
        pdf.text(`$${item.total.toFixed(2)}`, colPositions[3] + 2, yPos);
        
        yPos += 8;
      });

      // Totals section
      yPos += 10;
      const totalsX = pageWidth - 60;

      pdf.setFont('helvetica', 'normal');
      pdf.text(`Subtotal:`, totalsX - 30, yPos);
      pdf.text(`$${documentData.subtotal.toFixed(2)}`, totalsX, yPos, { align: 'right' });

      if (documentData.discountAmount > 0) {
        yPos += 6;
        pdf.setTextColor(220, 38, 38); // Red-600
        pdf.text(`Discount (${documentData.discountRate}%):`, totalsX - 30, yPos);
        pdf.text(`-$${documentData.discountAmount.toFixed(2)}`, totalsX, yPos, { align: 'right' });
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      }

      yPos += 6;
      pdf.text(`Tax (${documentData.taxRate}%):`, totalsX - 30, yPos);
      pdf.text(`$${documentData.taxAmount.toFixed(2)}`, totalsX, yPos, { align: 'right' });

      yPos += 10;
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(totalsX - 35, yPos - 8, 40, 12, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`TOTAL`, totalsX - 30, yPos);
      pdf.text(`$${documentData.total.toFixed(2)}`, totalsX, yPos, { align: 'right' });

      // Notes and Terms
      if (documentData.notes || documentData.terms) {
        yPos += 25;
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);

        if (documentData.notes) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('NOTES:', margin, yPos);
          pdf.setFont('helvetica', 'normal');
          yPos += 5;
          const noteLines = pdf.splitTextToSize(documentData.notes, pageWidth - 2 * margin);
          pdf.text(noteLines, margin, yPos);
          yPos += noteLines.length * 4 + 5;
        }

        if (documentData.terms) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('TERMS & CONDITIONS:', margin, yPos);
          pdf.setFont('helvetica', 'normal');
          yPos += 5;
          const termLines = pdf.splitTextToSize(documentData.terms, pageWidth - 2 * margin);
          pdf.text(termLines, margin, yPos);
        }
      }

      // Add metadata
      pdf.setProperties({
        title: `${documentData.type.toUpperCase()} ${documentData.invoiceNumber}`,
        subject: `${documentData.type === 'invoice' ? 'Invoice' : 'Quote'} for ${documentData.toCompany}`,
        author: documentData.companyInfo.name,
        creator: 'Invoice System'
      });

      pdf.save(filename);
      return filename;

    } catch (error) {
      console.error('Optimized PDF generation failed:', error);
      throw new Error('Failed to generate PDF. Please try again.');
    }
  }

  /**
   * Generate filename for the document
   */
  private static generateFilename(documentData: DocumentData): string {
    const type = documentData.type.toUpperCase();
    const number = documentData.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-');
    const company = documentData.toCompany.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20);
    const date = new Date(documentData.date).toISOString().split('T')[0];
    
    return `${type}-${number}-${company}-${date}.pdf`;
  }
}


























// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import type { DocumentData } from '@/lib/types/invoice/types';

// export interface PDFGenerationOptions {
//   filename?: string;
//   quality?: number;
//   format?: 'a4' | 'letter';
//   orientation?: 'portrait' | 'landscape';
// }

// export class PDFGenerator {
//   private static defaultOptions: PDFGenerationOptions = {
//     quality: 1.0,
//     format: 'a4',
//     orientation: 'portrait'
//   };

//   /**
//    * Generate PDF from HTML element
//    */
//   static async generateFromElement(
//     element: HTMLElement,
//     document: DocumentData,
//     options: PDFGenerationOptions = {}
//   ): Promise<string> {
//     const opts = { ...this.defaultOptions, ...options };
//     const filename = opts.filename || this.generateFilename(document);

//     try {
//       // Configure html2canvas options for better quality
//       const canvas = await html2canvas(element, {
//         scale: 2, // Higher scale for better quality
//         useCORS: true,
//         allowTaint: true,
//         backgroundColor: '#ffffff',
//         logging: false,
//         height: element.scrollHeight,
//         width: element.scrollWidth
//       });

//       // Calculate dimensions
//       const imgData = canvas.toDataURL('image/png', opts.quality);
//       const imgWidth = canvas.width;
//       const imgHeight = canvas.height;

//       // Create PDF with appropriate page size
//       const pdf = new jsPDF({
//         orientation: opts.orientation,
//         unit: 'px',
//         format: opts.format === 'a4' ? [595, 842] : [612, 792] // A4 or Letter in pixels at 72 DPI
//       });

//       // Get PDF dimensions
//       const pdfWidth = pdf.internal.pageSize.getWidth();
//       const pdfHeight = pdf.internal.pageSize.getHeight();

//       // Calculate scaling to fit the content
//       const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
//       const scaledWidth = imgWidth * ratio;
//       const scaledHeight = imgHeight * ratio;

//       // Center the content
//       const x = (pdfWidth - scaledWidth) / 2;
//       const y = (pdfHeight - scaledHeight) / 2;

//       // Add image to PDF
//       pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);

//       // Add metadata
//       pdf.setProperties({
//         title: `${document.type.toUpperCase()} ${document.invoiceNumber}`,
//         subject: `${document.type === 'invoice' ? 'Invoice' : 'Quote'} for ${document.toCompany}`,
//         author: document.companyInfo.name,
//         creator: 'Invoice System'
//       });

//       // Save the PDF
//       pdf.save(filename);

//       return filename;
//     } catch (error) {
//       console.error('PDF generation failed:', error);
//       throw new Error('Failed to generate PDF. Please try again.');
//     }
//   }

//   /**
//    * Generate PDF with multiple pages if content is too long
//    */
//   static async generateMultiPageFromElement(
//     element: HTMLElement,
//     document: DocumentData,
//     options: PDFGenerationOptions = {}
//   ): Promise<string> {
//     const opts = { ...this.defaultOptions, ...options };
//     const filename = opts.filename || this.generateFilename(document);

//     try {
//       const canvas = await html2canvas(element, {
//         scale: 2,
//         useCORS: true,
//         allowTaint: true,
//         backgroundColor: '#ffffff',
//         logging: false,
//         height: element.scrollHeight,
//         width: element.scrollWidth
//       });

//       const imgData = canvas.toDataURL('image/png', opts.quality);
//       const imgWidth = canvas.width;
//       const imgHeight = canvas.height;

//       const pdf = new jsPDF({
//         orientation: opts.orientation,
//         unit: 'px',
//         format: opts.format === 'a4' ? [595, 842] : [612, 792]
//       });

//       const pdfWidth = pdf.internal.pageSize.getWidth();
//       const pdfHeight = pdf.internal.pageSize.getHeight();

//       // Calculate how many pages we need
//       const ratio = pdfWidth / imgWidth;
//       const scaledHeight = imgHeight * ratio;
//       const pageHeight = pdfHeight;
//       const totalPages = Math.ceil(scaledHeight / pageHeight);

//       for (let i = 0; i < totalPages; i++) {
//         if (i > 0) {
//           pdf.addPage();
//         }

//         const yOffset = -i * pageHeight;
//         pdf.addImage(
//           imgData,
//           'PNG',
//           0,
//           yOffset,
//           pdfWidth,
//           scaledHeight
//         );
//       }

//       // Add metadata
//       pdf.setProperties({
//         title: `${document.type.toUpperCase()} ${document.invoiceNumber}`,
//         subject: `${document.type === 'invoice' ? 'Invoice' : 'Quote'} for ${document.toCompany}`,
//         author: document.companyInfo.name,
//         creator: 'Invoice System'
//       });

//       pdf.save(filename);
//       return filename;
//     } catch (error) {
//       console.error('Multi-page PDF generation failed:', error);
//       throw new Error('Failed to generate PDF. Please try again.');
//     }
//   }

//   /**
//    * Generate optimized PDF with text extraction (better quality and smaller file size)
//    */
//   static async generateOptimizedPDF(
//     element: HTMLElement,
//     document: DocumentData,
//     options: PDFGenerationOptions = {}
//   ): Promise<string> {
//     const opts = { ...this.defaultOptions, ...options };
//     const filename = opts.filename || this.generateFilename(document);

//     try {
//       // Create PDF
//       const pdf = new jsPDF({
//         orientation: opts.orientation,
//         unit: 'mm',
//         format: opts.format === 'a4' ? 'a4' : 'letter'
//       });

//       // Add company header
//       pdf.setFontSize(20);
//       pdf.setFont('helvetica', 'bold');
//       pdf.text(document.companyInfo.name, 20, 25);

//       // Add document title
//       pdf.setFontSize(16);
//       pdf.text(`${document.type.toUpperCase()} #${document.invoiceNumber}`, 20, 40);

//       // Add basic info
//       pdf.setFontSize(10);
//       pdf.setFont('helvetica', 'normal');
      
//       let yPos = 55;
//       const lineHeight = 5;

//       // Company info
//       pdf.text('From:', 20, yPos);
//       pdf.text(document.companyInfo.name, 20, yPos + lineHeight);
//       pdf.text(document.companyInfo.address.replace('\n', ', '), 20, yPos + lineHeight * 2);
//       pdf.text(document.companyInfo.email, 20, yPos + lineHeight * 3);

//       // Client info
//       pdf.text('To:', 110, yPos);
//       pdf.text(document.toCompany, 110, yPos + lineHeight);
//       pdf.text(document.toContact, 110, yPos + lineHeight * 2);
//       pdf.text(document.toAddress.replace('\n', ', '), 110, yPos + lineHeight * 3);

//       yPos += lineHeight * 5 + 10;

//       // Items table
//       pdf.setFontSize(8);
//       pdf.setFont('helvetica', 'bold');
      
//       // Table headers
//       pdf.text('Description', 20, yPos);
//       pdf.text('Qty', 120, yPos);
//       pdf.text('Price', 140, yPos);
//       pdf.text('Total', 160, yPos);
      
//       yPos += lineHeight;
//       pdf.line(20, yPos, 180, yPos); // Header line
//       yPos += 3;

//       // Table content
//       pdf.setFont('helvetica', 'normal');
//       document.items.forEach((item) => {
//         pdf.text(item.description.substring(0, 50), 20, yPos);
//         pdf.text(item.quantity.toString(), 120, yPos);
//         pdf.text(`$${item.unitPrice.toFixed(2)}`, 140, yPos);
//         pdf.text(`$${item.total.toFixed(2)}`, 160, yPos);
//         yPos += lineHeight;
//       });

//       yPos += 5;
//       pdf.line(20, yPos, 180, yPos); // Bottom line

//       // Totals
//       yPos += 10;
//       pdf.text(`Subtotal: $${document.subtotal.toFixed(2)}`, 140, yPos);
//       if (document.discountAmount > 0) {
//         yPos += lineHeight;
//         pdf.text(`Discount: -$${document.discountAmount.toFixed(2)}`, 140, yPos);
//       }
//       yPos += lineHeight;
//       pdf.text(`Tax: $${document.taxAmount.toFixed(2)}`, 140, yPos);
//       yPos += lineHeight;
//       pdf.setFont('helvetica', 'bold');
//       pdf.text(`Total: $${document.total.toFixed(2)}`, 140, yPos);

//       // Notes and terms
//       if (document.notes || document.terms) {
//         yPos += 15;
//         pdf.setFont('helvetica', 'normal');
//         pdf.setFontSize(8);
        
//         if (document.notes) {
//           pdf.text('Notes:', 20, yPos);
//           yPos += lineHeight;
//           const noteLines = pdf.splitTextToSize(document.notes, 160);
//           pdf.text(noteLines, 20, yPos);
//           yPos += noteLines.length * lineHeight + 5;
//         }
        
//         if (document.terms) {
//           pdf.text('Terms & Conditions:', 20, yPos);
//           yPos += lineHeight;
//           const termLines = pdf.splitTextToSize(document.terms, 160);
//           pdf.text(termLines, 20, yPos);
//         }
//       }

//       // Add metadata
//       pdf.setProperties({
//         title: `${document.type.toUpperCase()} ${document.invoiceNumber}`,
//         subject: `${document.type === 'invoice' ? 'Invoice' : 'Quote'} for ${document.toCompany}`,
//         author: document.companyInfo.name,
//         creator: 'Invoice System'
//       });

//       pdf.save(filename);
//       return filename;
//     } catch (error) {
//       console.error('Optimized PDF generation failed:', error);
//       throw new Error('Failed to generate PDF. Please try again.');
//     }
//   }

//   /**
//    * Generate filename for the document
//    */
//   private static generateFilename(document: DocumentData): string {
//     const type = document.type.toUpperCase();
//     const number = document.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-');
//     const company = document.toCompany.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20);
//     const date = new Date(document.date).toISOString().split('T')[0];
    
//     return `${type}-${number}-${company}-${date}.pdf`;
//   }
// }