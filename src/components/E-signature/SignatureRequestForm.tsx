"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SignaturePadComponent } from "./SignaturePad";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDocuments } from "@/lib/hooks/e-signature/useDocuments";
import { useCreateSignatureRequest } from "@/lib/hooks/e-signature/useSignatures";

const formSchema = z.object({
  documentId: z.string().min(1, "Document is required"),
  signatureData: z.string().min(1, "Signature is required"),
});

function SignatureRequestForm() {
  const { data: documents } = useDocuments();
  const { mutateAsync: createSignatureRequest, isPending } =
    useCreateSignatureRequest();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentId: "",
      signatureData: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createSignatureRequest(values);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="documentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a document" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {documents?.map((doc: any) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="signatureData"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Signature</FormLabel>
              <FormControl>
                <SignaturePadComponent onSave={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Request Signature"}
        </Button>
      </form>
    </Form>
  );
}

export default SignatureRequestForm