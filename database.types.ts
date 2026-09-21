export type QueueStatus = 'open' | 'paused' | 'closed';
export type EntryStatus = 'waiting' | 'serving' | 'served' | 'no_show' | 'left';
export type StaffRole = 'owner' | 'manager' | 'staff';

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          accent_color: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['businesses']['Row']> & {
          owner_id: string;
          name: string;
          slug: string;
        };
        Update: Partial<Database['public']['Tables']['businesses']['Row']>;
      };
      queues: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          status: QueueStatus;
          avg_service_time_mins: number;
          join_code: string;
          chat_enabled: boolean;
          counter_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['queues']['Row']> & {
          business_id: string;
          name: string;
          join_code: string;
        };
        Update: Partial<Database['public']['Tables']['queues']['Row']>;
      };
      queue_entries: {
        Row: {
          id: string;
          queue_id: string;
          customer_name: string;
          phone: string | null;
          position: number;
          status: EntryStatus;
          counter_number: number | null;
          joined_at: string;
          called_at: string | null;
          served_at: string | null;
          session_token: string;
        };
        Insert: Partial<Database['public']['Tables']['queue_entries']['Row']> & {
          queue_id: string;
          customer_name: string;
          position: number;
        };
        Update: Partial<Database['public']['Tables']['queue_entries']['Row']>;
      };
      chat_messages: {
        Row: {
          id: string;
          queue_id: string;
          display_name: string;
          message: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['chat_messages']['Row']> & {
          queue_id: string;
          message: string;
        };
        Update: Partial<Database['public']['Tables']['chat_messages']['Row']>;
      };
      daily_stats: {
        Row: {
          id: string;
          business_id: string;
          queue_id: string;
          day: string;
          served_count: number;
          no_show_count: number;
          total_wait_mins: number;
        };
        Insert: Partial<Database['public']['Tables']['daily_stats']['Row']>;
        Update: Partial<Database['public']['Tables']['daily_stats']['Row']>;
      };
      business_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: StaffRole;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['business_members']['Row']> & {
          business_id: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['business_members']['Row']>;
      };
    };
  };
}
