import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useProjectId } from "@/hooks/use-projectId";
import { useAuth } from "@/contexts/AuthContext";
import { aiService } from "@/services/aiService";

interface AnalysisContentProps {
  analysis: any;
  documentId: string;
}

export const AnalysisContent = ({
  analysis,
  documentId,
}: AnalysisContentProps) => {
  const { toast } = useToast();
  const projectId = useProjectId();
  const { user } = useAuth();

  const handleCreateTask = async (task: any) => {
    if (!documentId || !projectId || !user) {
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
        documentId,
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
  };

  const handleCreateAllTasks = async () => {
    if (!analysis?.tasks?.length) return;

    try {
      for (const task of analysis.tasks) {
        await handleCreateTask(task);
      }

      toast({
        title: "Tareas creadas",
        description: "Se han creado todas las tareas sugeridas",
      });
    } catch (error) {
      console.error("Error creating all tasks:", error);
      toast({
        title: "Error",
        description: "Hubo un error al crear algunas tareas",
        variant: "destructive",
      });
    }
  };

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-sm">No analysis available for this document</p>
        <p className="text-xs text-gray-400">
          Click the Analyze button to start
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          Document Summary
        </h3>
        <p className="text-sm text-blue-800">{analysis.summary}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Suggested Tasks</h3>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 px-2.5"
            onClick={handleCreateAllTasks}
          >
            <Plus className="w-3.5 h-3.5" />
            Add All Tasks
          </Button>
        </div>
        <div className="space-y-2">
          {analysis.tasks?.map((task: any, index: number) => (
            <div
              key={index}
              className="group border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {task.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2.5"
                  onClick={() => handleCreateTask(task)}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
