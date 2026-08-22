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
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
      };
      serruchos: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          currency: string;
          event_date: string | null;
          status: "OPEN" | "CLOSED";
          payment_instructions: string | null;
          payment_deadline: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          currency?: string;
          event_date?: string | null;
          status?: "OPEN" | "CLOSED";
          payment_instructions?: string | null;
          payment_deadline?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          currency?: string;
          event_date?: string | null;
          status?: "OPEN" | "CLOSED";
          payment_instructions?: string | null;
          payment_deadline?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      participants: {
        Row: {
          id: string;
          serrucho_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          preferred_channel: "EMAIL" | "WHATSAPP";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          serrucho_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          preferred_channel?: "EMAIL" | "WHATSAPP";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          serrucho_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          preferred_channel?: "EMAIL" | "WHATSAPP";
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          serrucho_id: string;
          paid_by_participant_id: string;
          description: string;
          amount_cents: number;
          split_method: "EQUAL" | "PERCENTAGE";
          category: string;
          expense_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          serrucho_id: string;
          paid_by_participant_id: string;
          description: string;
          amount_cents: number;
          split_method?: "EQUAL" | "PERCENTAGE";
          category?: string;
          expense_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          serrucho_id?: string;
          paid_by_participant_id?: string;
          description?: string;
          amount_cents?: number;
          split_method?: "EQUAL" | "PERCENTAGE";
          category?: string;
          expense_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      expense_participants: {
        Row: {
          id: string;
          expense_id: string;
          participant_id: string;
          owed_cents: number;
          percentage: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          participant_id: string;
          owed_cents: number;
          percentage?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          expense_id?: string;
          participant_id?: string;
          owed_cents?: number;
          percentage?: number | null;
          created_at?: string;
        };
      };
    };
  };
}
