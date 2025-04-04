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
};

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);

  const projectId = useProjectId();
  const { toast } = useToast();

  const fetchProjectMembers = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        const membersData = await membersService.fetchProjectMembers(id);
        setMembers(membersData);
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

  // Nueva función para refrescar miembros usando el projectId actual
  const refreshMembers = useCallback(async () => {
    if (!projectId) return;
    await fetchProjectMembers(projectId);
  }, [projectId, fetchProjectMembers]);

  // Implementaciones pendientes
  const inviteMember = async (email: string, role: Member["role"]) => {
    // Implementación pendiente
  };

  const updateMemberRole = async (
    memberId: string,
    newRole: Member["role"]
  ) => {
    // Implementación pendiente
  };

  const removeMember = async (memberId: string) => {
    // Implementación pendiente
  };

  // Cargar miembros cuando cambia projectId
  useEffect(() => {
    if (projectId) {
      fetchProjectMembers(projectId);
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
