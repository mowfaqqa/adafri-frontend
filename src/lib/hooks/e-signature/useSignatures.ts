import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import esignatureClient from "@/lib/api/e-signature/esignatureClient";
import { toast } from "sonner";

export const useSignatureRequests = (documentId?: string) => {
  return useQuery({
    queryKey: ["signatures", documentId],
    queryFn: async () => {
      const url = documentId
        ? `/esignatures/document/${documentId}`
        : "/esignatures";
      const { data } = await esignatureClient.get(url);
      return data;
    },
  });
};

export const useSignatureDetails = (id: string) => {
  return useQuery({
    queryKey: ["signature", id],
    queryFn: async () => {
      const { data } = await esignatureClient.get(`/esignatures/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateSignatureRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      documentId: string;
      signatureData: string;
    }) => {
      const { data } = await esignatureClient.post("/esignatures", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signatures"] });
      toast.success("Signature request created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateSignatureStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "signed" | "rejected";
    }) => {
      const { data } = await esignatureClient.patch(
        `/esignatures/${id}/status`,
        { status }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signatures"] });
      toast.success("Signature status updated!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
