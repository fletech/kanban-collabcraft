// src/services/membersService.ts
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
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error("Error checking existing user:", userError);
      throw userError;
    }

    // Si el usuario existe, agregarlo directamente
    if (existingUser) {
      const { error: memberError } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: existingUser.id,
          role: role,
        });

      if (memberError) {
        console.error("Error adding existing user to project:", memberError);
        throw memberError;
      }

      console.log(
        `MembersService: Added existing user ${email} to project ${projectId}`
      );
      return;
    }

    // Si el usuario no existe, agregar a pendingInvitations
    const { error: inviteError } = await supabase
      .from("pending_invitations")
      .insert({
        project_id: projectId,
        email: email,
        role: role,
        created_at: new Date().toISOString(),
      });

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);
      throw inviteError;
    }

    console.log(
      `MembersService: Created invitation for ${email} to project ${projectId}`
    );
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
    console.log(`MembersService: Removing member with ID: ${memberId}`);

    try {
      // En lugar de usar los métodos ORM de Supabase, vamos a usar una consulta SQL directa
      // para evitar cualquier trigger o subconsulta que pueda estar causando problemas
      const { error } = await supabase.rpc("remove_member_by_id", {
        member_id: memberId,
      });

      if (error) {
        console.error("Error removing member:", error);
        throw error;
      }

      console.log(
        `MembersService: Successfully removed member with ID: ${memberId}`
      );
    } catch (error) {
      console.error("Error in removeMember operation:", error);
      throw error;
    }
  },
};
