export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          face_descriptor: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          face_descriptor?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          face_descriptor?: number[] | null;
          created_at?: string;
        };
      };
      attendance_records: {
        Row: {
          id: string;
          user_id: string;
          check_in_time: string;
          detection_duration: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          check_in_time?: string;
          detection_duration: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          check_in_time?: string;
          detection_duration?: number;
          status?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'];
