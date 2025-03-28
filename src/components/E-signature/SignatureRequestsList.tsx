import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useUpdateSignatureStatus } from "@/lib/hooks/e-signature/useSignatures";
import { AdminOnly, ClientOnly } from "./RoleBasedWrapper";

export function SignatureRequestsList({ signatures }: { signatures: any[] }) {
  const { mutate: updateStatus } = useUpdateSignatureStatus();

  const handleStatusUpdate = (id: string, status: "signed" | "rejected") => {
    updateStatus({ id, status });
  };

  if (!signatures || signatures.length === 0) {
    return <p className="text-muted-foreground">No signature requests yet.</p>;
  }

  return (
    <div className="space-y-4">
      {signatures.map((signature) => (
        <div
          key={signature.id}
          className="border rounded-lg p-4 flex justify-between items-center"
        >
          <div>
            <div className="flex items-center gap-2">
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
              <span className="text-sm text-muted-foreground">
                {format(new Date(signature.createdAt), "MMM dd, yyyy HH:mm")}
              </span>
              {signature.signedAt && (
                <span className="text-sm text-muted-foreground">
                  Signed:{" "}
                  {format(new Date(signature.signedAt), "MMM dd, yyyy HH:mm")}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <ClientOnly>
              {signature.status === "pending" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleStatusUpdate(signature.id, "signed")}
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
                  onClick={() => handleStatusUpdate(signature.id, "rejected")}
                >
                  Reject
                </Button>
              )}
            </AdminOnly>
          </div>
        </div>
      ))}
    </div>
  );
}
