
"use client";

import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
// import { createDocxPreviewFromUrl } from "docx-preview";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { downloadSignedDocument } from "@/lib/utils/e-signature/utils";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export function DocumentViewer({
  documentUrl,
  documentTitle,
  documentType,
}: any) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const docxContainerRef = React.useRef<any>(null);

  const isPdf =
    documentType === "application/pdf" ||
    documentUrl?.toLowerCase().endsWith(".pdf");
  const isDocx =
    documentType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    documentUrl?.toLowerCase().endsWith(".docx");

  // Load DOCX preview
  useEffect(() => {
    if (isDocx && documentUrl && docxContainerRef.current) {
      setLoading(true);

      // const renderDocx = async () => {
      //   try {
      //     await createDocxPreviewFromUrl(
      //       documentUrl,
      //       docxContainerRef.current,
      //       null,
      //       {
      //         inWrapper: true,
      //         ignoreLastRenderedPageBreak: true,
      //         ignoreWidth: false,
      //         renderHeaders: true,
      //         renderFooters: true,
      //       }
      //     );
      //     setError("");
      //   } catch (err) {
      //     console.error("Error rendering DOCX:", err);
      //     setError("Failed to load document preview");
      //   } finally {
      //     setLoading(false);
      //   }
      // };

      // renderDocx();
    }
  }, [documentUrl, isDocx]);

  // PDF document loading handlers
  const onDocumentLoadSuccess = ({ numPages }: any) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setError("");
  };

  const onDocumentLoadError = (error: any) => {
    console.error("Error loading PDF:", error);
    setError("Failed to load document preview");
    setLoading(false);
  };

  // Navigation functions for PDF
  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages!) {
      setPageNumber(pageNumber + 1);
    }
  };

  // Handle download
  const handleDownload = () => {
    downloadSignedDocument(
      documentUrl,
      documentTitle || "document" + (isPdf ? ".pdf" : ".docx")
    );
  };

  if (!documentUrl) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>No document to display</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Controls */}
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>

          {isPdf && numPages && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {pageNumber} of {numPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Document Viewer */}
        <div className="border rounded-md p-4 bg-white min-h-[500px]">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-96 text-red-500">
              {error}
            </div>
          ) : isPdf ? (
            <div className="flex justify-center">
              <Document
                file={documentUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={Math.min(window.innerWidth * 0.8, 800)}
                />
              </Document>
            </div>
          ) : isDocx ? (
            <div ref={docxContainerRef} className="w-full h-full"></div>
          ) : (
            <div className="flex justify-center items-center h-96 text-gray-500">
              <p>Unsupported document format</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DocumentViewer;
