/*
  # Create employees and schedules tables

  1. New Tables
    - employees: stores all employees with their team type and status
    - schedules: stores the on-call schedules with references to employees

  2. Security
    - Enable RLS on both tables
    - Add policies for public access as this is an internal corporate tool

  3. Indexes
    - Add index on schedule_date for faster queries
    - Add index on team_type for employee filtering
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  team_type text NOT NULL CHECK (team_type IN ('external', 'internal')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_date date NOT NULL,
  day_type text NOT NULL CHECK (day_type IN ('weekday', 'weekend')),
  external_employee1_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  external_employee2_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  internal_employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(schedule_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_employees_team_type ON employees(team_type);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (internal corporate tool)
CREATE POLICY "Allow public read access to employees"
  ON employees FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to employees"
  ON employees FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to employees"
  ON employees FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to employees"
  ON employees FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to schedules"
  ON schedules FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to schedules"
  ON schedules FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to schedules"
  ON schedules FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to schedules"
  ON schedules FOR DELETE
  TO public
  USING (true);