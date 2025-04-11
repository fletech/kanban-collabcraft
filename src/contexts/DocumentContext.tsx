import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { useProjectId } from "@/hooks/use-projectId";
import { useRealtimeSubscription } from "@/hooks/use-realtimeSubscription";
import {
  documentsService,
  Document,
  DocumentAnalysis,
} from "@/services/documentsService";
import { useAuth } from "@/contexts/AuthContext";

type DocumentContextType = {
  documents: Document[];
  isLoading: boolean;
  uploadDocument: (file: File) => Promise<Document>;
  deleteDocument: (documentId: string) => Promise<void>;
  fetchProjectDocuments: (projectId: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
  getDocumentUrl: (filePath: string) => string;
  selectedDocument: Document | null;
  setSelectedDocument: (document: Document | null) => void;
};

const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined
);

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const projectId = useProjectId();
  const { toast } = useToast();
  const { user } = useAuth();

  // Cargar documentos de un proyecto específico
  const fetchProjectDocuments = useCallback(
    async (projectId: string) => {
      // No intentar cargar documentos si estamos en la ruta new
      if (projectId === "new") {
        setDocuments([]);
        return;
      }

      try {
        setIsLoading(true);
        console.log(
          `DocumentContext: Fetching documents for project: ${projectId}`
        );

        const documentsData = await documentsService.fetchProjectDocuments(
          projectId
        );
        setDocuments(documentsData);
        setCurrentProjectId(projectId);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los documentos del proyecto",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Refrescar documentos del proyecto actual
  const refreshDocuments = useCallback(async () => {
    if (!projectId) return;
    await fetchProjectDocuments(projectId);
  }, [projectId, fetchProjectDocuments]);

  // Subir un nuevo documento
  const uploadDocument = async (file: File): Promise<Document> => {
    if (!projectId || !user) {
      toast({
        title: "Error",
        description:
          "No se pudo determinar el ID del proyecto o usuario no autenticado",
        variant: "destructive",
      });
      throw new Error("No se pudo determinar el ID del proyecto");
    }

    try {
      setIsLoading(true);
      const newDocument = await documentsService.uploadDocument(
        file,
        projectId,
        user.id
      );

      // Actualizar lista de documentos
      setDocuments((prev) => [newDocument, ...prev]);

      toast({
        title: "Success",
        description: "Documento subido correctamente",
      });

      return newDocument;
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({
        title: "Error",
        description: error.message || "Error al subir el documento",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar un documento
  const deleteDocument = async (documentId: string): Promise<void> => {
    try {
      setIsLoading(true);
      await documentsService.deleteDocument(documentId);

      // Actualizar lista de documentos
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));

      toast({
        title: "Success",
        description: "Documento eliminado correctamente",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Error al eliminar el documento",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener URL pública de un documento
  const getDocumentUrl = useCallback((filePath: string): string => {
    return documentsService.getDocumentUrl(filePath);
  }, []);

  // Cargar documentos cuando cambia el projectId
  useEffect(() => {
    if (projectId) {
      console.log(`DocumentContext: Project ID changed to ${projectId}`);
      fetchProjectDocuments(projectId);
    } else {
      // Limpiar el estado cuando no hay proyecto seleccionado
      setDocuments([]);
      setCurrentProjectId(null);
    }
  }, [projectId, fetchProjectDocuments]);

  // Suscripción en tiempo real a cambios en documentos
  const handleRealtimeUpdate = useCallback(() => {
    if (projectId) {
      fetchProjectDocuments(projectId);
    }
  }, [projectId, fetchProjectDocuments]);

  useRealtimeSubscription("documents", projectId, handleRealtimeUpdate);

  const value: DocumentContextType = {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    fetchProjectDocuments,
    refreshDocuments,
    getDocumentUrl,
    selectedDocument,
    setSelectedDocument,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocuments must be used within a DocumentProvider");
  }
  return context;
}
