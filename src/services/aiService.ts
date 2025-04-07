import { supabase } from "@/lib/supabase";
import { Document } from "./documentsService";

/**
 * Servicio para interactuar con modelos de IA a través de Groq
 */
export const aiService = {
  /**
   * Analiza un documento y sugiere tareas
   */
  async analyzeDocument(document: Document, projectId: string): Promise<any> {
    try {
      console.log(`AIService: Analyzing document ${document.name}`);

      // Registrar el inicio del análisis
      const { data: analysisRecord, error: dbError } = await supabase
        .from("document_analysis")
        .insert({
          document_id: document.id,
          analysis_status: "processing",
          ai_provider: "groq-llama3-8b",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Obtener el documento de Supabase Storage
      console.log(
        `AIService: Descargando documento desde path: ${document.file_path}`
      );

      try {
        const { data: fileData, error: fileError } = await supabase.storage
          .from("documents")
          .download(document.file_path);

        if (fileError) {
          console.error("Error downloading document:", fileError);
          throw new Error(
            `Error descargando el documento: ${fileError.message}`
          );
        }

        if (!fileData) {
          console.error("No file data received");
          throw new Error("No se recibieron datos del archivo");
        }

        console.log(
          `AIService: Documento descargado correctamente, tamaño: ${fileData.size} bytes`
        );

        // Extraer texto del documento
        const documentText = await this.extractTextFromFile(
          fileData,
          document.file_path
        );

        // Llamar directamente a la API de Groq
        const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

        if (!GROQ_API_KEY) {
          throw new Error(
            "GROQ_API_KEY no configurada. Añádela a tu archivo .env como VITE_GROQ_API_KEY"
          );
        }

        // Añadir logs para depuración
        console.log(
          `AIService: Llamando a Groq API para documento ${document.name}`
        );
        console.log(
          `AIService: Tamaño del texto del documento: ${documentText.length} caracteres`
        );

        // Limitar el tamaño del texto si es muy grande (más de ~30K tokens)
        const MAX_TEXT_LENGTH = 30000;
        const trimmedText =
          documentText.length > MAX_TEXT_LENGTH
            ? documentText.substring(0, MAX_TEXT_LENGTH) +
              "... [TRUNCADO DEBIDO AL TAMAÑO]"
            : documentText;

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
                    },
                    ...
                  ]
                }`,
                },
                {
                  role: "user",
                  content: `Analyze this document titled "${document.name}" and extract potential tasks:\n\n${trimmedText}`,
                },
              ],
              temperature: 0.2,
              max_tokens: 4000,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Detailed Groq API error:", errorData);
          throw new Error(
            `Groq API error: ${response.status} ${response.statusText}. Details: ${errorData}`
          );
        }

        const groqData = await response.json();
        const aiMessage = groqData.choices[0]?.message?.content;

        // Extraer y formatear la respuesta
        let parsedResult;
        try {
          // Intentar extraer el JSON de la respuesta
          const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : aiMessage;

          console.log(
            `AIService: Received response from API: ${aiMessage.substring(
              0,
              200
            )}...`
          );

          try {
            parsedResult = JSON.parse(jsonString);
          } catch (parseError) {
            console.log(
              "Error parsing JSON directly, trying with manual format"
            );

            // Si no podemos parsear un JSON, creamos uno manualmente
            // Extraer un posible resumen del texto
            let summary = "";
            const summaryMatch = aiMessage.match(/[Rr]esumen:?\s*([^\n]+)/);
            if (summaryMatch && summaryMatch[1]) {
              summary = summaryMatch[1];
            } else {
              // Intentar obtener el primer párrafo como resumen
              const firstParagraph = aiMessage.split("\n\n")[0];
              summary =
                firstParagraph.length > 50
                  ? firstParagraph
                  : "Document analysis completed";
            }

            // Extraer posibles tareas
            const tasks = [];
            const taskMatches = aiMessage.matchAll(
              /(?:Tarea|Task|Título)[^\n]*:?\s*([^\n]+)(?:[\s\S]*?(?:[Pp]rioridad|[Pp]riority)[^\n]*:?\s*([^\n]+))?/g
            );

            for (const match of taskMatches) {
              const title = match[1].trim();
              let priority = match[2]?.trim() || "Medium";

              // Normalizar prioridad
              if (/alta|high|must/i.test(priority)) priority = "Must";
              else if (/media|medium/i.test(priority)) priority = "Medium";
              else if (/baja|low|tiny/i.test(priority)) priority = "Tiny";
              else if (/enorme|huge/i.test(priority)) priority = "Huge";
              else priority = "Medium";

              // Extraer descripción si existe
              let description = "";
              const descMatch = match[0].match(
                /(?:[Dd]escripción|[Dd]escription)[^\n]*:?\s*([^\n]+)/
              );
              if (descMatch && descMatch[1]) {
                description = descMatch[1].trim();
              } else {
                description = `Tarea generada a partir del documento ${document.name}`;
              }

              tasks.push({
                title,
                description,
                priority,
              });
            }

            // Si no hemos encontrado tareas con el regex, creamos una tarea genérica
            if (tasks.length === 0) {
              tasks.push({
                title: `Revisar documento ${document.name}`,
                description:
                  "Revisar el contenido del documento para extraer requisitos y tareas relevantes",
                priority: "Medium",
              });
            }

            parsedResult = {
              summary,
              tasks,
            };
          }
        } catch (error) {
          console.error("Error parsing AI response:", error);
          // Si falla el parsing, devolvemos un resultado predeterminado
          parsedResult = {
            summary: "Análisis del documento " + document.name,
            tasks: [
              {
                title: `Revisar documento ${document.name}`,
                description:
                  "El sistema no pudo analizar automáticamente este documento. Se recomienda revisarlo manualmente.",
                priority: "Medium",
              },
            ],
          };
        }

        // Actualizar el registro de análisis
        await supabase
          .from("document_analysis")
          .update({
            analysis_status: "completed",
            analysis_timestamp: new Date().toISOString(),
            analysis_summary: parsedResult.summary,
            raw_response: aiMessage,
          })
          .eq("id", analysisRecord.id);

        return {
          summary: parsedResult.summary,
          tasks: parsedResult.tasks,
          raw: aiMessage,
        };
      } catch (downloadError) {
        // Actualizar el registro con el error
        await supabase
          .from("document_analysis")
          .update({
            analysis_status: "error",
            analysis_timestamp: new Date().toISOString(),
            analysis_summary: `Error: ${downloadError.message}`,
          })
          .eq("id", analysisRecord.id);

        throw downloadError;
      }
    } catch (error) {
      console.error("Error analyzing document:", error);
      throw error;
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
        `AIService: Extrayendo texto de archivo tipo: ${fileType}, tamaño: ${fileData.size} bytes`
      );

      // Para documentos de texto simple
      if (fileType === "txt" || fileType === "md") {
        const text = await fileData.text();
        console.log(
          `AIService: Texto extraído correctamente, longitud: ${text.length} caracteres`
        );
        return text;
      }

      // Para PDFs y otros formatos, usamos un placeholder
      // En una implementación real, usaríamos pdfjs-dist para PDFs, mammoth para DOCX, etc.
      const placeholder = `[Contenido simulado del documento ${filePath}]
      
Este es un documento de ejemplo para demostración del análisis de IA.

Proyecto: Desarrollo de aplicación web
Fecha: 2025

Objetivos principales:
1. Crear una interfaz de usuario intuitiva
2. Implementar sistema de autenticación seguro
3. Desarrollar API RESTful para comunicación con el backend
4. Asegurar compatibilidad con dispositivos móviles
5. Realizar pruebas de rendimiento y seguridad

Cronograma propuesto:
- Fase de diseño: 2 semanas
- Desarrollo frontend: 4 semanas
- Desarrollo backend: 4 semanas
- Integración y pruebas: 2 semanas
- Lanzamiento: 1 semana

Recursos necesarios:
- 2 desarrolladores frontend
- 2 desarrolladores backend
- 1 diseñador UI/UX
- 1 tester QA

Tecnologías a utilizar:
- React para frontend
- Node.js para backend
- PostgreSQL para base de datos
- Supabase para autenticación y almacenamiento
`;

      console.log(
        `AIService: Utilizando texto simulado para este tipo de archivo (${fileType})`
      );
      return placeholder;
    } catch (error) {
      console.error("Error extracting text from file:", error);
      return "[Error al extraer texto del documento. Utilizando contenido simulado para demostración.]";
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
};
