import { useState } from "react";
import { Document } from "@/services/documentsService";
import { useDocuments } from "@/contexts/DocumentContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileIcon,
  Download,
  Trash2,
  MoreHorizontal,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

interface DocumentCardProps {
  document: Document;
  onSelectForChat?: (document: Document) => void;
}

export function DocumentCard({ document, onSelectForChat }: DocumentCardProps) {
  const { deleteDocument, getDocumentUrl } = useDocuments();
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle download
  const handleDownload = () => {
    const url = getDocumentUrl(document.file_path);
    window.open(url, "_blank");
  };

  // Handle document deletion
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        setIsDeleting(true);
        await deleteDocument(document.id);
      } catch (error) {
        console.error("Error deleting document:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file type label
  const getFileTypeLabel = (fileType: string) => {
    if (fileType.includes("pdf")) return "PDF";
    if (fileType.includes("word") || fileType.includes("docx")) return "DOCX";
    if (fileType.includes("text/plain")) return "TXT";
    if (fileType.includes("markdown")) return "MD";
    return fileType.split("/")[1]?.toUpperCase() || "DOC";
  };

  // Format date
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: enUS,
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded">
              <FileIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium line-clamp-1">{document.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="bg-secondary px-2 py-0.5 rounded text-xs">
                  {getFileTypeLabel(document.file_type)}
                </span>
                <span>{formatFileSize(document.file_size)}</span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isDeleting}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              {onSelectForChat && (
                <DropdownMenuItem onClick={() => onSelectForChat(document)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Analyze with AI
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          Uploaded {formatDate(document.created_at)}
        </div>
      </CardContent>
    </Card>
  );
}
