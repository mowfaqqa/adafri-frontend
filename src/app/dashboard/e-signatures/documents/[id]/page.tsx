import { DocumentDetails } from "@/components/E-signature/DocumentDetails";
import SignatureRequestForm from "@/components/E-signature/SignatureRequestForm";
import { SignatureRequestsList } from "@/components/E-signature/SignatureRequestsList";
import { useDocumentDetails } from "@/lib/hooks/e-signature/useDocuments";
import { useSignatureRequests } from "@/lib/hooks/e-signature/useSignatures";
import { notFound } from "next/navigation";

export default function DocumentDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: document, isLoading, error } = useDocumentDetails(params.id);
  const { data: signatures } = useSignatureRequests(params.id);

  if (isLoading) return <div>Loading document...</div>;
  if (error) return <div>Error loading document: {error.message}</div>;
  if (!document) return notFound();

  return (
    <div className="container py-8">
      <div className="space-y-8">
        <DocumentDetails document={document} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Signature Requests</h2>
            <SignatureRequestsList signatures={signatures} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Request New Signature
            </h2>
            <SignatureRequestForm />
          </div>
        </div>
      </div>
    </div>
  );
}
