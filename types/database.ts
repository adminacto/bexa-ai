/**
 * BEXA AI Database Types
 * Auto-generated from Supabase schema
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          username: string;
          email: string;
          phone?: string | null;
          role: "OWNER" | "ADMIN" | "USER";
          status: "active" | "suspended" | "invited" | "banned";
          avatar_url?: string | null;
          created_at: string;
          updated_at: string;
          last_login?: string | null;
          last_activity?: string | null;
          force_password_change: boolean;
          invited_by?: string | null;
          timezone: string;
        };
        Insert: {
          id: string;
          user_id: string;
          full_name: string;
          username: string;
          email: string;
          phone?: string | null;
          role?: "OWNER" | "ADMIN" | "USER";
          status?: "active" | "suspended" | "invited" | "banned";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          last_activity?: string | null;
          force_password_change?: boolean;
          invited_by?: string | null;
          timezone?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          username?: string;
          email?: string;
          phone?: string | null;
          role?: "OWNER" | "ADMIN" | "USER";
          status?: "active" | "suspended" | "invited" | "banned";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          last_activity?: string | null;
          force_password_change?: boolean;
          invited_by?: string | null;
          timezone?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          project_number: string;
          name: string;
          description?: string | null;
          owner_id: string;
          status: "active" | "completed" | "paused" | "cancelled";
          start_date?: string | null;
          deadline?: string | null;
          budget: number;
          total_revenue: number;
          total_expenses: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_number: string;
          name: string;
          description?: string | null;
          owner_id: string;
          status?: "active" | "completed" | "paused" | "cancelled";
          start_date?: string | null;
          deadline?: string | null;
          budget?: number;
          total_revenue?: number;
          total_expenses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_number?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          status?: "active" | "completed" | "paused" | "cancelled";
          start_date?: string | null;
          deadline?: string | null;
          budget?: number;
          total_revenue?: number;
          total_expenses?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: "owner" | "manager" | "developer" | "designer" | "analyst" | "contributor";
          responsibilities?: string | null;
          start_date: string;
          revenue_share?: number | null;
          created_at: string;
          created_by?: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: "owner" | "manager" | "developer" | "designer" | "analyst" | "contributor";
          responsibilities?: string | null;
          start_date?: string;
          revenue_share?: number | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: "owner" | "manager" | "developer" | "designer" | "analyst" | "contributor";
          responsibilities?: string | null;
          start_date?: string;
          revenue_share?: number | null;
          created_at?: string;
          created_by?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          transaction_number: string;
          type: "revenue" | "expense" | "refund" | "transfer";
          amount: number;
          currency: "USD" | "UZS" | "EUR" | "RUB";
          date: string;
          user_id?: string | null;
          project_id?: string | null;
          payment_method?: string | null;
          status: "completed" | "pending" | "failed" | "cancelled";
          description?: string | null;
          authorized_creator?: string | null;
          transfer_from?: string | null;
          transfer_to?: string | null;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transaction_number: string;
          type: "revenue" | "expense" | "refund" | "transfer";
          amount: number;
          currency?: "USD" | "UZS" | "EUR" | "RUB";
          date?: string;
          user_id?: string | null;
          project_id?: string | null;
          payment_method?: string | null;
          status?: "completed" | "pending" | "failed" | "cancelled";
          description?: string | null;
          authorized_creator?: string | null;
          transfer_from?: string | null;
          transfer_to?: string | null;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transaction_number?: string;
          type?: "revenue" | "expense" | "refund" | "transfer";
          amount?: number;
          currency?: "USD" | "UZS" | "EUR" | "RUB";
          date?: string;
          user_id?: string | null;
          project_id?: string | null;
          payment_method?: string | null;
          status?: "completed" | "pending" | "failed" | "cancelled";
          description?: string | null;
          authorized_creator?: string | null;
          transfer_from?: string | null;
          transfer_to?: string | null;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          actor_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          details: any;
          ip_address?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          details?: any;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          details?: any;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          key: string;
          value: string;
          type: string;
          description?: string | null;
          is_public: boolean;
          updated_by?: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          type?: string;
          description?: string | null;
          is_public?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          type?: string;
          description?: string | null;
          is_public?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
