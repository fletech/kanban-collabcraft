import React, { createContext, useContext, useState, useCallback } from "react";
import { aiService } from "@/services/aiService";
import { useToast } from "@/hooks/use-toast";
import { useDocuments } from "@/contexts/DocumentContext";

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
  const { toast } = useToast();
  const { selectedDocument } = useDocuments();

  const analyzeDocument = useCallback(
    async (document: any, projectId: string) => {
      if (!document || !projectId) {
        toast({
          title: "Error",
          description:
            "No se pudo analizar el documento. Selecciona un proyecto y un documento.",
          variant: "destructive",
        });
        return;
      }

      try {
        setAnalyzing(true);
        const result = await aiService.analyzeDocument(document, projectId);
        setAnalysis(result);

        toast({
          title: "Análisis completado",
          description:
            "Se han generado sugerencias de tareas a partir del documento.",
        });
      } catch (error: any) {
        console.error("Error analyzing document:", error);
        toast({
          title: "Error",
          description: error.message || "Error al analizar el documento",
          variant: "destructive",
        });
        setAnalysis(null);
      } finally {
        setAnalyzing(false);
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
