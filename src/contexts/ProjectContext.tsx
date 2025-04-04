import { createContext, useContext, useEffect, useState } from "react";
import { Database, supabase } from "@/lib/supabase";

type Project = Database["public"]["Tables"]["projects"]["Row"];

type ProjectContextType = {
  projects: Project[];
  refreshProjects: () => Promise<void>;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = async () => {
    const { data } = await supabase.from("projects").select("*").order("name");
    if (data) {
      setProjects(data);
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
        fetchProjects
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <ProjectContext.Provider
      value={{ projects, refreshProjects: fetchProjects }}
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
