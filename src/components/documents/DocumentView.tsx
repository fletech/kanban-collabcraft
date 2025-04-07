import { useState } from "react";
import { DocumentList } from "./DocumentList";
import { DocumentChat } from "./DocumentChat";
import { Document } from "@/services/documentsService";
import { useDocuments } from "@/contexts/DocumentContext";

export function DocumentView() {
  const { selectedDocument, setSelectedDocument } = useDocuments();

  const handleSelectDocument = (document: Document) => {
    setSelectedDocument(document);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <h2 className="text-xl font-bold mb-4">Documents</h2>
        <DocumentList onSelectDocumentForChat={handleSelectDocument} />
      </div>
      <div className="md:col-span-2">
        <h2 className="text-xl font-bold mb-4">AI Chat</h2>
        <DocumentChat />
      </div>
    </div>
  );
}
