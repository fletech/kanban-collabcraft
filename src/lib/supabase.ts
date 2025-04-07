import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          description: string | null;
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string | null;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: string;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role: string;
          joined_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string | null;
        };
      };
      project_progress: {
        Row: {
          id: string;
          project_id: string;
          percentage: number;
          calculated_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          percentage: number;
          calculated_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          percentage?: number;
          calculated_at?: string | null;
        };
      };
      documents: {
        Row: {
          id: string;
          name: string;
          file_path: string;
          file_type: string;
          file_size: number;
          project_id: string;
          uploaded_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          file_path: string;
          file_type: string;
          file_size: number;
          project_id: string;
          uploaded_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          file_path?: string;
          file_type?: string;
          file_size?: number;
          project_id?: string;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_analysis: {
        Row: {
          id: string;
          document_id: string;
          analysis_status: string;
          analysis_timestamp: string;
          ai_provider: string;
          analysis_summary: string | null;
          raw_ai_response: string | null;
        };
        Insert: {
          id?: string;
          document_id: string;
          analysis_status: string;
          analysis_timestamp?: string;
          ai_provider: string;
          analysis_summary?: string | null;
          raw_ai_response?: string | null;
        };
        Update: {
          id?: string;
          document_id?: string;
          analysis_status?: string;
          analysis_timestamp?: string;
          ai_provider?: string;
          analysis_summary?: string | null;
          raw_ai_response?: string | null;
        };
      };
      task_sources: {
        Row: {
          id: string;
          task_id: string;
          source_type: string;
          document_id: string | null;
          source_details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          source_type: string;
          document_id?: string | null;
          source_details?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          source_type?: string;
          document_id?: string | null;
          source_details?: string | null;
          created_at?: string;
        };
      };
      statuses: {
        Row: {
          id: string;
          name: string;
          display_order: number;
          project_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_order: number;
          project_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_order?: number;
          project_id?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          priority: "Must" | "Medium" | "Tiny" | "Huge";
          status_id: string;
          project_id: string;
          created_by: string | null;
          assigned_to: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          priority: "Must" | "Medium" | "Tiny" | "Huge";
          status_id: string;
          project_id: string;
          created_by?: string | null;
          assigned_to?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          priority?: "Must" | "Medium" | "Tiny" | "Huge";
          status_id?: string;
          project_id?: string;
          created_by?: string | null;
          assigned_to?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string | null;
          auth_provider: string | null;
          auth_provider_id: string | null;
          created_at: string | null;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          auth_provider?: string | null;
          auth_provider_id?: string | null;
          created_at?: string | null;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          auth_provider?: string | null;
          auth_provider_id?: string | null;
          created_at?: string | null;
          last_login?: string | null;
        };
      };
    };
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
