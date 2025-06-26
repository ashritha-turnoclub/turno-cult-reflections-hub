export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      answers: {
        Row: {
          answer_text: string | null
          assignment_id: string
          created_at: string
          id: string
          question_id: string
          updated_at: string
        }
        Insert: {
          answer_text?: string | null
          assignment_id: string
          created_at?: string
          id?: string
          question_id: string
          updated_at?: string
        }
        Update: {
          answer_text?: string | null
          assignment_id?: string
          created_at?: string
          id?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_entries: {
        Row: {
          category: string | null
          checklist: Json | null
          created_at: string
          id: string
          notes: string
          timeline: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          checklist?: Json | null
          created_at?: string
          id?: string
          notes: string
          timeline?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          checklist?: Json | null
          created_at?: string
          id?: string
          notes?: string
          timeline?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_comments: {
        Row: {
          assignment_id: string
          comment_by: string
          comment_text: string
          created_at: string
          id: string
          parent_comment_id: string | null
          question_id: string | null
          section: string | null
        }
        Insert: {
          assignment_id: string
          comment_by: string
          comment_text: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          question_id?: string | null
          section?: string | null
        }
        Update: {
          assignment_id?: string
          comment_by?: string
          comment_text?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          question_id?: string | null
          section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_comments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_comments_comment_by_fkey"
            columns: ["comment_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "feedback_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_comments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_areas: {
        Row: {
          checklist: Json | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          progress_percent: number
          quarter: Database["public"]["Enums"]["quarter_type"] | null
          title: string
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          checklist?: Json | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          progress_percent?: number
          quarter?: Database["public"]["Enums"]["quarter_type"] | null
          title: string
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          checklist?: Json | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          progress_percent?: number
          quarter?: Database["public"]["Enums"]["quarter_type"] | null
          title?: string
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "focus_areas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leaders: {
        Row: {
          accepted_at: string | null
          ceo_id: string
          email: string
          id: string
          invited_at: string
          name: string
          role_description: string | null
          role_title: string | null
        }
        Insert: {
          accepted_at?: string | null
          ceo_id: string
          email: string
          id?: string
          invited_at?: string
          name: string
          role_description?: string | null
          role_title?: string | null
        }
        Update: {
          accepted_at?: string | null
          ceo_id?: string
          email?: string
          id?: string
          invited_at?: string
          name?: string
          role_description?: string | null
          role_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaders_ceo_id_fkey"
            columns: ["ceo_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_flag: boolean
          recipient_id: string
          ref_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_flag?: boolean
          recipient_id: string
          ref_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_flag?: boolean
          recipient_id?: string
          ref_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_assignments: {
        Row: {
          assigned_at: string
          id: string
          leader_id: string
          questionnaire_id: string
          submitted_at: string | null
        }
        Insert: {
          assigned_at?: string
          id?: string
          leader_id: string
          questionnaire_id: string
          submitted_at?: string | null
        }
        Update: {
          assigned_at?: string
          id?: string
          leader_id?: string
          questionnaire_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_assignments_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_assignments_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaires: {
        Row: {
          created_at: string
          created_by: string
          deadline: string
          id: string
          published: boolean
          quarter: Database["public"]["Enums"]["quarter_type"]
          title: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by: string
          deadline: string
          id?: string
          published?: boolean
          quarter: Database["public"]["Enums"]["quarter_type"]
          title: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string
          deadline?: string
          id?: string
          published?: boolean
          quarter?: Database["public"]["Enums"]["quarter_type"]
          title?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "questionnaires_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          id: string
          order_index: number
          question_detail: string | null
          question_title: string
          questionnaire_id: string
          section: string
        }
        Insert: {
          id?: string
          order_index?: number
          question_detail?: string | null
          question_title: string
          questionnaire_id: string
          section: string
        }
        Update: {
          id?: string
          order_index?: number
          question_detail?: string | null
          question_title?: string
          questionnaire_id?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          recipient_id: string
          message: string
          type: Database["public"]["Enums"]["notification_type"]
          ref_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      notification_type: "assignment" | "feedback" | "submission" | "invitation"
      quarter_type: "Q1" | "Q2" | "Q3" | "Q4"
      user_role: "ceo" | "leader"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      notification_type: ["assignment", "feedback", "submission", "invitation"],
      quarter_type: ["Q1", "Q2", "Q3", "Q4"],
      user_role: ["ceo", "leader"],
    },
  },
} as const
