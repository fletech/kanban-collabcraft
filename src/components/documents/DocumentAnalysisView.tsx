import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  MessageSquare,
  Play,
  Search,
  Files,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/contexts/DocumentContext";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { AnalysisContent } from "./AnalysisContent";
import { ChatContent } from "./ChatContent";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface DocumentCardProps {
  document: any;
  isSelected: boolean;
  onSelect: () => void;
  viewMode: "compact" | "detailed";
}

const DocumentCard = ({
  document,
  isSelected,
  onSelect,
  viewMode,
}: DocumentCardProps) => {
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

  if (viewMode === "compact") {
    return (
      <div
        className={cn(
          "p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer",
          isSelected && "bg-accent"
        )}
        onClick={onSelect}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm line-clamp-1">
                {document.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs font-normal">
                  {getFileTypeLabel(document.file_type)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(document.file_size)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "p-3 cursor-pointer hover:shadow-md transition-all duration-200",
        isSelected && "border-blue-500 bg-blue-50/50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className="bg-gray-100 p-2 rounded">
          <FileText className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{document.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs font-normal">
              {getFileTypeLabel(document.file_type)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(document.file_size)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

const AnalysisArea = () => {
  const { selectedDocument } = useDocuments();
  const {
    analysis,
    analyzing,
    chatMessages,
    sendChatMessage,
    analyzeDocument,
  } = useAnalysis();
  const [activeTab, setActiveTab] = useState<"analysis" | "chat">("analysis");

  const handleAnalyze = async () => {
    if (selectedDocument) {
      await analyzeDocument(
        selectedDocument,
        "Please analyze this document and suggest tasks."
      );
    }
  };

  if (!selectedDocument) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a document to analyze</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="border-b px-4 py-2 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-medium">{selectedDocument.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5 h-7 px-2.5",
              activeTab === "analysis" && "bg-white shadow-sm"
            )}
            onClick={() => setActiveTab("analysis")}
          >
            <FileText className="w-3.5 h-3.5" />
            Analysis
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5 h-7 px-2.5",
              activeTab === "chat" && "bg-white shadow-sm"
            )}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </Button>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 h-7 px-2.5 text-blue-600 hover:text-blue-700"
            disabled={analyzing}
            onClick={handleAnalyze}
          >
            <Play className="w-3.5 h-3.5" />
            {analyzing ? "Analyzing..." : "Analyze"}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {activeTab === "analysis" ? (
              <AnalysisContent
                analysis={analysis}
                documentId={selectedDocument.id}
              />
            ) : (
              <ChatContent
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                loading={analyzing}
              />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export const DocumentAnalysisView = () => {
  const { documents, selectedDocument, setSelectedDocument } = useDocuments();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"compact" | "detailed">("detailed");

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="w-64 border-r">
        <div className="p-2 border-b">
          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
            <Input
              placeholder="Search documents..."
              className="pl-8 h-8 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {filteredDocuments.length} documents
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7"
              onClick={() =>
                setViewMode(viewMode === "compact" ? "detailed" : "compact")
              }
            >
              {viewMode === "compact" ? (
                <LayoutGrid className="w-4 h-4" />
              ) : (
                <LayoutList className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div
            className={cn(
              "p-2",
              viewMode === "detailed" ? "space-y-2" : "space-y-0.5"
            )}
          >
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                isSelected={selectedDocument?.id === doc.id}
                onSelect={() => setSelectedDocument(doc)}
                viewMode={viewMode}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
      <AnalysisArea />
    </div>
  );
};
