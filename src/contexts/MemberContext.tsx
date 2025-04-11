import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { useProjectId } from "@/hooks/use-projectId";
import { useRealtimeSubscription } from "@/hooks/use-realtimeSubscription";
import {
  membersService,
  Member,
  PendingInvitation,
} from "@/services/membersService";
import { supabase } from "@/lib/supabase";

type MemberContextType = {
  members: Member[];
  isLoading: boolean;
  editingMember: Member | null;
  pendingInvitations: PendingInvitation[];
  fetchProjectMembers: (projectId: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
  inviteMember: (email: string, role: Member["role"]) => Promise<void>;
  updateMemberRole: (
    memberId: string,
    newRole: Member["role"]
  ) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  setEditingMember: (member: Member | null) => void;
  setMembers: (members: Member[]) => void;
};

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const projectId = useProjectId();
  const { toast } = useToast();

  // Simplificada para recibir projectId explícitamente
  const fetchProjectMembers = useCallback(
    async (projectId: string) => {
      // No intentar cargar miembros si estamos en la ruta new
      if (projectId === "new") {
        setMembers([]);
        return;
      }

      try {
        setIsLoading(true);
        console.log(
          `MemberContext: Fetching members for project: ${projectId}`
        );

        const membersData = await membersService.fetchProjectMembers(projectId);
        setMembers(membersData);
        setCurrentProjectId(projectId);
      } catch (error) {
        console.error("Error fetching members:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los miembros del proyecto",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Ahora requiere projectId explícito
  const refreshMembers = useCallback(async () => {
    if (!projectId) return;
    await fetchProjectMembers(projectId);
  }, [projectId, fetchProjectMembers]);

  const inviteMember = async (email: string, role: Member["role"]) => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "No project selected",
        variant: "destructive",
      });
      return;
    }

    try {
      await membersService.inviteMember(projectId, email, role);
      // Refrescar la lista de miembros
      await refreshMembers();
    } catch (error) {
      console.error("Error inviting member:", error);
      toast({
        title: "Error",
        description: "Failed to invite member",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateMemberRole = async (
    memberId: string,
    newRole: Member["role"]
  ) => {
    // Implementación pendiente
  };

  const removeMember = async (memberId: string) => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "No project selected",
        variant: "destructive",
      });
      return;
    }

    try {
      await membersService.removeMember(memberId);
      // Actualizar el estado local para eliminar el miembro
      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.id !== memberId)
      );
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Cargar miembros cuando cambia projectId
  useEffect(() => {
    if (projectId) {
      console.log(`MemberContext: Project ID changed to ${projectId}`);
      fetchProjectMembers(projectId);
    } else {
      // Limpiar el estado cuando no hay proyecto seleccionado
      setMembers([]);
      setCurrentProjectId(null);
    }
  }, [projectId, fetchProjectMembers]);

  // Suscripción en tiempo real
  const handleRealtimeUpdate = useCallback(() => {
    if (projectId) {
      fetchProjectMembers(projectId);
    }
  }, [projectId, fetchProjectMembers]);

  useRealtimeSubscription("project_members", projectId, handleRealtimeUpdate);

  const value: MemberContextType = {
    members,
    isLoading,
    editingMember,
    pendingInvitations,
    fetchProjectMembers,
    refreshMembers,
    inviteMember,
    updateMemberRole,
    removeMember,
    setEditingMember,
    setMembers,
  };

  return (
    <MemberContext.Provider value={value}>{children}</MemberContext.Provider>
  );
}

export const useMember = () => {
  const context = useContext(MemberContext);
  if (context === undefined) {
    throw new Error("useMember must be used within a MemberProvider");
  }
  return context;
};
