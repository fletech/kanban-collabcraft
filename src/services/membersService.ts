import { supabase } from "@/lib/supabase";

export type Member = {
  id: string;
  user_id: string;
  user: {
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
  role: "owner" | "admin" | "member" | "viewer";
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: Member["role"];
  created_at: string;
};

export const membersService = {
  /**
   * Obtiene los miembros de un proyecto específico
   */
  async fetchProjectMembers(projectId: string): Promise<Member[]> {
    console.log(`MembersService: Fetching members for project: ${projectId}`);

    const { data, error } = await supabase
      .from("project_members")
      .select(
        `
        id,
        user_id,
        role,
        user:users (
          full_name,
          avatar_url,
          email
        )
      `
      )
      .eq("project_id", projectId);

    if (error) throw error;

    // Transformar los datos para manejar correctamente la propiedad user
    const formattedMembers = data.map((member) => ({
      ...member,
      user: Array.isArray(member.user) ? member.user[0] : member.user,
    }));

    console.log(
      `MembersService: Found ${formattedMembers.length} members for project: ${projectId}`
    );
    return formattedMembers as Member[];
  },

  /**
   * Invita a un nuevo miembro al proyecto
   */
  async inviteMember(
    projectId: string,
    email: string,
    role: Member["role"]
  ): Promise<void> {
    // Implementación pendiente
    // Esta función se completará cuando implementes la funcionalidad de invitación
  },

  /**
   * Actualiza el rol de un miembro existente
   */
  async updateMemberRole(
    memberId: string,
    newRole: Member["role"]
  ): Promise<void> {
    // Implementación pendiente
    // Esta función se completará cuando implementes la funcionalidad de cambio de rol
  },

  /**
   * Elimina un miembro del proyecto
   */
  async removeMember(memberId: string): Promise<void> {
    // Implementación pendiente
    // Esta función se completará cuando implementes la funcionalidad de eliminación
  },
};
