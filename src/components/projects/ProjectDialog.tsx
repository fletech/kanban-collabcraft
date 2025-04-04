import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrashIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useProjects } from "@/contexts/ProjectContext";
import { useNavigate } from "react-router-dom";
import { Database } from "@/lib/supabase";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Database["public"]["Tables"]["projects"]["Row"] | null;
  onSuccess: () => void;
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectDialogProps) {
  const {
    editingProject,
    isProjectDialogOpen,
    setIsProjectDialogOpen,
    updateProject,
    deleteProject,
  } = useProjects();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Agregamos este useEffect para autorellenar los campos
  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description || "");
    } else {
      // Limpiar campos si no hay proyecto en edición
      setName("");
      setDescription("");
    }
  }, [editingProject, isProjectDialogOpen]); // Se ejecuta cuando cambia el proyecto o se abre/cierra el diálogo

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !editingProject) return;

    setIsSubmitting(true);
    try {
      await updateProject({
        ...editingProject,
        name,
        description: description || null,
      });
      setIsProjectDialogOpen(false);
    } catch (error) {
      // Error ya manejado en el contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingProject) return;
    setIsSubmitting(true);
    try {
      await deleteProject(editingProject.id);
      setIsProjectDialogOpen(false);
      navigate("/projects");
    } catch (error) {
      // Error ya manejado en el contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Project description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProjectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
