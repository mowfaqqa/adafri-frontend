import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AdminOnly, ClientOnly } from "./RoleBasedWrapper";
import { useUpdateSignatureStatus } from "@/lib/hooks/e-signature/useSignatures";

export function SignatureRequestDetails({ signature }: { signature: any }) {
  const { mutate: updateStatus } = useUpdateSignatureStatus();

  const handleStatusUpdate = (status: "signed" | "rejected") => {
    updateStatus({ id: signature.id, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Signature Request</h2>
          <p className="text-muted-foreground">
            Requested on {format(new Date(signature.createdAt), "MMM dd, yyyy")}
          </p>
        </div>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Document</h3>
            <p>{signature.document.title}</p>
            <Button variant="link" size="sm" asChild>
              <Link href={`/esignatures/documents/${signature.document.id}`}>
                View Document Details
              </Link>
            </Button>
          </div>

          <div>
            <h3 className="font-semibold">Timestamps</h3>
            <div className="text-sm space-y-1">
              <p>
                Requested:{" "}
                {format(new Date(signature.createdAt), "MMM dd, yyyy HH:mm")}
              </p>
              {signature.signedAt && (
                <p>
                  Signed:{" "}
                  {format(new Date(signature.signedAt), "MMM dd, yyyy HH:mm")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Signature Preview</h3>
            {signature.signatureData ? (
              <img
                src={signature.signatureData}
                alt="Signature"
                className="mt-2 border rounded-md max-h-32"
              />
            ) : (
              <p className="text-muted-foreground">
                No signature data available
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <ClientOnly>
              {signature.status === "pending" && (
                <Button onClick={() => handleStatusUpdate("signed")}>
                  Sign Document
                </Button>
              )}
            </ClientOnly>
            <AdminOnly>
              {signature.status === "pending" && (
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate("rejected")}
                >
                  Reject Signature
                </Button>
              )}
            </AdminOnly>
          </div>
        </div>
      </div>
    </div>
  );
}
