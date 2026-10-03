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
      agent_logs: {
        Row: {
          action: string
          agent: string
          created_at: string | null
          detail: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          action: string
          agent: string
          created_at?: string | null
          detail?: string | null
          id?: string
          status: string
          user_id: string
        }
        Update: {
          action?: string
          agent?: string
          created_at?: string | null
          detail?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      assessment_results: {
        Row: {
          created_at: string | null
          difficulty: string | null
          id: string
          questions: Json | null
          score: number
          skill: string
          total: number
          user_id: string
          weak_topics: Json | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          questions?: Json | null
          score: number
          skill: string
          total: number
          user_id: string
          weak_topics?: Json | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          questions?: Json | null
          score?: number
          skill?: string
          total?: number
          user_id?: string
          weak_topics?: Json | null
        }
        Relationships: []
      }
      career_analyses: {
        Row: {
          created_at: string | null
          gaps: Json
          id: string
          summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          gaps?: Json
          id?: string
          summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          gaps?: Json
          id?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mentor_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          assessment_completed: boolean
          created_at: string | null
          education: string | null
          experience_level: string | null
          full_name: string | null
          goals: string | null
          hours_per_week: number | null
          id: string
          learning_preferences: string | null
          project_types: string | null
          skills: Json
          target_industry: string | null
          target_role: string | null
          timeline_months: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_completed?: boolean
          created_at?: string | null
          education?: string | null
          experience_level?: string | null
          full_name?: string | null
          goals?: string | null
          hours_per_week?: number | null
          id: string
          learning_preferences?: string | null
          project_types?: string | null
          skills?: Json
          target_industry?: string | null
          target_role?: string | null
          timeline_months?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_completed?: boolean
          created_at?: string | null
          education?: string | null
          experience_level?: string | null
          full_name?: string | null
          goals?: string | null
          hours_per_week?: number | null
          id?: string
          learning_preferences?: string | null
          project_types?: string | null
          skills?: Json
          target_industry?: string | null
          target_role?: string | null
          timeline_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      roadmap_change_proposals: {
        Row: {
          changes: Json
          created_at: string | null
          decided_at: string | null
          id: string
          issue: string
          new_tasks: Json
          reason: string
          roadmap_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          changes?: Json
          created_at?: string | null
          decided_at?: string | null
          id?: string
          issue: string
          new_tasks?: Json
          reason: string
          roadmap_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          changes?: Json
          created_at?: string | null
          decided_at?: string | null
          id?: string
          issue?: string
          new_tasks?: Json
          reason?: string
          roadmap_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_change_proposals_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          milestone: string | null
          phase_index: number
          phase_title: string
          position: number
          practice: string | null
          prerequisites: string | null
          priority: string | null
          resources: Json | null
          roadmap_id: string
          skill: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          milestone?: string | null
          phase_index: number
          phase_title: string
          position?: number
          practice?: string | null
          prerequisites?: string | null
          priority?: string | null
          resources?: Json | null
          roadmap_id: string
          skill?: string | null
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          milestone?: string | null
          phase_index?: number
          phase_title?: string
          position?: number
          practice?: string | null
          prerequisites?: string | null
          priority?: string | null
          resources?: Json | null
          roadmap_id?: string
          skill?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_tasks_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          summary: string | null
          title: string | null
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          summary?: string | null
          title?: string | null
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          summary?: string | null
          title?: string | null
          user_id?: string
          version?: number
        }
        Relationships: []
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
