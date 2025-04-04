import { createContext, useContext, useEffect, useState } from "react";
import { Database, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type Project = Database["public"]["Tables"]["projects"]["Row"];

type ProjectContextType = {
  projects: Project[];
  activeProject: string | null;
  setActiveProject: (id: string | null) => void;
  refreshProjects: () => Promise<void>;
  editingProject: Project | null;
  setEditingProject: (project: Project | null) => void;
  isProjectDialogOpen: boolean;
  setIsProjectDialogOpen: (open: boolean) => void;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchProjects = async () => {
    const { data } = await supabase.from("projects").select("*").order("name");
    if (data) {
      setProjects(data);
    }
  };

  const updateProject = async (project: Project) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          name: project.name,
          description: project.description,
        })
        .eq("id", project.id);

      if (error) throw error;

      await fetchProjects();
      toast({ title: "Project updated successfully" });
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Failed to update project",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      await fetchProjects();
      toast({ title: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Failed to delete project",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchProjects();

    const channel = supabase.channel("projects_db_changes");
    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        refreshProjects: fetchProjects,
        editingProject,
        setEditingProject,
        isProjectDialogOpen,
        setIsProjectDialogOpen,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
};
