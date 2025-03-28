import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import esignatureClient from "@/lib/api/e-signature/esignatureClient";
import { toast } from "sonner";

export const useDocuments = () => {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data } = await esignatureClient.get("/documents");
      return data;
    },
  });
};

export const useDocumentDetails = (id: string) => {
  return useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      const { data } = await esignatureClient.get(`/documents/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; file: File }) => {
      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("file", payload.file);
      
      const { data } = await esignatureClient.post("/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};