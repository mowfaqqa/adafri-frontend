"use client";
import { useDocuments } from "@/lib/hooks/e-signature/useDocuments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { DocumentUploadModal } from "./DocumentUploadModal";

export function DocumentsTable() {
  const { data: documents, isLoading, error } = useDocuments();

  if (isLoading) return <div>Loading documents...</div>;
  if (error) return <div>Error loading documents: {error.message}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Documents</h2>
        <DocumentUploadModal />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents?.map((doc: any) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>
                  {format(new Date(doc.createdAt), "MMM dd, yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/esignatures/documents/${doc.id}`}>View</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}