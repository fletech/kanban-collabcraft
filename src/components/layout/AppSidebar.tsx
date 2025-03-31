
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, supabase } from "@/lib/supabase";
import { Plus, LayoutDashboard, FileText } from "lucide-react";
import { useEffect, useState } from "react";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export function AppSidebar() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("name");
      
      if (data) {
        setProjects(data);
        // Set first project as active if we don't have one selected
        if (data.length > 0 && !activeProject) {
          setActiveProject(data[0].id);
        }
      }
    };

    fetchProjects();
  }, [activeProject]);

  const handleProjectClick = (projectId: string) => {
    setActiveProject(projectId);
    navigate(`/projects/${projectId}`);
  };

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  return (
    <div className="h-screen border-r bg-sidebar flex flex-col w-64">
      <div className="p-4">
        <div className="flex items-center gap-2 px-2">
          <div className="bg-blue-600 text-white p-1 rounded">
            <LayoutDashboard size={18} />
          </div>
          <h1 className="text-xl font-bold">TaskFlow</h1>
        </div>
      </div>
      
      <Separator />
      
      <div className="flex-1 overflow-auto">
        <ScrollArea className="h-full">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Projects</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={handleCreateProject}
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="space-y-1">
              {projects.map((project) => (
                <Button
                  key={project.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleProjectClick(project.id)}
                  className={cn(
                    "w-full justify-start",
                    activeProject === project.id && "bg-accent text-accent-foreground"
                  )}
                >
                  <FileText size={16} className="mr-2" />
                  {project.name}
                </Button>
              ))}
              {projects.length === 0 && (
                <div className="px-2 py-4 text-center">
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleCreateProject}
                  >
                    <Plus size={16} className="mr-2" />
                    Create Project
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
