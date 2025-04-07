import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, supabase } from "@/lib/supabase";
import {
  Plus,
  LayoutDashboard,
  FileText,
  MoreVertical,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Users,
} from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { useNavigation } from "@/contexts/NavigationContext";
import { useNavigate } from "react-router-dom";
import { useMember } from "@/contexts/MemberContext";
import { useState } from "react";

export function AppSidebar() {
  const {
    projects,
    myProjects,
    sharedProjects,
    editingProject,
    setEditingProject,
    isProjectDialogOpen,
    setIsProjectDialogOpen,
  } = useProjects();
  const {
    currentProjectId,
    navigateToProject,
    navigateToDashboard,
    navigateToAllProjects,
    navigateToNewProject,
  } = useNavigation();
  const navigate = useNavigate();

  // Estado para controlar qué secciones están expandidas
  const [myProjectsExpanded, setMyProjectsExpanded] = useState(false);
  const [sharedProjectsExpanded, setSharedProjectsExpanded] = useState(false);

  const handleProjectClick = (projectId: string) => {
    navigateToProject(projectId);
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
            <div className="space-y-1 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToDashboard}
                className="w-full justify-start"
              >
                <LayoutDashboard size={16} className="mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToAllProjects}
                className="w-full justify-start"
              >
                <FolderOpen size={16} className="mr-2" />
                All Projects
              </Button>
            </div>

            <Separator className="my-2" />

            {/* Sección de Mis Proyectos */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center text-sm font-semibold w-full justify-start p-2"
                  onClick={() => setMyProjectsExpanded(!myProjectsExpanded)}
                >
                  {myProjectsExpanded ? (
                    <ChevronDown size={16} className="mr-2" />
                  ) : (
                    <ChevronRight size={16} className="mr-2" />
                  )}
                  My Projects
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={navigateToNewProject}
                >
                  <Plus size={16} />
                </Button>
              </div>

              {myProjectsExpanded && (
                <div className="space-y-1 pl-2">
                  {myProjects.map((project) => (
                    <div
                      key={project.id}
                      className={cn("flex items-center group")}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleProjectClick(project.id)}
                        className={cn(
                          "w-full justify-start",
                          currentProjectId === project.id &&
                            "bg-accent text-accent-foreground font-bold text-md"
                        )}
                      >
                        <FileText size={16} className="mr-2 flex-shrink-0" />
                        <span className="truncate">{project.name}</span>
                      </Button>
                    </div>
                  ))}
                  {myProjects.length === 0 && (
                    <div className="px-2 py-2 text-center">
                      <p className="text-xs text-muted-foreground">
                        No projects yet
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={navigateToNewProject}
                      >
                        <Plus size={14} className="mr-2" />
                        Create Project
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sección de Proyectos Compartidos */}
            {sharedProjects.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center text-sm font-semibold w-full justify-start p-2"
                    onClick={() =>
                      setSharedProjectsExpanded(!sharedProjectsExpanded)
                    }
                  >
                    {sharedProjectsExpanded ? (
                      <ChevronDown size={16} className="mr-2" />
                    ) : (
                      <ChevronRight size={16} className="mr-2" />
                    )}
                    Shared with me
                  </Button>
                </div>

                {sharedProjectsExpanded && (
                  <div className="space-y-1 pl-2">
                    {sharedProjects.map((project) => (
                      <div
                        key={project.id}
                        className={cn("flex items-center group")}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleProjectClick(project.id)}
                          className={cn(
                            "w-full justify-start",
                            currentProjectId === project.id &&
                              "bg-accent text-accent-foreground font-bold text-md"
                          )}
                        >
                          <Users size={16} className="mr-2 flex-shrink-0" />
                          <span className="truncate">{project.name}</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        project={editingProject}
        onSuccess={() => {
          if (editingProject) {
            navigateToAllProjects();
          }
        }}
      />
    </div>
  );
}
