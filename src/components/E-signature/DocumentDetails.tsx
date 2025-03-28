import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function DocumentDetails({ document }: { document: any }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{document.title}</h2>
          <p className="text-muted-foreground">
            Created on {format(new Date(document.createdAt), "MMM dd, yyyy")}
          </p>
        </div>
        <Button asChild>
          <Link href={document.url} target="_blank" rel="noopener noreferrer">
            View Document
          </Link>
        </Button>
      </div>
      <div className="flex gap-2">
        <Badge variant="secondary">Document ID: {document.id}</Badge>
        <Badge variant="outline">
          {document.signatures?.length || 0} signature requests
        </Badge>
      </div>
    </div>
  );
}
