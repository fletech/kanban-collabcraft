import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { aiService } from "@/services/aiService";
import { useToast } from "@/hooks/use-toast";
import { useDocuments } from "@/contexts/DocumentContext";
import { supabase } from "@/lib/supabase";

interface Analysis {
  summary: string;
  tasks: Array<{
    title: string;
    description: string;
    priority: string;
  }>;
  raw?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnalysisContextType {
  analysis: Analysis | null;
  analyzing: boolean;
  selectedTask: any | null;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  analysisStatus: string | null;
  setSelectedTask: (task: any) => void;
  setAnalysis: (analysis: Analysis | null) => void;
  analyzeDocument: (document: any, projectId: string) => Promise<void>;
  clearAnalysis: () => void;
  sendChatMessage: (message: string) => Promise<void>;
  clearChat: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(
  undefined
);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const { toast } = useToast();
  const { selectedDocument } = useDocuments();

  // Limpiar análisis cuando cambia el documento seleccionado
  useEffect(() => {
    clearAnalysis();
  }, [selectedDocument?.id]);

  const analyzeDocument = useCallback(
    async (document: any, projectId: string) => {
      if (!document || !projectId) {
        toast({
          title: "Error",
          description:
            "Cannot analyze document. Select a project and document.",
          variant: "destructive",
        });
        return;
      }

      try {
        setAnalyzing(true);

        // Suscribirse a cambios en el estado del análisis
        const subscription = supabase
          .channel("document_analysis_changes")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "document_analysis",
              filter: `document_id=eq.${document.id}`,
            },
            (payload) => {
              setAnalysisStatus(payload.new.analysis_status);
            }
          )
          .subscribe();

        const result = await aiService.analyzeDocument(document, projectId);
        setAnalysis(result);

        toast({
          title: result.fromCache
            ? "Cached Analysis Loaded"
            : "Analysis completed",
          description: result.fromCache
            ? "Showing previously generated analysis for this document"
            : "Task suggestions have been generated from the document.",
          variant: "default",
        });

        // Limpiar suscripción
        subscription.unsubscribe();
      } catch (error: any) {
        console.error("Error analyzing document:", error);
        toast({
          title: "Error",
          description: error.message || "Error analyzing document",
          variant: "destructive",
        });
        setAnalysis(null);
      } finally {
        setAnalyzing(false);
        setAnalysisStatus(null);
      }
    },
    [toast]
  );

  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!selectedDocument) {
        toast({
          title: "Error",
          description: "No hay un documento seleccionado para chatear.",
          variant: "destructive",
        });
        return;
      }

      try {
        setChatLoading(true);
        // Agregar mensaje del usuario
        const userMessage: ChatMessage = { role: "user", content: message };
        setChatMessages((prev) => [...prev, userMessage]);

        // Obtener historial de mensajes en formato para la API
        const previousMessages = chatMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Enviar mensaje a la API
        const response = await aiService.chatWithDocument(
          selectedDocument,
          message,
          previousMessages
        );

        // Agregar respuesta del asistente
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response,
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
      } catch (error: any) {
        console.error("Error in chat:", error);
        toast({
          title: "Error",
          description: error.message || "Error al procesar el mensaje",
          variant: "destructive",
        });
      } finally {
        setChatLoading(false);
      }
    },
    [chatMessages, toast, selectedDocument]
  );

  const clearChat = useCallback(() => {
    setChatMessages([]);
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setSelectedTask(null);
    clearChat();
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        analysis,
        analyzing,
        selectedTask,
        chatMessages,
        chatLoading,
        analysisStatus,
        setSelectedTask,
        setAnalysis,
        analyzeDocument,
        clearAnalysis,
        sendChatMessage,
        clearChat,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}
