import { supabase } from "@/lib/supabase";
import { Document } from "./documentsService";
import * as pdfjsLib from "pdfjs-dist";
import { getDocument } from "pdfjs-dist";

// Inicializar el worker de PDF.js
const initPdfWorker = async () => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = await import(
    /* @vite-ignore */
    "pdfjs-dist/build/pdf.worker.mjs"
  ).then((worker) => worker.default);
};

// Inicializar el worker inmediatamente
initPdfWorker().catch(console.error);

/**
 * Servicio para interactuar con modelos de IA a través de Groq
 */
export const aiService = {
  /**
   * Analiza un documento y sugiere tareas
   */
  async analyzeDocument(document: Document, projectId: string): Promise<any> {
    try {
      // Verificar análisis existente
      const { data: existingAnalysis, error: existingAnalysisError } =
        await supabase
          .from("document_analysis")
          .select("*")
          .eq("document_id", document.id)
          .order("analysis_timestamp", { ascending: false })
          .limit(1)
          .single();

      if (existingAnalysisError && existingAnalysisError.code !== "PGRST116") {
        throw existingAnalysisError;
      }

      if (
        existingAnalysis?.analysis_status === "completed" &&
        existingAnalysis.analysis_summary
      ) {
        try {
          const parsedSummary = JSON.parse(existingAnalysis.analysis_summary);
          return {
            summary: parsedSummary.summary,
            tasks: parsedSummary.tasks || [],
            fromCache: true,
          };
        } catch {
          return {
            summary: existingAnalysis.analysis_summary,
            tasks: [],
            fromCache: true,
          };
        }
      }

      // Iniciar nuevo análisis
      const { data: analysis, error: insertError } = await supabase
        .from("document_analysis")
        .insert({
          document_id: document.id,
          analysis_status: "downloading",
          ai_provider: "groq-llama3-8b",
          analysis_timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Descargar documento
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(document.file_path);

      if (downloadError) {
        await this.updateAnalysisStatus(
          analysis.id,
          "error",
          "Error downloading document"
        );
        throw new Error("Error downloading document");
      }

      // Extraer texto
      await this.updateAnalysisStatus(analysis.id, "extracting_text");

      let text;
      try {
        text = await this.extractTextFromFile(fileData, document.file_path);
      } catch (error) {
        await this.updateAnalysisStatus(
          analysis.id,
          "error",
          "Error extracting text"
        );
        throw error;
      }

      await this.updateAnalysisStatus(analysis.id, "analyzing");

      // Preparar texto para análisis (limitar a 30k caracteres)
      const truncatedText = text.slice(0, 30000);

      // Analizar con Groq
      let aiResponse;
      try {
        aiResponse = await this.analyzeWithGroq(truncatedText);
      } catch (error) {
        await this.updateAnalysisStatus(
          analysis.id,
          "error",
          "Error analyzing with AI"
        );
        throw error;
      }

      // Guardar resultados
      const { data: updatedAnalysis, error: updateError } = await supabase
        .from("document_analysis")
        .update({
          analysis_status: "completed",
          analysis_summary: JSON.stringify(aiResponse),
        })
        .eq("id", analysis.id)
        .select()
        .single();

      if (updateError) {
        await this.updateAnalysisStatus(
          analysis.id,
          "error",
          "Error saving analysis results"
        );
        throw updateError;
      }

      return {
        summary: aiResponse.summary,
        tasks: aiResponse.tasks,
        fromCache: false,
      };
    } catch (error) {
      console.error("Error in analyzeDocument:", error);
      throw error;
    }
  },

  /**
   * Actualiza el estado del análisis
   */
  async updateAnalysisStatus(
    analysisId: string,
    status: string,
    errorMessage?: string
  ) {
    try {
      await supabase
        .from("document_analysis")
        .update({
          analysis_status: status,
          analysis_timestamp: new Date().toISOString(),
          ...(errorMessage && { analysis_summary: `Error: ${errorMessage}` }),
        })
        .eq("id", analysisId);
    } catch (error) {
      console.error("Error updating analysis status:", error);
    }
  },

  /**
   * Obtiene los análisis previos de un documento
   */
  async getDocumentAnalysis(documentId: string) {
    try {
      const { data, error } = await supabase
        .from("document_analysis")
        .select("*")
        .eq("document_id", documentId)
        .order("analysis_timestamp", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error fetching document analysis:", error);
      return null;
    }
  },

  /**
   * Crea una tarea a partir de una sugerencia del AI
   */
  async createTaskFromSuggestion(
    suggestion: any,
    documentId: string,
    projectId: string,
    userId: string
  ) {
    try {
      // Obtener el primer estado (New/Nuevo) del proyecto
      const { data: statuses, error: statusError } = await supabase
        .from("statuses")
        .select("id")
        .eq("project_id", projectId)
        .order("display_order", { ascending: true })
        .limit(1);

      if (statusError) throw statusError;

      if (!statuses || statuses.length === 0) {
        throw new Error("No se encontraron estados para el proyecto");
      }

      const statusId = statuses[0].id;

      // Insertar la tarea en la base de datos
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: suggestion.title,
          description: suggestion.description,
          priority: suggestion.priority || "Medium",
          status_id: statusId,
          project_id: projectId,
          created_by: userId,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Registrar la fuente de la tarea
      const { error: sourceError } = await supabase
        .from("task_sources")
        .insert({
          task_id: task.id,
          source_type: "ai_suggestion",
          document_id: documentId,
          source_details: suggestion,
        });

      if (sourceError) throw sourceError;

      return task;
    } catch (error) {
      console.error("Error creating task from suggestion:", error);
      throw error;
    }
  },

  /**
   * Función auxiliar para extraer texto según el tipo de archivo
   */
  async extractTextFromFile(fileData: Blob, filePath: string): Promise<string> {
    try {
      const fileType = filePath.split(".").pop()?.toLowerCase();
      console.log(
        `AIService: Extracting text from file type: ${fileType}, size: ${fileData.size} bytes`
      );

      // Para documentos de texto simple
      if (fileType === "txt" || fileType === "md") {
        const text = await fileData.text();
        console.log(
          `AIService: Text extracted successfully, length: ${text.length} characters`
        );
        return text;
      }

      // Para PDFs
      if (fileType === "pdf") {
        console.log("AIService: Processing PDF file...");

        // Convertir Blob a ArrayBuffer
        const arrayBuffer = await fileData.arrayBuffer();

        // Cargar el PDF
        const pdf = await getDocument(arrayBuffer).promise;
        console.log(`AIService: PDF loaded, ${pdf.numPages} pages`);

        let fullText = "";

        // Extraer texto de cada página
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          fullText += pageText + "\n";
        }

        console.log(
          `AIService: Text extracted from PDF, length: ${fullText.length} characters`
        );
        return fullText;
      }

      // Para otros formatos (DOCX, etc.)
      throw new Error(`Unsupported file type: ${fileType}`);
    } catch (error) {
      console.error("Error extracting text from file:", error);
      throw new Error(`Error extracting text from document: ${error.message}`);
    }
  },

  /**
   * Chatea con un documento usando el modelo de Groq
   */
  async chatWithDocument(
    document: Document,
    message: string,
    previousMessages: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    try {
      console.log(`AIService: Iniciando chat para documento ${document.name}`);

      // Obtener el documento de Supabase Storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from("documents")
        .download(document.file_path);

      if (fileError) {
        console.error("Error downloading document:", fileError);
        throw new Error(`Error descargando el documento: ${fileError.message}`);
      }

      if (!fileData) {
        console.error("No file data received");
        throw new Error("No se recibieron datos del archivo");
      }

      // Obtener el texto del documento
      const documentText = await this.extractTextFromFile(
        fileData,
        document.file_path
      );
      const trimmedText = documentText.substring(0, 30000); // Limitar el texto para evitar exceder el contexto

      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY no está configurada");
      }

      // Construir el historial de mensajes
      const messages = [
        {
          role: "system",
          content: `You are an AI assistant helping to analyze and discuss a document. The document content is:

${trimmedText}

Based on this document, answer the user's questions. Keep your responses clear and concise.
If the question cannot be answered based on the document content, say so.
Always respond in English.`,
        },
        ...previousMessages,
        {
          role: "user",
          content: message,
        },
      ];

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            messages,
            temperature: 1,
            max_tokens: 2000,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Detailed Groq API error:", errorData);
        throw new Error(
          `Groq API error: ${response.status} ${response.statusText}`
        );
      }

      const groqData = await response.json();
      return groqData.choices[0]?.message?.content || "No response generated";
    } catch (error) {
      console.error("Error in chat:", error);
      throw error;
    }
  },

  async analyzeWithGroq(text: string) {
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY not configured");
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: `You are a an assistant for project management. You are expert in document analysis. 
            Your task is to extract possible tasks from a document, organizing them with title, description and priority.
            For each task, provide:
            1. Clear and concise title
            2. Detailed description
            3. Suggested priority (Must, Medium, Tiny, Huge)
            
            The analysis must be based on the content of the document, but the response must be in english. ALWAYS, ALWAYS, ALWAYS in english.
            
            Return a JSON with the following format, in english:
            {
              "summary": "Brief summary of the document",
              "tasks": [
                {
                  "title": "Task title",
                  "description": "Detailed description",
                  "priority": "Medium"
                }
              ]
            }

            IMPORTANT: Your response must be ONLY the JSON object, nothing else.`,
            },
            {
              role: "user",
              content: `Analyze this document and extract potential tasks:\n\n${text}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 4000,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Groq API error: ${response.status} ${response.statusText}`
      );
    }

    const groqData = await response.json();
    const aiMessage = groqData.choices[0]?.message?.content;

    if (!aiMessage) {
      throw new Error("No response received from Groq API");
    }

    try {
      // Intentar parsear directamente primero
      try {
        return JSON.parse(aiMessage);
      } catch (e) {
        // Si falla, intentar extraer JSON usando regex
        const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No valid JSON found in response");
        }
        const result = JSON.parse(jsonMatch[0]);

        // Validar estructura del resultado
        if (!result.summary || !Array.isArray(result.tasks)) {
          throw new Error("Invalid response format");
        }

        return result;
      }
    } catch (error) {
      console.error(
        "Error parsing AI response:",
        error,
        "Raw response:",
        aiMessage
      );
      throw new Error("Failed to parse AI response");
    }
  },
};
