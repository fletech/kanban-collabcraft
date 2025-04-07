import { useDocuments } from "@/contexts/DocumentContext";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import { Send, FileText, Bot, Loader2, ListTodo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProjectId } from "@/hooks/use-projectId";
import { useAuth } from "@/contexts/AuthContext";
import { aiService } from "@/services/aiService";
import { Badge } from "@/components/ui/badge";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DocumentChat() {
  const { selectedDocument } = useDocuments();
  const {
    analysis,
    analyzing,
    selectedTask,
    setSelectedTask,
    analyzeDocument,
    setAnalysis,
    chatMessages,
    chatLoading,
    sendChatMessage,
  } = useAnalysis();
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const projectId = useProjectId();
  const { user } = useAuth();

  // Cargar análisis previos si existen
  useEffect(() => {
    if (!selectedDocument) return;

    const fetchPreviousAnalysis = async () => {
      try {
        const previousAnalysis = await aiService.getDocumentAnalysis(
          selectedDocument.id
        );
        if (previousAnalysis?.raw_response) {
          const parsedAnalysis = JSON.parse(previousAnalysis.raw_response);
          setAnalysis(parsedAnalysis);
        }
      } catch (error) {
        console.error("Error fetching previous analysis:", error);
      }
    };

    fetchPreviousAnalysis();
  }, [selectedDocument, setAnalysis]);

  // Crear una tarea a partir de una sugerencia
  const handleCreateTask = useCallback(
    async (task: any) => {
      if (!selectedDocument || !projectId || !user) {
        toast({
          title: "Error",
          description: "No se puede crear la tarea. Información incompleta.",
          variant: "destructive",
        });
        return;
      }

      try {
        await aiService.createTaskFromSuggestion(
          task,
          selectedDocument.id,
          projectId,
          user.id
        );

        toast({
          title: "Tarea creada",
          description: `Se ha creado la tarea: ${task.title}`,
        });
      } catch (error: any) {
        console.error("Error creating task:", error);
        toast({
          title: "Error",
          description: error.message || "Error al crear la tarea",
          variant: "destructive",
        });
      }
    },
    [selectedDocument, projectId, user, toast]
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendChatMessage(message);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Must":
        return "bg-red-100 text-red-800";
      case "Huge":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-blue-100 text-blue-800";
      case "Tiny":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!selectedDocument) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>AI Document Analysis</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center">
          <Bot className="h-16 w-16 mx-auto text-primary/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Select a document</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Choose a document from the list to analyze it with AI and create
            tasks based on its content.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full flex flex-col h-[700px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Document Analysis</CardTitle>
          {!analyzing && !analysis && (
            <Button
              onClick={() => analyzeDocument(selectedDocument, projectId)}
            >
              <Bot className="mr-2 h-4 w-4" />
              Analyze Document
            </Button>
          )}
          {analyzing && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </Button>
          )}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <FileText className="mr-2 h-4 w-4" />
          {selectedDocument.name}
        </div>
      </CardHeader>

      <CardContent className="flex-grow overflow-hidden p-4">
        <Tabs defaultValue="analysis" className="h-full flex flex-col">
          <TabsList>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="flex-grow overflow-auto">
            {analyzing && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">
                    Analyzing document... This may take a minute.
                  </p>
                </div>
              </div>
            )}

            {!analyzing && !analysis && (
              <div className="text-center py-12">
                <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  AI-Powered Document Analysis
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Extract valuable insights and automatically generate tasks
                  from your document.
                </p>
                <Button
                  onClick={() => analyzeDocument(selectedDocument, projectId)}
                >
                  <Bot className="mr-2 h-4 w-4" />
                  Start Analysis
                </Button>
              </div>
            )}

            {!analyzing && analysis && (
              <div className="space-y-6">
                <div className="bg-secondary/30 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Document Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    {analysis.summary}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Suggested Tasks</h3>
                    <span className="text-xs text-muted-foreground">
                      {analysis.tasks?.length || 0} tasks found
                    </span>
                  </div>

                  <div className="space-y-3">
                    {analysis.tasks?.map((task: any, index: number) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 hover:bg-secondary/20 transition-colors cursor-pointer"
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{task.title}</h4>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateTask(task);
                            }}
                          >
                            <ListTodo className="h-3 w-3 mr-1" />
                            Create Task
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="chat"
            className="flex-grow overflow-hidden flex flex-col"
          >
            <ScrollArea className="flex-grow pr-4">
              <div className="space-y-4">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "assistant" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "assistant"
                          ? "bg-secondary/30"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-secondary/30">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="mt-4">
              <div className="flex items-center gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask a question about this document..."
                  disabled={chatLoading}
                />
                <Button type="submit" size="icon" disabled={chatLoading}>
                  {chatLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
