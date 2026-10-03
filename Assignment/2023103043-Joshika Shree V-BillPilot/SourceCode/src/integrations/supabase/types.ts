export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          agent_name: string | null
          confidence: number | null
          created_at: string
          error: string | null
          execution_time: number | null
          id: string
          output: Json | null
          status: string | null
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          agent_name?: string | null
          confidence?: number | null
          created_at?: string
          error?: string | null
          execution_time?: number | null
          id?: string
          output?: Json | null
          status?: string | null
          user_id?: string
          workflow_id?: string | null
        }
        Update: {
          agent_name?: string | null
          confidence?: number | null
          created_at?: string
          error?: string | null
          execution_time?: number | null
          id?: string
          output?: Json | null
          status?: string | null
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      anomalies: {
        Row: {
          bill_id: string | null
          created_at: string
          current_amount: number | null
          id: string
          percentage_change: number | null
          previous_amount: number | null
          severity: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          bill_id?: string | null
          created_at?: string
          current_amount?: number | null
          id?: string
          percentage_change?: number | null
          previous_amount?: number | null
          severity?: string | null
          type?: string | null
          user_id?: string
        }
        Update: {
          bill_id?: string | null
          created_at?: string
          current_amount?: number | null
          id?: string
          percentage_change?: number | null
          previous_amount?: number | null
          severity?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anomalies_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          action?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id?: string
        }
        Update: {
          action?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          amount: number | null
          billing_date: string | null
          category: string | null
          confidence: number | null
          created_at: string
          currency: string | null
          document_url: string | null
          due_date: string | null
          file_name: string | null
          id: string
          invoice_number: string | null
          merchant: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          billing_date?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          currency?: string | null
          document_url?: string | null
          due_date?: string | null
          file_name?: string | null
          id?: string
          invoice_number?: string | null
          merchant?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number | null
          billing_date?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          currency?: string | null
          document_url?: string | null
          due_date?: string | null
          file_name?: string | null
          id?: string
          invoice_number?: string | null
          merchant?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          role: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          role?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          bill_id: string | null
          created_at: string
          id: string
          message: string | null
          reminder_date: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          bill_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          reminder_date?: string | null
          status?: string | null
          user_id?: string
        }
        Update: {
          bill_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          reminder_date?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string
          currency: string | null
          frequency: string | null
          id: string
          merchant: string
          next_billing_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string | null
          frequency?: string | null
          id?: string
          merchant: string
          next_billing_date?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string | null
          frequency?: string | null
          id?: string
          merchant?: string
          next_billing_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      workflow_runs: {
        Row: {
          ai_mode: string | null
          bill_id: string | null
          completed_at: string | null
          current_agent: string | null
          id: string
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          ai_mode?: string | null
          bill_id?: string | null
          completed_at?: string | null
          current_agent?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Update: {
          ai_mode?: string | null
          bill_id?: string | null
          completed_at?: string | null
          current_agent?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
