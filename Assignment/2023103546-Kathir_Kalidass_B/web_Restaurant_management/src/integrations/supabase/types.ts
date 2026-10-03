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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_visible: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_visible?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_visible?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string | null
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_order_value: number | null
          usage_count: number | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string | null
          current_stock: number | null
          expiry_date: string | null
          id: string
          min_stock_level: number | null
          name: string
          storage_location: string | null
          unit: string | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          expiry_date?: string | null
          id?: string
          min_stock_level?: number | null
          name: string
          storage_location?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          expiry_date?: string | null
          id?: string
          min_stock_level?: number | null
          name?: string
          storage_location?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          customer_id: string
          description: string | null
          id: string
          points: number
          reference_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergen_info: string[] | null
          calories: number | null
          category_id: string | null
          created_at: string | null
          customization_groups: Json | null
          deleted_at: string | null
          description: string | null
          dietary_tags: string[] | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_bestseller: boolean | null
          is_featured: boolean | null
          name: string
          original_price: number | null
          preparation_time: number | null
          price: number
          serving_size: string | null
          sort_order: number | null
          spice_level: number | null
          updated_at: string | null
        }
        Insert: {
          allergen_info?: string[] | null
          calories?: number | null
          category_id?: string | null
          created_at?: string | null
          customization_groups?: Json | null
          deleted_at?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          name: string
          original_price?: number | null
          preparation_time?: number | null
          price: number
          serving_size?: string | null
          sort_order?: number | null
          spice_level?: number | null
          updated_at?: string | null
        }
        Update: {
          allergen_info?: string[] | null
          calories?: number | null
          category_id?: string | null
          created_at?: string | null
          customization_groups?: Json | null
          deleted_at?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          name?: string
          original_price?: number | null
          preparation_time?: number | null
          price?: number
          serving_size?: string | null
          sort_order?: number | null
          spice_level?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          discount_amount: number | null
          discount_code: string | null
          estimated_ready_at: string | null
          id: string
          items: Json
          loyalty_points_earned: number | null
          loyalty_points_used: number | null
          order_number: string
          order_type: string | null
          payment_method: string | null
          payment_status: string | null
          rating: number | null
          ready_at: string | null
          review: string | null
          served_at: string | null
          service_charge: number | null
          special_instructions: string | null
          status: string | null
          subtotal: number | null
          table_id: string | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
          waiter_id: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          estimated_ready_at?: string | null
          id?: string
          items?: Json
          loyalty_points_earned?: number | null
          loyalty_points_used?: number | null
          order_number?: string
          order_type?: string | null
          payment_method?: string | null
          payment_status?: string | null
          rating?: number | null
          ready_at?: string | null
          review?: string | null
          served_at?: string | null
          service_charge?: number | null
          special_instructions?: string | null
          status?: string | null
          subtotal?: number | null
          table_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
          waiter_id?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          estimated_ready_at?: string | null
          id?: string
          items?: Json
          loyalty_points_earned?: number | null
          loyalty_points_used?: number | null
          order_number?: string
          order_type?: string | null
          payment_method?: string | null
          payment_status?: string | null
          rating?: number | null
          ready_at?: string | null
          review?: string | null
          served_at?: string | null
          service_charge?: number | null
          special_instructions?: string | null
          status?: string | null
          subtotal?: number | null
          table_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
          waiter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_waiter_id_fkey"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          allergies: string[] | null
          avatar_url: string | null
          created_at: string | null
          dietary_prefs: string[] | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          loyalty_points: number | null
          loyalty_tier: string | null
          phone: string | null
          referral_code: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          created_at?: string | null
          dietary_prefs?: string[] | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          phone?: string | null
          referral_code?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          created_at?: string | null
          dietary_prefs?: string[] | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          phone?: string | null
          referral_code?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          duration_minutes: number | null
          id: string
          occasion: string | null
          party_size: number
          reservation_date: string
          reservation_time: string
          special_requests: string | null
          status: string | null
          table_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          duration_minutes?: number | null
          id?: string
          occasion?: string | null
          party_size?: number
          reservation_date: string
          reservation_time: string
          special_requests?: string | null
          status?: string | null
          table_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          duration_minutes?: number | null
          id?: string
          occasion?: string | null
          party_size?: number
          reservation_date?: string
          reservation_time?: string
          special_requests?: string | null
          status?: string | null
          table_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          food_rating: number | null
          helpful_count: number | null
          id: string
          is_featured: boolean | null
          order_id: string | null
          rating: number
          response_text: string | null
          review_text: string | null
          service_rating: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          food_rating?: number | null
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          order_id?: string | null
          rating: number
          response_text?: string | null
          review_text?: string | null
          service_rating?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          food_rating?: number | null
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          order_id?: string | null
          rating?: number
          response_text?: string | null
          review_text?: string | null
          service_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          address: string | null
          closing_time: string | null
          created_at: string | null
          currency: string | null
          currency_symbol: string | null
          email: string | null
          id: string
          is_open: boolean | null
          opening_time: string | null
          order_ready_time: number | null
          phone: string | null
          reservation_duration: number | null
          restaurant_name: string | null
          service_charge: number | null
          tax_rate: number | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          closing_time?: string | null
          created_at?: string | null
          currency?: string | null
          currency_symbol?: string | null
          email?: string | null
          id?: string
          is_open?: boolean | null
          opening_time?: string | null
          order_ready_time?: number | null
          phone?: string | null
          reservation_duration?: number | null
          restaurant_name?: string | null
          service_charge?: number | null
          tax_rate?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          closing_time?: string | null
          created_at?: string | null
          currency?: string | null
          currency_symbol?: string | null
          email?: string | null
          id?: string
          is_open?: boolean | null
          opening_time?: string | null
          order_ready_time?: number | null
          phone?: string | null
          reservation_duration?: number | null
          restaurant_name?: string | null
          service_charge?: number | null
          tax_rate?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tables: {
        Row: {
          assigned_waiter_id: string | null
          capacity: number
          created_at: string | null
          current_order_id: string | null
          id: string
          is_active: boolean | null
          name: string | null
          section: string | null
          shape: string | null
          status: string | null
          table_number: string
          updated_at: string | null
          x_position: number | null
          y_position: number | null
        }
        Insert: {
          assigned_waiter_id?: string | null
          capacity?: number
          created_at?: string | null
          current_order_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          section?: string | null
          shape?: string | null
          status?: string | null
          table_number: string
          updated_at?: string | null
          x_position?: number | null
          y_position?: number | null
        }
        Update: {
          assigned_waiter_id?: string | null
          capacity?: number
          created_at?: string | null
          current_order_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          section?: string | null
          shape?: string | null
          status?: string | null
          table_number?: string
          updated_at?: string | null
          x_position?: number | null
          y_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_assigned_waiter_id_fkey"
            columns: ["assigned_waiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
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
