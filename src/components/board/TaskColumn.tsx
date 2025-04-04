import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "./KanbanBoard";
import TaskCard from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Plus, PlusIcon } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";

interface TaskColumnProps {
  status: {
    id: string;
    name: string;
    display_order: number;
  };
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export default function TaskColumn({
  status,
  tasks,
  onAddTask,
  onEditTask,
}: TaskColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status.id,
    data: {
      type: "Column",
      status: status,
    },
  });
  return (
    <div
      ref={setNodeRef}
      className="bg-muted/50 rounded-lg p-4 min-h-[40vh] flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{status.name}</h3>
          <span className="text-muted-foreground text-md">{tasks.length}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onAddTask}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onEditTask(task)}
          />
        ))}
        {tasks.length === 0 && (
          <div className=" min-h-[10vh] h-auto flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
            <p className="text-muted-foreground text-sm">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
    // <div className="flex flex-col bg-gray-50 rounded-lg border">
    //   <div className="p-3 border-b bg-white rounded-t-lg">
    //     <div className="flex items-center justify-between">
    //       <div className="flex items-center">
    //         <h3 className="font-medium">{status.name}</h3>
    //         <span className="ml-2 text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
    //           {tasks.length}
    //         </span>
    //       </div>
    //     </div>
    //   </div>

    //   <div className="p-2 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
    //     {tasks.length > 0 ? (
    //       <div className="space-y-2">
    //         {tasks.map((task) => (
    //           <TaskCard
    //             key={task.id}
    //             task={task}
    //             onClick={() => onEditTask(task)}
    //           />
    //         ))}
    //       </div>
    //     ) : (
    //       <div className="h-24 flex items-center justify-center text-sm text-gray-400">
    //         No tasks yet
    //       </div>
    //     )}
    //   </div>

    //   <div className="p-2 border-t">
    //     <Button
    //       variant="ghost"
    //       size="sm"
    //       className="w-full justify-start text-muted-foreground"
    //       onClick={onAddTask}
    //     >
    //       <PlusIcon className="mr-2 h-4 w-4" />
    //       Add Task
    //     </Button>
    //   </div>
    // </div>
  );
}
