
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { projectId } = useParams<{ projectId: string }>();
  const [projectName, setProjectName] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
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

        // Fetch project members
        const { data: membersData, error: membersError } = await supabase
          .from("project_members")
          .select(`
            id,
            user_id,
            user:users (
              full_name,
              avatar_url,
              email
            )
          `)
          .eq("project_id", projectId);

        if (membersError) throw membersError;
        if (membersData) {
          setMembers(membersData as Member[]);
        }

        // Fetch project progress
        const { data: progressData, error: progressError } = await supabase
          .from("project_progress")
          .select("percentage")
          .eq("project_id", projectId)
          .single();

        if (progressError && progressError.code !== "PGRST116") throw progressError;
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
            <span className="text-sm text-muted-foreground">{progress}% complete</span>
          </div>
        </div>
        <div className="flex -space-x-2">
          {members.map((member) => (
            <Avatar key={member.id} className="border-2 border-background">
              <AvatarImage src={member.user?.avatar_url || undefined} />
              <AvatarFallback>
                {member.user?.full_name?.charAt(0) || member.user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          ))}
          <Button variant="outline" size="icon" className="rounded-full ml-2">
            <PlusIcon className="h-4 w-4" />
          </Button>
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
          <div className="text-muted-foreground">
            Project description and details will appear here.
          </div>
        </TabsContent>
        <TabsContent value="board" className="mt-4">
          <KanbanBoard projectId={projectId || ""} onProgressUpdate={setProgress} />
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
