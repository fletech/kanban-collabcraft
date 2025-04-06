import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProjectDashboard } from "@/components/projects/ProjectDashboard";
import { useMember } from "@/contexts/MemberContext";
import { membersService } from "@/services/membersService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Project() {
  // 1. Extraer ID explícitamente de la URL
  const { projectId } = useParams<{ projectId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const { toast } = useToast();
  const { setMembers } = useMember();

  // 2. Precargar datos esenciales
  useEffect(() => {
    async function loadProjectData() {
      if (!projectId) return;

      setIsLoading(true);

      try {
        // Cargar miembros directamente aquí
        console.log(`Project: Loading members for project ${projectId}`);
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
    return (
      <div className="p-6">
        <Skeleton className="h-12 w-48 mb-4" />
        <Skeleton className="h-4 w-64 mb-6" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // 3. Pasar projectId explícitamente
  return <ProjectDashboard projectId={projectId} />;
}
