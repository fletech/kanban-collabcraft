import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProjectDashboard } from "@/components/projects/ProjectDashboard";
import { useMember } from "@/contexts/MemberContext";
import { membersService } from "@/services/membersService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import NewProject from "./NewProject";

export default function Project() {
  const { projectId } = useParams<{ projectId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const { toast } = useToast();
  const { setMembers } = useMember();

  // Si estamos en la ruta 'new', renderizar directamente el componente NewProject
  if (projectId === "new") {
    return <NewProject />;
  }

  useEffect(() => {
    async function loadProjectData() {
      if (!projectId) return;

      setIsLoading(true);

      try {
        const membersData = await membersService.fetchProjectMembers(projectId);
        setMembers(membersData);
        setMembersLoaded(true);
      } catch (error) {
        console.error("Error loading project data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del proyecto",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadProjectData();
  }, [projectId, setMembers, toast]);

  if (!projectId) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-red-500">
          Project ID is missing
        </h1>
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className="w-full h-[200px]" />;
  }

  return <ProjectDashboard projectId={projectId} />;
}
