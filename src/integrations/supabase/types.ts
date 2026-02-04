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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          anime_id: number
          anime_image: string | null
          anime_title: string
          created_at: string
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          anime_id: number
          anime_image?: string | null
          anime_title: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          anime_id?: number
          anime_image?: string | null
          anime_title?: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      anime_lists: {
        Row: {
          added_at: string
          anime_id: number
          anime_image: string | null
          anime_title: string
          id: string
          notes: string | null
          progress: number | null
          rating: number | null
          status: string
          total_episodes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          added_at?: string
          anime_id: number
          anime_image?: string | null
          anime_title: string
          id?: string
          notes?: string | null
          progress?: number | null
          rating?: number | null
          status: string
          total_episodes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          added_at?: string
          anime_id?: number
          anime_image?: string | null
          anime_title?: string
          id?: string
          notes?: string | null
          progress?: number | null
          rating?: number | null
          status?: string
          total_episodes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          discord_avatar: string | null
          discord_id: string | null
          discord_username: string | null
          display_name: string
          favorite_genres: string[] | null
          id: string
          share_completed:
            | Database["public"]["Enums"]["share_permission"]
            | null
          share_favorites:
            | Database["public"]["Enums"]["share_permission"]
            | null
          share_planned: Database["public"]["Enums"]["share_permission"] | null
          share_watching: Database["public"]["Enums"]["share_permission"] | null
          total_anime: number | null
          total_episodes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          discord_avatar?: string | null
          discord_id?: string | null
          discord_username?: string | null
          display_name: string
          favorite_genres?: string[] | null
          id?: string
          share_completed?:
            | Database["public"]["Enums"]["share_permission"]
            | null
          share_favorites?:
            | Database["public"]["Enums"]["share_permission"]
            | null
          share_planned?: Database["public"]["Enums"]["share_permission"] | null
          share_watching?:
            | Database["public"]["Enums"]["share_permission"]
            | null
          total_anime?: number | null
          total_episodes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          discord_avatar?: string | null
          discord_id?: string | null
          discord_username?: string | null
          display_name?: string
          favorite_genres?: string[] | null
          id?: string
          share_completed?:
            | Database["public"]["Enums"]["share_permission"]
            | null
          share_favorites?:
            | Database["public"]["Enums"]["share_permission"]
            | null
          share_planned?: Database["public"]["Enums"]["share_permission"] | null
          share_watching?:
            | Database["public"]["Enums"]["share_permission"]
            | null
          total_anime?: number | null
          total_episodes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      review_reactions: {
        Row: {
          created_at: string
          id: string
          reaction: Database["public"]["Enums"]["review_reaction"]
          review_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction: Database["public"]["Enums"]["review_reaction"]
          review_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction?: Database["public"]["Enums"]["review_reaction"]
          review_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reactions_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "anime_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          moderator_id: string | null
          moderator_notes: string | null
          reason: string
          reporter_id: string
          resolved_at: string | null
          review_id: string
          status: Database["public"]["Enums"]["report_status"] | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          moderator_id?: string | null
          moderator_notes?: string | null
          reason: string
          reporter_id: string
          resolved_at?: string | null
          review_id: string
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          moderator_id?: string | null
          moderator_notes?: string | null
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          review_id?: string
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "anime_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      session_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shared_lists: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          list_type: string
          owner_id: string
          share_code: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          list_type: string
          owner_id: string
          share_code?: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          list_type?: string
          owner_id?: string
          share_code?: string
          view_count?: number | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_description: string | null
          badge_icon: string | null
          badge_name: string
          badge_type: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name: string
          badge_type: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name?: string
          badge_type?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_moderation: {
        Row: {
          ban_expires_at: string | null
          ban_reason: string | null
          ban_status: Database["public"]["Enums"]["ban_type"] | null
          created_at: string
          credibility_score: number | null
          id: string
          review_cooldown_until: string | null
          total_helpful_votes: number | null
          total_reviews: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ban_expires_at?: string | null
          ban_reason?: string | null
          ban_status?: Database["public"]["Enums"]["ban_type"] | null
          created_at?: string
          credibility_score?: number | null
          id?: string
          review_cooldown_until?: string | null
          total_helpful_votes?: number | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ban_expires_at?: string | null
          ban_reason?: string | null
          ban_status?: Database["public"]["Enums"]["ban_type"] | null
          created_at?: string
          credibility_score?: number | null
          id?: string
          review_cooldown_until?: string | null
          total_helpful_votes?: number | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_anime_summary: {
        Args: { _anime_id: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin"
      share_permission: "none" | "public"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "moderator", "admin"],
      share_permission: ["none", "public"],
    },
  },
} as const
