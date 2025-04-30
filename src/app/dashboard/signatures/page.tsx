"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Eye,
  Check,
  XCircle,
  Search,
  FileSignature,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, getStatusColor } from "@/lib/utils/e-signature/utils";

export default function SignaturesPage() {
  const router = useRouter();
  const [signatures, setSignatures] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0); // For triggering refresh

  // Fetch all signatures
  useEffect(() => {
    const fetchSignatures = async () => {
      setLoading(true);
      try {
        // Note: This API endpoint might not be directly available based on your document
        // You might need to adapt this to fetch from the available endpoints
        const response = await fetch("/esignatures", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch signatures");
        }

        const data = await response.json();
        setSignatures(data);
        setError("");
      } catch (err) {
        console.error("Error fetching signatures:", err);
        setError("Failed to load signatures. Please try again.");
        toast.error("Could not load signatures");
      } finally {
        setLoading(false);
      }
    };

    fetchSignatures();
  }, [refreshKey]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  // Request a new signature
  const handleRequestSignature = () => {
    router.push("/dashboard/signatures/request");
  };

  // View signature details
  const handleViewSignature = (signatureId: string) => {
    router.push(`/dashboard/signatures/${signatureId}`);
  };

  // Filter signatures based on search term and active tab
  const filteredSignatures = signatures.filter((signature: any) => {
    // Filter by search term
    const matchesSearch =
      signature?.documentTitle
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      signature?.signerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by tab
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && signature?.status.toLowerCase() === activeTab;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Signatures</h1>
        <p className="text-gray-500 mt-1">
          Manage signature requests and approvals
        </p>
      </header>

      <div className="flex justify-between items-center">
        <Button onClick={handleRequestSignature}>
          <FileSignature className="h-4 w-4 mr-2" />
          Request Signature
        </Button>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Signature Requests</CardTitle>
          <CardDescription>
            View and manage all your signature requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search signatures..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="signed">Signed</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">{error}</div>
                ) : filteredSignatures.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileSignature className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No signature requests found</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead>Signer</TableHead>
                          <TableHead>Date Requested</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSignatures.map((signature: any) => (
                          <TableRow key={signature?.id}>
                            <TableCell className="font-medium">
                              {signature?.documentTitle || "Untitled Document"}
                            </TableCell>
                            <TableCell>{signature?.signerEmail}</TableCell>
                            <TableCell>
                              {formatDate(signature?.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusColor(signature?.status)}
                              >
                                {signature?.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleViewSignature(signature.id)
                                }
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
