import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "./KanbanBoard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Must":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "Medium":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Tiny":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Huge":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 rounded-md border shadow-sm hover:shadow cursor-pointer min-h-[10vh] h-auto"
      onClick={onClick}
    >
      <h4 className="font-medium text-sm mb-2">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}
      <Badge
        variant="secondary"
        className={cn("font-normal text-xs", getPriorityColor(task.priority))}
      >
        {task.priority}
      </Badge>
    </div>
  );
}
