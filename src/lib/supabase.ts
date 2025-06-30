import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          created_at: string
          updated_at: string
          is_public: boolean
          language: 'python' | 'javascript'
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
          is_public?: boolean
          language?: 'python' | 'javascript'
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
          is_public?: boolean
          language?: 'python' | 'javascript'
        }
      }
      messages: {
        Row: {
          id: string
          session_id: string
          user_id: string
          content: string
          type: 'user' | 'ai' | 'system'
          created_at: string
          metadata: Record<string, any> | null
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          content: string
          type?: 'user' | 'ai' | 'system'
          created_at?: string
          metadata?: Record<string, any> | null
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          content?: string
          type?: 'user' | 'ai' | 'system'
          created_at?: string
          metadata?: Record<string, any> | null
        }
      }
      code_files: {
        Row: {
          id: string
          session_id: string
          filename: string
          content: string
          language: string
          created_at: string
          updated_at: string
          health_score: number
          issues: Record<string, any>[] | null
        }
        Insert: {
          id?: string
          session_id: string
          filename: string
          content: string
          language: string
          created_at?: string
          updated_at?: string
          health_score?: number
          issues?: Record<string, any>[] | null
        }
        Update: {
          id?: string
          session_id?: string
          filename?: string
          content?: string
          language?: string
          created_at?: string
          updated_at?: string
          health_score?: number
          issues?: Record<string, any>[] | null
        }
      }
      session_participants: {
        Row: {
          id: string
          session_id: string
          user_id: string
          role: 'owner' | 'developer' | 'designer' | 'qa' | 'viewer'
          joined_at: string
          last_active: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          role?: 'owner' | 'developer' | 'designer' | 'qa' | 'viewer'
          joined_at?: string
          last_active?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          role?: 'owner' | 'developer' | 'designer' | 'qa' | 'viewer'
          joined_at?: string
          last_active?: string
        }
      }
    }
  }
}