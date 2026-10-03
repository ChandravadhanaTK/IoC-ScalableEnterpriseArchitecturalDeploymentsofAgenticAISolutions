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
      agent_actions: {
        Row: {
          action_type: string
          agent_run_id: string | null
          approval_status: string
          attempt: number
          candidates: Json | null
          confidence: number | null
          created_at: string
          estimated_cost: number
          executed_at: string | null
          execution_status: string
          expected_arrival: string | null
          id: string
          po_id: string | null
          reason: string | null
          requires_approval: boolean
          route_id: string | null
          stockout_risk: string | null
          supplier_id: string | null
          verification: Json | null
        }
        Insert: {
          action_type: string
          agent_run_id?: string | null
          approval_status?: string
          attempt?: number
          candidates?: Json | null
          confidence?: number | null
          created_at?: string
          estimated_cost?: number
          executed_at?: string | null
          execution_status?: string
          expected_arrival?: string | null
          id?: string
          po_id?: string | null
          reason?: string | null
          requires_approval?: boolean
          route_id?: string | null
          stockout_risk?: string | null
          supplier_id?: string | null
          verification?: Json | null
        }
        Update: {
          action_type?: string
          agent_run_id?: string | null
          approval_status?: string
          attempt?: number
          candidates?: Json | null
          confidence?: number | null
          created_at?: string
          estimated_cost?: number
          executed_at?: string | null
          execution_status?: string
          expected_arrival?: string | null
          id?: string
          po_id?: string | null
          reason?: string | null
          requires_approval?: boolean
          route_id?: string | null
          stockout_risk?: string | null
          supplier_id?: string | null
          verification?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_agent_run_id_fkey"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_actions_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          completed_at: string | null
          disruption_id: string | null
          id: string
          processed_pos: number
          queue: Json
          started_at: string
          status: string
          summary: Json | null
          total_pos: number
        }
        Insert: {
          completed_at?: string | null
          disruption_id?: string | null
          id?: string
          processed_pos?: number
          queue?: Json
          started_at?: string
          status?: string
          summary?: Json | null
          total_pos?: number
        }
        Update: {
          completed_at?: string | null
          disruption_id?: string | null
          id?: string
          processed_pos?: number
          queue?: Json
          started_at?: string
          status?: string
          summary?: Json | null
          total_pos?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_disruption_id_fkey"
            columns: ["disruption_id"]
            isOneToOne: false
            referencedRelation: "disruptions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          actor: string
          agent_run_id: string | null
          created_at: string
          event_type: string
          id: string
          message: string
          metadata: Json | null
          po_id: string | null
        }
        Insert: {
          actor?: string
          agent_run_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          message: string
          metadata?: Json | null
          po_id?: string | null
        }
        Update: {
          actor?: string
          agent_run_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          po_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_agent_run_id_fkey"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      disruptions: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          id: string
          resolved_at: string | null
          severity: string
          status: string
          target_id: string
          target_type: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days: number
          id: string
          resolved_at?: string | null
          severity: string
          status?: string
          target_id: string
          target_type: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          target_id?: string
          target_type?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          daily_demand: number
          id: string
          location: string
          product_id: string | null
          quantity: number
          updated_at: string
        }
        Insert: {
          daily_demand: number
          id: string
          location: string
          product_id?: string | null
          quantity: number
          updated_at?: string
        }
        Update: {
          daily_demand?: number
          id?: string
          location?: string
          product_id?: string | null
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ports: {
        Row: {
          created_at: string
          id: string
          location: string
          name: string
          status: string
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          id: string
          location: string
          name: string
          status?: string
          x?: number
          y?: number
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          name?: string
          status?: string
          x?: number
          y?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          unit_cost: number
        }
        Insert: {
          category: string
          created_at?: string
          id: string
          name: string
          unit_cost: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          unit_cost?: number
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          base_status: string
          created_at: string
          current_route_id: string | null
          disruption_status: string
          eta_offset_days: number
          expected_arrival: string | null
          id: string
          original_route_id: string | null
          original_supplier_id: string | null
          original_unit_cost: number
          product_id: string | null
          quantity: number
          required_date: string | null
          required_offset_days: number
          status: string
          supplier_id: string | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          base_status: string
          created_at?: string
          current_route_id?: string | null
          disruption_status?: string
          eta_offset_days: number
          expected_arrival?: string | null
          id: string
          original_route_id?: string | null
          original_supplier_id?: string | null
          original_unit_cost: number
          product_id?: string | null
          quantity: number
          required_date?: string | null
          required_offset_days: number
          status: string
          supplier_id?: string | null
          unit_cost: number
          updated_at?: string
        }
        Update: {
          base_status?: string
          created_at?: string
          current_route_id?: string | null
          disruption_status?: string
          eta_offset_days?: number
          expected_arrival?: string | null
          id?: string
          original_route_id?: string | null
          original_supplier_id?: string | null
          original_unit_cost?: number
          product_id?: string | null
          quantity?: number
          required_date?: string | null
          required_offset_days?: number
          status?: string
          supplier_id?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_current_route_id_fkey"
            columns: ["current_route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_original_route_id_fkey"
            columns: ["original_route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_original_supplier_id_fkey"
            columns: ["original_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          active: boolean
          associated_port_id: string | null
          cost: number
          created_at: string
          destination: string
          id: string
          name: string
          origin: string
          reliability: number
          transit_days: number
          transport_mode: string
        }
        Insert: {
          active?: boolean
          associated_port_id?: string | null
          cost: number
          created_at?: string
          destination: string
          id: string
          name: string
          origin: string
          reliability?: number
          transit_days: number
          transport_mode: string
        }
        Update: {
          active?: boolean
          associated_port_id?: string | null
          cost?: number
          created_at?: string
          destination?: string
          id?: string
          name?: string
          origin?: string
          reliability?: number
          transit_days?: number
          transport_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_associated_port_id_fkey"
            columns: ["associated_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          available_quantity: number
          product_id: string
          supplier_id: string
          unit_cost: number
        }
        Insert: {
          available_quantity: number
          product_id: string
          supplier_id: string
          unit_cost: number
        }
        Update: {
          available_quantity?: number
          product_id?: string
          supplier_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string
          id: string
          lead_days: number
          location: string
          name: string
          region: string
          reliability_score: number
          status: string
        }
        Insert: {
          created_at?: string
          id: string
          lead_days?: number
          location: string
          name: string
          region: string
          reliability_score?: number
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_days?: number
          location?: string
          name?: string
          region?: string
          reliability_score?: number
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_demo: { Args: never; Returns: undefined }
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
