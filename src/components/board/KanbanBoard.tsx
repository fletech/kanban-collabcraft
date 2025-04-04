import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit2, Trash2, Settings } from "lucide-react";
import { Button } from "../ui/button";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import TaskColumn from "./TaskColumn";
import TaskCard from "./TaskCard";
import TaskDialog from "./TaskDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import { useNavigate } from "react-router-dom";

type Status = {
  id: string;
  name: string;
  display_order: number;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: "Must" | "Medium" | "Tiny" | "Huge";
  status_id: string;
};

type KanbanBoardProps = {
  projectId: string;
  onProgressUpdate: (progress: number) => void;
};

export function KanbanBoard({ projectId, onProgressUpdate }: KanbanBoardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { setEditingProject, setIsProjectDialogOpen, deleteProject, projects } =
    useProjects();
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  useEffect(() => {
    if (!projectId) return;

    const fetchBoardData = async () => {
      try {
        // Fetch statuses
        const { data: statusData, error: statusError } = await supabase
          .from("statuses")
          .select("*")
          .eq("project_id", projectId)
          .order("display_order");

        if (statusError) throw statusError;
        if (statusData) setStatuses(statusData);

        // Fetch tasks
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", projectId);

        if (taskError) throw taskError;
        if (taskData) setTasks(taskData);

        // Calculate progress based on completed tasks
        calculateProgress(statusData, taskData);
      } catch (error) {
        console.error("Error fetching board data:", error);
        toast({
          title: "Failed to load board data",
          variant: "destructive",
        });
      }
    };

    fetchBoardData();
  }, [projectId, toast]);

  const calculateProgress = (statuses: Status[], tasks: Task[]) => {
    if (!statuses?.length || !tasks?.length) {
      onProgressUpdate(0);
      return;
    }

    // Find 'Done' status
    const doneStatus = statuses.find(
      (status) => status.name.toLowerCase() === "done"
    );

    if (!doneStatus) {
      onProgressUpdate(0);
      return;
    }

    // Calculate percentage of tasks in 'Done' status
    const completedTasks = tasks.filter(
      (task) => task.status_id === doneStatus.id
    ).length;
    const totalTasks = tasks.length;
    const progressPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Update project progress in database
    updateProjectProgress(progressPercentage);

    // Update UI
    onProgressUpdate(progressPercentage);
  };

  const updateProjectProgress = async (percentage: number) => {
    try {
      await supabase.from("project_progress").upsert(
        {
          project_id: projectId,
          percentage,
          calculated_at: new Date().toISOString(),
        },
        { onConflict: "project_id" }
      );
    } catch (error) {
      console.error("Error updating project progress:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;

    if (active.data.current?.type === "Task") {
      const task = tasks.find((t) => t.id === activeId) || null;
      setActiveTask(task);
    } else if (active.data.current?.type === "Column") {
      setActiveColumn(activeId);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (active.data.current?.type !== "Task") return;

    // Encontrar el status_id de la columna sobre la que estamos
    let newStatusId = overId;

    // Si estamos sobre una tarea, obtener el status_id de su columna
    if (over.data.current?.type === "Task") {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatusId = overTask.status_id;
      }
    }

    // Actualizar la tarea localmente
    setTasks((prev) =>
      prev.map((task) =>
        task.id === activeId ? { ...task, status_id: newStatusId } : task
      )
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (active.data.current?.type === "Task") {
      try {
        let newStatusId = overId;

        // Si soltamos sobre una tarea, usar el status de esa tarea
        if (over.data.current?.type === "Task") {
          const overTask = tasks.find((t) => t.id === overId);
          if (overTask) {
            newStatusId = overTask.status_id;
          }
        }

        // Actualizar en la base de datos
        const { error } = await supabase
          .from("tasks")
          .update({ status_id: newStatusId })
          .eq("id", activeId);

        if (error) throw error;

        // Recalcular progreso
        calculateProgress(statuses, tasks);

        toast({
          title: "Task status updated",
        });
      } catch (error) {
        console.error("Error updating task status:", error);
        toast({
          title: "Failed to update task status",
          variant: "destructive",
        });

        // Revertir cambios si hay error
        fetchTasks();
      }
    }

    setActiveTask(null);
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      if (data) {
        setTasks(data);
        calculateProgress(statuses, data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleAddTask = (statusId: string) => {
    setEditingTask(null);
    setEditingStatusId(statusId);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditingStatusId(task.status_id);
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      if (editingTask) {
        // Update existing task
        const { data, error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", editingTask.id)
          .select()
          .single();

        if (error) throw error;

        setTasks((prev) =>
          prev.map((task) =>
            task.id === editingTask.id ? { ...task, ...data } : task
          )
        );

        toast({
          title: "Task updated successfully",
        });
      } else {
        // Create new task
        const newTask = {
          ...taskData,
          project_id: projectId,
          status_id: editingStatusId!,
          created_by: user?.id,
        };

        const { data, error } = await supabase
          .from("tasks")
          .insert(newTask)
          .select()
          .single();

        if (error) throw error;

        setTasks((prev) => [...prev, data as Task]);

        toast({
          title: "Task created successfully",
        });
      }

      // Recalculate progress
      fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Failed to save task",
        variant: "destructive",
      });
    } finally {
      setIsTaskDialogOpen(false);
      setEditingTask(null);
      setEditingStatusId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;

      setTasks((prev) => prev.filter((task) => task.id !== taskId));

      toast({
        title: "Task deleted successfully",
      });

      // Recalculate progress
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      setIsTaskDialogOpen(false);
      setEditingTask(null);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProject(projectId);
      navigate("/projects");
    } catch (error) {
      // Error ya manejado en el contexto
    }
  };

  const getTasksByStatus = (statusId: string) => {
    return tasks.filter((task) => task.status_id === statusId);
  };

  return (
    <div className="h-full flex flex-col">
      {/* <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {projects.find((p) => p.id === projectId)?.name}
          </h2>
        </div>
      </div> */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {statuses.map((status) => (
            <TaskColumn
              key={status.id}
              status={status}
              tasks={getTasksByStatus(status.id)}
              onAddTask={() => handleAddTask(status.id)}
              onEditTask={handleEditTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={editingTask}
        statuses={statuses}
        onSave={handleSaveTask}
        onDelete={editingTask ? handleDeleteTask : undefined}
        initialStatusId={editingStatusId}
      />
    </div>
  );
}
