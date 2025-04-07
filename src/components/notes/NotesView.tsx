import { useState, useEffect } from "react";
import { useDocuments } from "@/contexts/DocumentContext";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { Document } from "@/services/documentsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Files,
  FolderOpen,
  ClipboardList,
  Search,
  Plus,
  Download,
  Brain,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DocumentChat } from "@/components/documents/DocumentChat";

export function NotesView() {
  const {
    documents,
    isLoading,
    getDocumentUrl,
    setSelectedDocument: setContextSelectedDocument,
    selectedDocument: contextSelectedDocument,
  } = useDocuments();
  const [localSelectedDocument, setLocalSelectedDocument] =
    useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [notes, setNotes] = useState<
    Array<{ id: string; title: string; content: string; documentId?: string }>
  >([]);
  const [activeTab, setActiveTab] = useState("analysis");
  const { toast } = useToast();

  // Sincronizar el documento seleccionado con el contexto
  useEffect(() => {
    if (localSelectedDocument) {
      setContextSelectedDocument(localSelectedDocument);
    }
  }, [localSelectedDocument, setContextSelectedDocument]);

  // Sincronizar el documento del contexto con el local
  useEffect(() => {
    if (contextSelectedDocument) {
      setLocalSelectedDocument(contextSelectedDocument);
    }
  }, [contextSelectedDocument]);

  // Manejar la selección de un documento
  const handleSelectDocument = (doc: Document) => {
    setLocalSelectedDocument(doc);
    setContextSelectedDocument(doc);
  };

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
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Crear una nota asociada al documento
  const handleCreateNote = () => {
    if (!noteContent.trim()) {
      toast({
        title: "Error",
        description: "El contenido de la nota no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    const newNote = {
      id: crypto.randomUUID(),
      title: localSelectedDocument
        ? `Nota sobre ${localSelectedDocument.name}`
        : `Nota ${notes.length + 1}`,
      content: noteContent,
      documentId: localSelectedDocument?.id,
    };

    setNotes([newNote, ...notes]);
    setNoteContent("");

    toast({
      title: "Nota creada",
      description: "La nota ha sido creada exitosamente",
    });
  };

  // Descargar documento
  const handleDownloadDocument = () => {
    if (!localSelectedDocument) return;
    const url = getDocumentUrl(localSelectedDocument.file_path);
    window.open(url, "_blank");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Columna izquierda: Lista de documentos */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center">
                <Files className="h-5 w-5 mr-2" />
                Project documents
              </div>
              <Badge variant="outline">{documents.length}</Badge>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? "No se encontraron documentos"
                    : "No hay documentos disponibles"}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        localSelectedDocument?.id === doc.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleSelectDocument(doc)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {doc.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Badge variant="outline" className="px-1.5 py-0">
                              {getFileTypeLabel(doc.file_type)}
                            </Badge>
                            <span>{formatFileSize(doc.file_size)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Columna derecha: Vista del documento y notas */}
      <div className="md:col-span-2">
        <Tabs
          defaultValue="document"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="analysis">
              <Brain className="h-4 w-4 mr-2" />
              Analysis
            </TabsTrigger>
          </TabsList>

          {/* Vista de documento */}
          <TabsContent value="document">
            <Card>
              <CardContent className="pt-6">
                {!localSelectedDocument ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Choose a document</h3>
                    <p className="text-muted-foreground mt-1">
                      Choose a document from the list to see it here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold">
                          {localSelectedDocument.name}
                        </h2>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <Badge variant="outline">
                            {getFileTypeLabel(localSelectedDocument.file_type)}
                          </Badge>
                          <span>
                            {formatFileSize(localSelectedDocument.file_size)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadDocument}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-muted-foreground">
                        To see the full content of the document, click the
                        "Download" button.
                      </p>
                    </div>

                    {/* Aquí se podría añadir un visor de PDF o contenido del documento si se implementa en el futuro */}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vista de notas */}

          {/* Vista de análisis de documentos */}
          <TabsContent value="analysis">
            <Card>
              <CardContent className="pt-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Document Analysis</h2>
                  {!localSelectedDocument ? (
                    <div className="text-center py-12">
                      <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">
                        Choose a document to analyze
                      </h3>
                      <p className="text-muted-foreground mt-1">
                        First choose a document from the list to analyze it
                      </p>
                    </div>
                  ) : (
                    <DocumentChat />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
