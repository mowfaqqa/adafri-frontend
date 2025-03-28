import { DocumentsTable } from "@/components/E-signature/DocumentsTable";
import { SignatureRequestsTable } from "@/components/E-signature/SignatureRequestsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ESignaturePage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">E-Signature Management</h1>
      <Tabs defaultValue="documents" className="w-full">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="requests">Signature Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="documents">
          <DocumentsTable />
        </TabsContent>
        <TabsContent value="requests">
          <SignatureRequestsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}