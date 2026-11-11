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
      catalog_meta: {
        Row: {
          id: number
          is_complete: boolean
          national_total: number
        }
        Insert: {
          id?: number
          is_complete?: boolean
          national_total?: number
        }
        Update: {
          id?: number
          is_complete?: boolean
          national_total?: number
        }
        Relationships: []
      }
      municipalities: {
        Row: {
          coat_of_arms_url: string | null
          id: string
          istat_code: string
          name: string
          official_istat_code: string | null
          province_code: string
          region_code: string
          slug: string
        }
        Insert: {
          coat_of_arms_url?: string | null
          id?: string
          istat_code: string
          name: string
          official_istat_code?: string | null
          province_code: string
          region_code: string
          slug: string
        }
        Update: {
          coat_of_arms_url?: string | null
          id?: string
          istat_code?: string
          name?: string
          official_istat_code?: string | null
          province_code?: string
          region_code?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipalities_province_code_fkey"
            columns: ["province_code"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "municipalities_region_code_fkey"
            columns: ["region_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
        ]
      }
      provinces: {
        Row: {
          abbreviation: string
          code: string
          name: string
          region_code: string
        }
        Insert: {
          abbreviation: string
          code: string
          name: string
          region_code: string
        }
        Update: {
          abbreviation?: string
          code?: string
          name?: string
          region_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "provinces_region_code_fkey"
            columns: ["region_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
        ]
      }
      regions: {
        Row: {
          code: string
          name: string
          slug: string
        }
        Insert: {
          code: string
          name: string
          slug: string
        }
        Update: {
          code?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_featured_badges: {
        Row: {
          badge_id: string
          position: number
          user_id: string
        }
        Insert: {
          badge_id: string
          position: number
          user_id: string
        }
        Update: {
          badge_id?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_featured_badges_user_id_badge_id_fkey"
            columns: ["user_id", "badge_id"]
            isOneToOne: true
            referencedRelation: "user_badges"
            referencedColumns: ["user_id", "badge_id"]
          },
        ]
      }
      user_visits: {
        Row: {
          id: string
          istat_code: string
          notes: string | null
          updated_at: string
          user_id: string
          visit_date: string | null
          visited: boolean
        }
        Insert: {
          id?: string
          istat_code: string
          notes?: string | null
          updated_at?: string
          user_id: string
          visit_date?: string | null
          visited?: boolean
        }
        Update: {
          id?: string
          istat_code?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          visit_date?: string | null
          visited?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_visits_istat_code_fkey"
            columns: ["istat_code"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["istat_code"]
          },
        ]
      }
      visit_media: {
        Row: {
          caption: string | null
          created_at: string
          file_name: string
          id: string
          is_cover: boolean
          istat_code: string
          media_type: string
          storage_path: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_name: string
          id?: string
          is_cover?: boolean
          istat_code: string
          media_type: string
          storage_path: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_name?: string
          id?: string
          is_cover?: boolean
          istat_code?: string
          media_type?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_media_istat_code_fkey"
            columns: ["istat_code"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["istat_code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_user_badges: { Args: { _user: string }; Returns: undefined }
      badge_metrics: { Args: { _user: string }; Returns: Json }
      badge_rules: {
        Args: never
        Returns: {
          badge_id: string
          metric: string
          threshold: number
        }[]
      }
      set_my_city_cover: { Args: { _media_id: string }; Returns: undefined }
      set_my_featured_badge_slot: {
        Args: { _badge_id: string; _position: number }
        Returns: undefined
      }
      set_my_featured_badges: { Args: { _ids: string[] }; Returns: undefined }
      sync_my_badges: { Args: never; Returns: Json }
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
