import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/supabase";

export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentAnalysis =
  Database["public"]["Tables"]["document_analysis"]["Row"];

// Tipos de archivos permitidos
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "text/plain",
  "text/markdown",
];

// Mapeo de tipos MIME a extensiones
export const MIME_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "text/plain": "txt",
  "text/markdown": "md",
};

// Tamaño máximo de archivo (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const documentsService = {
  /**
   * Sube un documento al storage de Supabase y registra su información en la base de datos
   */
  async uploadDocument(
    file: File,
    projectId: string,
    userId: string
  ): Promise<Document> {
    console.log(
      `DocumentsService: Uploading document ${file.name} for project ${projectId}`
    );

    // Validar tipo de archivo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error(`Tipo de archivo no permitido: ${file.type}`);
    }

    // Validar tamaño de archivo
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `El archivo excede el tamaño máximo de ${
          MAX_FILE_SIZE / (1024 * 1024)
        }MB`
      );
    }

    try {
      // 1. Subir archivo al storage
      const fileExt = MIME_EXTENSIONS[file.type] || "bin";
      const filePath = `documents/${projectId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (storageError) throw storageError;

      // 2. Registrar documento en la base de datos
      const { data, error: dbError } = await supabase
        .from("documents")
        .insert({
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          project_id: projectId,
          uploaded_by: userId,
        })
        .select("*")
        .single();

      if (dbError) throw dbError;

      console.log(
        `DocumentsService: Document uploaded successfully with id ${data.id}`
      );
      return data;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  },

  /**
   * Obtiene los documentos de un proyecto
   */
  async fetchProjectDocuments(projectId: string): Promise<Document[]> {
    console.log(
      `DocumentsService: Fetching documents for project ${projectId}`
    );

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log(
      `DocumentsService: Found ${data.length} documents for project ${projectId}`
    );
    return data;
  },

  /**
   * Obtiene un documento específico
   */
  async getDocument(documentId: string): Promise<Document> {
    console.log(`DocumentsService: Fetching document ${documentId}`);

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Elimina un documento
   */
  async deleteDocument(documentId: string): Promise<void> {
    console.log(`DocumentsService: Deleting document ${documentId}`);

    // 1. Obtener el documento para saber la ruta del archivo
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("file_path")
      .eq("id", documentId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Eliminar el archivo del storage
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([document.file_path]);

    if (storageError) {
      console.warn(
        `Error deleting document from storage: ${storageError.message}`
      );
      // Continuamos con la eliminación de la base de datos aunque falle el storage
    }

    // 3. Eliminar el registro de la base de datos
    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (dbError) throw dbError;

    console.log(`DocumentsService: Document deleted successfully`);
  },

  /**
   * Genera una URL para descargar un documento
   */
  getDocumentUrl(filePath: string): string {
    const { data } = supabase.storage.from("documents").getPublicUrl(filePath);

    return data.publicUrl;
  },
};
