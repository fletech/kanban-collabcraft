import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MembersList } from "@/components/members/MembersList/MembersList";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
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
import { PlusIcon, Edit2, Trash2, Settings } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";
import { useMember } from "@/contexts/MemberContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { useProjectId } from "@/hooks/use-projectId";

export function ProjectDashboard() {
  // Usar nuestro hook personalizado en lugar de useParams
  const projectId = useProjectId();
  // Usar solo navegación del contexto
  const { navigateToAllProjects } = useNavigation();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const {
    setEditingProject,
    setIsProjectDialogOpen,
    deleteProject,
    projects,
    getCachedProject,
    getProjectProgress,
    invalidateProjectCache,
  } = useProjects();

  // Usar el contexto de miembros
  const { members } = useMember();

  // Estado local para detalles y progreso del proyecto
  const [projectName, setProjectName] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [description, setDescription] = useState<string>("");

  // Referencias para seguimiento de cambios
  const lastProjectEditTime = useRef<number>(0);

  const { toast } = useToast();

  const handleDeleteProject = async () => {
    try {
      if (!projectId) return;
      await deleteProject(projectId);
      // Usar navegación del contexto
      navigateToAllProjects();
    } catch (error) {
      // Error ya manejado en el contexto
    }
  };

  // Función para cargar detalles del proyecto
  const fetchProjectDetails = useCallback(
    async (id: string) => {
      if (!id) return;

      // Marcar como cargando solo si no hay datos en caché
      const cachedProject = getCachedProject(id);
      const isFirstLoad = !cachedProject;

      if (isFirstLoad) {
        setLoading(true);
      }

      try {
        console.log(`Loading project details for: ${id}`);

        // Si tenemos datos en caché, usarlos primero para evitar parpadeo
        if (cachedProject) {
          console.log("Using cached project data:", cachedProject.name);
          setProjectName(cachedProject.name);
          setDescription(cachedProject.description || "");
          setProgress(cachedProject.progress || 0);
          // No marcamos como cargado aún, seguimos cargando en segundo plano
        }

        // Fetch project details desde la API
        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();

        if (projectError) throw projectError;
        if (project) {
          console.log(
            "Project details loaded:",
            project.name,
            project.description
          );
          setProjectName(project.name);
          setDescription(project.description || "");
        }

        // Fetch project progress
        const { data: progressData, error: progressError } = await supabase
          .from("project_progress")
          .select("percentage")
          .eq("project_id", id)
          .single();

        if (progressError && progressError.code !== "PGRST116")
          throw progressError;
        if (progressData) setProgress(progressData.percentage);
      } catch (error) {
        console.error("Error fetching project details:", error);
        toast({
          title: "Failed to load project details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast, getCachedProject]
  );

  // Efecto para cargar detalles del proyecto cuando cambia el ID
  useEffect(() => {
    if (projectId) {
      console.log(`[Dashboard] ProjectId changed to: ${projectId}`);

      // Primero intentamos cargar desde la caché
      const cachedProject = getCachedProject(projectId);
      if (cachedProject) {
        console.log("Using cached project data on navigation");
        setProjectName(cachedProject.name);
        setDescription(cachedProject.description || "");
        setProgress(cachedProject.progress || 0);
        setLoading(false);
      } else {
        // Si no hay caché, marcamos como loading y cargamos normalmente
        setLoading(true);
      }

      // De cualquier manera, actualizamos los datos
      fetchProjectDetails(projectId);
    }
  }, [projectId, fetchProjectDetails, getCachedProject]);

  // Suscripción en tiempo real para cambios en proyectos
  useEffect(() => {
    if (!projectId) return;

    console.log(`Setting up realtime subscription for project: ${projectId}`);

    const channel = supabase
      .channel(`project_details_${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          console.log("Project update detected:", payload);
          // Solo actualizar si no fue causado por nuestra propia edición
          const now = Date.now();
          if (now - lastProjectEditTime.current > 2000) {
            console.log("Updating project details from realtime event");
            invalidateProjectCache(projectId);
            fetchProjectDetails(projectId);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for project_details: ${status}`);
      });

    return () => {
      console.log(`Cleaning up project subscription`);
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchProjectDetails, invalidateProjectCache]);

  // Suscripción para progreso
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project_progress_${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_progress",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (
            payload.new &&
            "percentage" in payload.new &&
            typeof payload.new.percentage === "number"
          ) {
            setProgress(payload.new.percentage);
          } else {
            fetchProjectDetails(projectId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchProjectDetails]);

  // Monitorear cambios en los proyectos para actualizar la UI
  useEffect(() => {
    if (!projectId) return;

    // Encontrar el proyecto actual en la lista de proyectos
    const currentProject = projects.find((p) => p.id === projectId);
    if (currentProject) {
      // Si los detalles locales no coinciden con los del contexto global, actualizar
      if (
        currentProject.name !== projectName ||
        currentProject.description !== description
      ) {
        console.log("Project data in context changed, updating local state");
        setProjectName(currentProject.name);
        setDescription(currentProject.description || "");
      }
    }
  }, [projects, projectId, projectName, description]);

  // Loading state - mostrar skeleton solo si es primera carga
  if (loading && !projectName) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2 mt-6">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{projectName}</h1>

          <div className="flex items-center mt-2">
            <div className="w-64 mr-4">
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-sm text-muted-foreground">
              {progress}% complete
            </span>
          </div>
        </div>
        <div className="flex justify-end space-x-6">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member) => (
              <Avatar key={member.id} className="border-2 border-background">
                <AvatarImage src={member.user?.avatar_url || undefined} />
                <AvatarFallback>
                  {member.user?.full_name?.charAt(0) ||
                    member.user?.email?.charAt(0) ||
                    "U"}
                </AvatarFallback>
              </Avatar>
            ))}
            {members.length > 4 && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted border-2 border-background">
                <span className="text-xs font-medium">
                  +{members.length - 4}
                </span>
              </div>
            )}
            <Button variant="outline" size="icon" className="rounded-full ml-2">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-2 ">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      if (!projectId) return;

                      // Buscar el proyecto actual en el contexto global
                      const project = projects.find((p) => p.id === projectId);
                      if (project) {
                        // Marcar el tiempo de edición para evitar actualizaciones innecesarias
                        lastProjectEditTime.current = Date.now();

                        // No cambiar nada más en la UI hasta después de cerrar el diálogo
                        setEditingProject(project);
                        setIsProjectDialogOpen(true);

                        // Programar actualización después de cerrar el diálogo
                        const checkUpdatedProject = () => {
                          const updatedProject = projects.find(
                            (p) => p.id === projectId
                          );
                          if (updatedProject) {
                            console.log(
                              "Dialog closed, updating local state from context"
                            );
                            setProjectName(updatedProject.name);
                            setDescription(updatedProject.description || "");
                          }
                        };

                        // Este timeout es para asegurar que los cambios en el contexto
                        // ya se hayan propagado después de cerrar el diálogo
                        setTimeout(checkUpdatedProject, 300);
                      }
                    }}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Board Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Diálogo de confirmación para eliminar */}
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the project and all its tasks.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteProject}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="mt-4">
          <div className="text-muted-foreground">{description}</div>
        </TabsContent>
        <TabsContent value="board" className="mt-4">
          <KanbanBoard
            projectId={projectId || ""}
            onProgressUpdate={setProgress}
          />
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          <MembersList />
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <div className="text-muted-foreground">
            Project notes will appear here.
          </div>
        </TabsContent>
        <TabsContent value="test" className="mt-4">
          <div className="text-muted-foreground">
            Test information will appear here.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
