import { useDocuments } from "@/contexts/DocumentContext";
import { DocumentCard } from "./DocumentCard";
import { DocumentUploader } from "./DocumentUploader";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback } from "react";
import { Document } from "@/services/documentsService";
import { FileQuestion } from "lucide-react";

interface DocumentListProps {
  onSelectDocumentForChat?: (document: Document) => void;
}

export function DocumentList({ onSelectDocumentForChat }: DocumentListProps) {
  const { documents, isLoading } = useDocuments();

  const renderDocuments = useCallback(() => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="text-center py-12">
          <FileQuestion className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium ">No documents yet</h3>
          <p className="text-muted-foreground mt-1">
            Upload a document to get started
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onSelectForChat={onSelectDocumentForChat}
          />
        ))}
      </div>
    );
  }, [documents, isLoading, onSelectDocumentForChat]);

  return (
    <div className="space-y-6">
      <DocumentUploader />
      {renderDocuments()}
    </div>
  );
}
