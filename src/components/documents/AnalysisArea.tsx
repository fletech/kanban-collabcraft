import { useDocuments } from "@/contexts/DocumentContext";
import { useState } from "react";
import { FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnalysisContent } from "@/components/documents/AnalysisContent";
import { ChatContent } from "@/components/documents/ChatContent";
import { useAnalysis } from "@/contexts/AnalysisContext";

export const AnalysisArea = () => {
  const { selectedDocument } = useDocuments();
  const { analysis, chatMessages, sendChatMessage } = useAnalysis();
  const [activeTab, setActiveTab] = useState<"analysis" | "chat">("analysis");

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
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            <h2 className="font-medium">{selectedDocument.name}</h2>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 overflow-hidden">
        <TabsContent value="analysis" className="h-full m-0">
          <AnalysisContent
            documentId={selectedDocument.id}
            analysis={analysis}
          />
        </TabsContent>
        <TabsContent value="chat" className="h-full m-0">
          <ChatContent
            messages={chatMessages}
            onSendMessage={sendChatMessage}
          />
        </TabsContent>
      </div>
    </div>
  );
};
