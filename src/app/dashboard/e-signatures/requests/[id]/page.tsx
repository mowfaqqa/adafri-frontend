import { notFound } from "next/navigation";
import { useSignatureDetails } from "@/lib/hooks/e-signature/useSignatures";
import { SignatureRequestDetails } from "@/components/E-signature/SignatureRequestDetails";

export default function SignatureRequestDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: signature, isLoading, error } = useSignatureDetails(params.id);

  if (isLoading) return <div>Loading signature request...</div>;
  if (error) return <div>Error loading signature: {error.message}</div>;
  if (!signature) return notFound();

  return (
    <div className="container py-8">
      <SignatureRequestDetails signature={signature} />
    </div>
  );
}
