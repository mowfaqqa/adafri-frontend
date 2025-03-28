"use client";
import { useSignatureRequests } from "@/lib/hooks/e-signature/useSignatures";
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
import { Badge } from "@/components/ui/badge";
import { useUpdateSignatureStatus } from "@/lib/hooks/e-signature/useSignatures";
import { toast } from "sonner";
import { AdminOnly, ClientOnly } from "./RoleBasedWrapper";

export function SignatureRequestsTable() {
  const { data: signatures, isLoading, error } = useSignatureRequests();
  const { mutate: updateStatus } = useUpdateSignatureStatus();

  const handleStatusUpdate = (id: string, status: "signed" | "rejected") => {
    updateStatus(
      { id, status },
      {
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  if (isLoading) return <div>Loading signature requests...</div>;
  if (error) return <div>Error loading signatures: {error.message}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Signature Requests</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Signed At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signatures?.map((signature: any) => (
              <TableRow key={signature.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/esignatures/documents/${signature.document.id}`}
                    className="hover:underline"
                  >
                    {signature.document.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={"outline"}
                    className={
                      signature.status === "signed"
                        ? "bg-green-400 text-white"
                        : signature.status === "rejected"
                        ? "text-white bg-red-400"
                        : "bg-gray-500 text-white"
                    }
                  >
                    {signature.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(signature.createdAt), "MMM dd, yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  {signature.signedAt
                    ? format(new Date(signature.signedAt), "MMM dd, yyyy HH:mm")
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <ClientOnly>
                      {signature.status === "pending" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() =>
                            handleStatusUpdate(signature.id, "signed")
                          }
                        >
                          Sign
                        </Button>
                      )}
                    </ClientOnly>
                    <AdminOnly>
                      {signature.status === "pending" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleStatusUpdate(signature.id, "rejected")
                          }
                        >
                          Reject
                        </Button>
                      )}
                    </AdminOnly>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/esignatures/requests/${signature.id}`}>
                        Details
                      </Link>
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
