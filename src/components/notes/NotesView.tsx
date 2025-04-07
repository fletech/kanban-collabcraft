import { useState, useEffect } from "react";
import { useDocuments } from "@/contexts/DocumentContext";
import { Document } from "@/services/documentsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Files,
  FolderOpen,
  Search,
  Plus,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function NotesView() {
  const { documents, isLoading, getDocumentUrl } = useDocuments();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Filtrar documentos según la búsqueda
  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Formatear el tipo de archivo para mostrar
  const getFileTypeLabel = (fileType: string) => {
    if (fileType.includes("pdf")) return "PDF";
    if (fileType.includes("word") || fileType.includes("docx")) return "DOCX";
    if (fileType.includes("text/plain")) return "TXT";
    if (fileType.includes("markdown")) return "MD";
    return fileType.split("/")[1]?.toUpperCase() || "DOC";
  };

  // Formatear el tamaño del archivo
  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  // Descargar documento
  const handleDownloadDocument = async (doc: Document) => {
    try {
      const url = getDocumentUrl(doc.file_path);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar el documento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Columna izquierda: Lista de documentos */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Files className="h-5 w-5" />
              Project documents
              <Badge variant="secondary" className="ml-2">
                {filteredDocuments.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[calc(100vh-350px)]">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm line-clamp-1">
                              {doc.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="secondary"
                                className="text-xs font-normal"
                              >
                                {getFileTypeLabel(doc.file_type)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Columna derecha: Vista del documento */}
      <div className="md:col-span-2">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Project Documents</h3>
              <p className="text-muted-foreground mt-1">
                Here you can manage all your project documents
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
