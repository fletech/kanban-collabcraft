import { useState, useCallback } from "react";
import { useDocuments } from "@/contexts/DocumentContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, FileIcon } from "lucide-react";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/services/documentsService";

export function DocumentUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadDocument, isLoading } = useDocuments();

  // Handle file drag events
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // Handle file drop event
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  // Handle file selection from input
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelection(files[0]);
      }
    },
    []
  );

  // Validate and set the selected file
  const handleFileSelection = useCallback((file: File) => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert(`File type not allowed. Supported types: PDF, DOCX, TXT, MD`);
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      alert(
        `File is too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
      return;
    }

    setSelectedFile(file);
  }, []);

  // Upload the file
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      await uploadDocument(selectedFile);
      // Clear selection after upload
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }, [selectedFile, uploadDocument]);

  // Cancel selection
  const handleCancel = useCallback(() => {
    setSelectedFile(null);
  }, []);

  return (
    <div className="w-full mb-6">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/20"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <h3 className="text-lg font-medium">
              Drag a document here or click to upload
            </h3>
            <p className="text-sm text-muted-foreground">
              Supports PDF, DOCX, TXT, and MD. Maximum{" "}
              {MAX_FILE_SIZE / (1024 * 1024)}MB.
            </p>
            <input
              type="file"
              accept={ALLOWED_FILE_TYPES.join(",")}
              onChange={handleFileInput}
              className="hidden"
              id="document-upload"
            />
            <Button
              variant="secondary"
              onClick={() =>
                document.getElementById("document-upload")?.click()
              }
              className="mt-2"
            >
              Select file
            </Button>
          </div>
        </div>
      ) : (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileIcon className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleUpload} disabled={isLoading}>
                {isLoading ? "Uploading..." : "Upload document"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
