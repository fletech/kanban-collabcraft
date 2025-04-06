import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MembersList } from "@/components/members/MembersList/MembersList";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { useToast } from "@/hooks/use-toast";
import { PlusIcon } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";
import { useMember } from "@/contexts/MemberContext";
import { MemberInviteDialog } from "@/components/members/MemberInvite/MemberInviteDialog.tsx";

// Recibir projectId como prop
interface ProjectDashboardProps {
  projectId: string;
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
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
  const { members, isLoading: membersLoading } = useMember();

  // Estado local para detalles y progreso del proyecto
  const [projectName, setProjectName] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const { toast } = useToast();

  // Función para cargar detalles del proyecto
  const fetchProjectDetails = useCallback(
    async (id: string) => {
      if (!id) return;

      setLoading(true);

      try {
        console.log(`Loading project details for: ${id}`);

        // Si tenemos datos en caché, usarlos primero para evitar parpadeo
        const cachedProject = getCachedProject(id);
        if (cachedProject) {
          console.log("Using cached project data:", cachedProject.name);
          setProjectName(cachedProject.name);
          setDescription(cachedProject.description || "");
          setProgress(cachedProject.progress || 0);
        }

        // Fetch project details desde la API
        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();

        if (projectError) throw projectError;
        if (project) {
          console.log("Project details loaded:", project.name);
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

  // Efecto para cargar detalles del proyecto
  useEffect(() => {
    console.log(`[Dashboard] Loading project with ID: ${projectId}`);
    fetchProjectDetails(projectId);

    // Configurar suscripciones en tiempo real
    const projectChannel = supabase
      .channel(`project_details_${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `id=eq.${projectId}`,
        },
        () => {
          console.log("Project update detected");
          invalidateProjectCache(projectId);
          fetchProjectDetails(projectId);
        }
      )
      .subscribe();

    const progressChannel = supabase
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
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(progressChannel);
    };
  }, [projectId, fetchProjectDetails, invalidateProjectCache]);

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
            <Button
              variant="outline"
              size="icon"
              className="rounded-full ml-2"
              onClick={() => setIsInviteDialogOpen(true)}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
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
          <KanbanBoard projectId={projectId} onProgressUpdate={setProgress} />
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
      <MemberInviteDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      />
    </div>
  );
}
