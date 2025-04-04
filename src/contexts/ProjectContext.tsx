import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Database, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "./NavigationContext";

type Project = Database["public"]["Tables"]["projects"]["Row"];

// Tipos adicionales para el caché de proyectos
interface ProjectDetails extends Project {
  progress?: number;
  lastFetched: number;
}

type ProjectCache = {
  [id: string]: ProjectDetails;
};

type ProjectContextType = {
  projects: Project[];
  refreshProjects: () => Promise<void>;
  editingProject: Project | null;
  setEditingProject: (project: Project | null) => void;
  isProjectDialogOpen: boolean;
  setIsProjectDialogOpen: (open: boolean) => void;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  // Nuevas funciones para el caché
  getCachedProject: (projectId: string) => ProjectDetails | null;
  getProjectProgress: (projectId: string) => number;
  invalidateProjectCache: (projectId: string) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Tiempo de expiración del caché en milisegundos (5 minutos)
const CACHE_EXPIRY = 5 * 60 * 1000;

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  // Usar useRef para el caché para evitar re-renders innecesarios
  const projectCacheRef = useRef<ProjectCache>({});
  const { toast } = useToast();
  const { currentProjectId } = useNavigation();

  // Función para obtener proyectos
  const fetchProjects = async () => {
    const { data } = await supabase.from("projects").select("*").order("name");
    if (data) {
      setProjects(data);

      // Actualizar el caché con los proyectos recién obtenidos
      data.forEach((project) => {
        const existingCache = projectCacheRef.current[project.id];
        projectCacheRef.current[project.id] = {
          ...project,
          progress: existingCache?.progress,
          lastFetched: Date.now(),
        };
      });
    }
  };

  // Función para obtener un proyecto del caché
  const getCachedProject = useCallback(
    (projectId: string): ProjectDetails | null => {
      const cachedProject = projectCacheRef.current[projectId];

      // Si el proyecto está en caché y no ha expirado
      if (
        cachedProject &&
        Date.now() - cachedProject.lastFetched < CACHE_EXPIRY
      ) {
        return cachedProject;
      }

      return null;
    },
    []
  );

  // Función para obtener el progreso de un proyecto
  const getProjectProgress = useCallback((projectId: string): number => {
    return projectCacheRef.current[projectId]?.progress || 0;
  }, []);

  // Función para invalidar el caché de un proyecto específico
  const invalidateProjectCache = useCallback((projectId: string) => {
    if (projectCacheRef.current[projectId]) {
      delete projectCacheRef.current[projectId];
    }
  }, []);

  // Carga de progreso de proyecto
  useEffect(() => {
    if (!currentProjectId) return;

    // Función para cargar progreso
    const fetchProjectProgress = async (id: string) => {
      try {
        const { data, error } = await supabase
          .from("project_progress")
          .select("percentage")
          .eq("project_id", id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data && projectCacheRef.current[id]) {
          projectCacheRef.current[id] = {
            ...projectCacheRef.current[id],
            progress: data.percentage,
            lastFetched: Date.now(),
          };
        }
      } catch (error) {
        console.error("Error fetching project progress:", error);
      }
    };

    // Cargar progreso para el proyecto actual
    fetchProjectProgress(currentProjectId);

    // Suscribirse a actualizaciones de progreso
    const channel = supabase
      .channel(`project_progress_${currentProjectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_progress",
          filter: `project_id=eq.${currentProjectId}`,
        },
        (payload) => {
          if (
            payload.new &&
            "percentage" in payload.new &&
            typeof payload.new.percentage === "number" &&
            projectCacheRef.current[currentProjectId]
          ) {
            projectCacheRef.current[currentProjectId] = {
              ...projectCacheRef.current[currentProjectId],
              progress: payload.new.percentage,
              lastFetched: Date.now(),
            };
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProjectId]);

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

      // Invalidar caché para este proyecto
      invalidateProjectCache(project.id);
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

      // Eliminar del caché
      invalidateProjectCache(projectId);
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
        refreshProjects: fetchProjects,
        editingProject,
        setEditingProject,
        isProjectDialogOpen,
        setIsProjectDialogOpen,
        updateProject,
        deleteProject,
        // Nuevas funciones para el caché
        getCachedProject,
        getProjectProgress,
        invalidateProjectCache,
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
