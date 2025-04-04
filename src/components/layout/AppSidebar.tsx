import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";
import { ProjectDialog } from "@/components/projects/ProjectDialog";

export function AppSidebar() {
  const {
    projects,
    activeProject,
    editingProject,
    setActiveProject,
    setEditingProject,
    isProjectDialogOpen,
    setIsProjectDialogOpen,
  } = useProjects();
  const navigate = useNavigate();

  const handleProjectClick = (projectId: string) => {
    setActiveProject(projectId);
    navigate(`/projects/${projectId}`);
  };

  const handleEditProject = (
    project: Database["public"]["Tables"]["projects"]["Row"]
  ) => {
    setEditingProject(project);
    setIsProjectDialogOpen(true);
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
                onClick={() => navigate("/projects")}
                className="w-full justify-start"
              >
                <LayoutDashboard size={16} className="mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/projects")}
                className="w-full justify-start"
              >
                <FolderOpen size={16} className="mr-2" />
                All Projects
              </Button>
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Projects</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigate("/projects/new")}
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="space-y-1">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={cn("flex items-center group ")}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleProjectClick(project.id)}
                    className={cn(
                      "w-full justify-start",
                      activeProject === project.id &&
                        "bg-accent text-accent-foreground font-bold text-md"
                    )}
                  >
                    <FileText size={16} className="mr-2 flex-shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </Button>
                  {/* <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 group-hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProject(project);
                    }}
                  >
                    <MoreVertical size={16} />
                  </Button> */}
                </div>
              ))}
              {projects.length === 0 && (
                <div className="px-2 py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No projects yet
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => navigate("/projects/new")}
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

      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        project={editingProject}
        onSuccess={() => {
          if (editingProject) {
            navigate("/projects");
          }
        }}
      />
    </div>
  );
}
