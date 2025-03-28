"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateDocument } from "@/lib/hooks/e-signature/useDocuments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  file: z.instanceof(File, { message: "File is required" }),
});

export function DocumentUploadModal() {
  const { mutateAsync: createDocument, isPending } = useCreateDocument();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      file: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createDocument(values);
    form.reset();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Upload Document</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload New Document</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Contract Agreement" {...field!} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...rest } }: any) => (
                <FormItem>
                  <FormLabel>Document File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => onChange(e.target.files?.[0])}
                      {...rest}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Uploading..." : "Upload Document"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
