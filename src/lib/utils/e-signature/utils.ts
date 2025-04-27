// lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { saveAs } from "file-saver";

/**
 * Combines multiple class names using clsx and tailwind-merge
 */
export function cn(...inputs: any) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a date string to a formatted date
 */
export function formatDate(dateString: string) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format file size from bytes to human-readable form
 */
export function formatFileSize(bytes: any) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Check if a file is a valid document type (PDF, DOCX)
 */
export function isValidDocumentType(file: any) {
  const validTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  return validTypes.includes(file.type);
}

/**
 * Convert a base64 string to a Blob
 */
export function base64toBlob(base64Data: any, contentType = "") {
  const sliceSize = 512;
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

/**
 * Download a signed document
 */
export function downloadSignedDocument(documentData: any, filename: string) {
  // If we receive base64 data
  if (typeof documentData === "string" && documentData.includes("base64")) {
    const contentType = filename.endsWith(".pdf")
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const base64WithoutPrefix = documentData.split(",")[1] || documentData;
    const blob = base64toBlob(base64WithoutPrefix, contentType);
    saveAs(blob, filename);
  }
  // If we receive a URL
  else if (typeof documentData === "string") {
    saveAs(documentData, filename);
  }
  // If we receive a Blob or File
  else if (documentData instanceof Blob) {
    saveAs(documentData, filename);
  }
}

/**
 * Get status badge color based on signature status
 */
export function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "signed":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Convert signature pad data to base64 image
 */
export function signatureToBase64(signaturePad: any) {
  if (!signaturePad || signaturePad.isEmpty()) {
    return null;
  }

  return signaturePad.toDataURL("image/png");
}

/**
 * Determine if user has permission for an action based on role
 */
export function hasPermission(userRole: string, requiredRole: any) {
  const roles: any = {
    admin: 3,
    manager: 2,
    employee: 1,
  };

  return roles[userRole] >= roles[requiredRole];
}
