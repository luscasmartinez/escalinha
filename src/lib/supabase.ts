import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Employee = {
  id: string;
  name: string;
  team_type: 'external' | 'internal';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type Schedule = {
  id: string;
  schedule_date: string;
  day_type: 'weekday' | 'weekend';
  external_employee1_id: string | null;
  external_employee2_id: string | null;
  internal_employee_id: string | null;
  manual_edit: boolean;
  last_edited_by: string | null;
  last_edited_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Vacation = {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
};
