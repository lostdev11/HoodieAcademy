export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      course_completions: {
        Row: {
          approved: boolean | null
          completed_at: string | null
          course_completed_at: string | null
          course_id: string
          course_started_at: string | null
          final_exam_approved: boolean | null
          final_exam_approved_at: string | null
          final_exam_approved_by: string | null
          id: string
          started_at: string | null
          wallet_address: string
        }
        Insert: {
          approved?: boolean | null
          completed_at?: string | null
          course_completed_at?: string | null
          course_id: string
          course_started_at?: string | null
          final_exam_approved?: boolean | null
          final_exam_approved_at?: string | null
          final_exam_approved_by?: string | null
          id?: string
          started_at?: string | null
          wallet_address: string
        }
        Update: {
          approved?: boolean | null
          completed_at?: string | null
          course_completed_at?: string | null
          course_id?: string
          course_started_at?: string | null
          final_exam_approved?: boolean | null
          final_exam_approved_at?: string | null
          final_exam_approved_by?: string | null
          id?: string
          started_at?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_completions_final_exam_approved_by_fkey"
            columns: ["final_exam_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string | null
          id: string
          sender: string | null
          squad: string | null
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sender?: string | null
          squad?: string | null
          text?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sender?: string | null
          squad?: string | null
          text?: string
        }
        Relationships: []
      }
      placement_progress: {
        Row: {
          completed_at: string | null
          id: string
          passed: boolean | null
          started_at: string | null
          wallet_address: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          passed?: boolean | null
          started_at?: string | null
          wallet_address: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          passed?: boolean | null
          started_at?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_progress_wallet_address_fkey"
            columns: ["wallet_address"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["wallet_address"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          event_type: string | null
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          event_type?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          event_type?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_completions: {
        Row: {
          approved: boolean | null
          completed_at: string | null
          course_id: string
          final_exam_approved: boolean | null
          final_exam_approved_at: string | null
          final_exam_approved_by: string | null
          id: string
          started_at: string | null
          wallet_address: string
        }
        Insert: {
          approved?: boolean | null
          completed_at?: string | null
          course_id: string
          final_exam_approved?: boolean | null
          final_exam_approved_at?: string | null
          final_exam_approved_by?: string | null
          id?: string
          started_at?: string | null
          wallet_address: string
        }
        Update: {
          approved?: boolean | null
          completed_at?: string | null
          course_id?: string
          final_exam_approved?: boolean | null
          final_exam_approved_at?: string | null
          final_exam_approved_by?: string | null
          id?: string
          started_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          approved: boolean | null
          created_at: string | null
          display_name: string | null
          id: string
          is_admin: boolean | null
          last_active: string | null
          profile_completed: boolean | null
          squad: string | null
          squad_test_completed: boolean | null
          wallet_address: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_active?: string | null
          profile_completed?: boolean | null
          squad?: string | null
          squad_test_completed?: boolean | null
          wallet_address: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_active?: string | null
          profile_completed?: boolean | null
          squad?: string | null
          squad_test_completed?: boolean | null
          wallet_address?: string
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
    Enums: {},
  },
} as const
