import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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
import { useNavigate } from "react-router-dom";

interface Member {
  id: string;
  user_id: string;
  user: {
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

export function ProjectDashboard() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { setEditingProject, setIsProjectDialogOpen, deleteProject, projects } =
    useProjects();
  const { projectId } = useParams<{ projectId: string }>();
  const [projectName, setProjectName] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [description, setDescription] = useState<string>("");
  const navigate = useNavigate();
  const handleDeleteProject = async () => {
    try {
      await deleteProject(projectId);
      navigate("/projects");
    } catch (error) {
      // Error ya manejado en el contexto
    }
  };
  const { toast } = useToast();

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectDetails = async () => {
      setLoading(true);
      try {
        // Fetch project details
        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (projectError) throw projectError;
        if (project) setProjectName(project.name);
        if (project) setDescription(project.description || "");

        // Fetch project members
        const { data: membersData, error: membersError } = await supabase
          .from("project_members")
          .select(
            `
            id,
            user_id,
            user:users (
              full_name,
              avatar_url,
              email
            )
          `
          )
          .eq("project_id", projectId);

        if (membersError) throw membersError;
        if (membersData) {
          setMembers(membersData as unknown as Member[]);
        }

        // Fetch project progress
        const { data: progressData, error: progressError } = await supabase
          .from("project_progress")
          .select("percentage")
          .eq("project_id", projectId)
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
    };

    fetchProjectDetails();
  }, [projectId, toast]);

  // Loading state
  if (loading) {
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
            {members.map((member) => (
              <Avatar key={member.id} className="border-2 border-background">
                <AvatarImage src={member.user?.avatar_url || undefined} />
                <AvatarFallback>
                  {member.user?.full_name?.charAt(0) ||
                    member.user?.email?.charAt(0) ||
                    "U"}
                </AvatarFallback>
              </Avatar>
            ))}
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
                      const project = projects.find((p) => p.id === projectId);
                      if (project) {
                        setEditingProject(project);
                        setIsProjectDialogOpen(true);
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
