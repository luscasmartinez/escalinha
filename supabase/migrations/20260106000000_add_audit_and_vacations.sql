/*
  # Add audit fields and vacations table

  1. New Fields
    - schedules.manual_edit: boolean to track if schedule was manually edited
    - schedules.last_edited_by: text to store who made the manual edit
    - schedules.last_edited_at: timestamptz to store when manual edit occurred

  2. New Table
    - vacations: stores employee vacation periods

  3. Indexes
    - Add indexes for vacation queries
*/

-- Add audit fields to schedules table
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS manual_edit boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_edited_by text,
ADD COLUMN IF NOT EXISTS last_edited_at timestamptz;

-- Create vacations table
CREATE TABLE IF NOT EXISTS vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_date >= start_date)
);

-- Create indexes for vacations
CREATE INDEX IF NOT EXISTS idx_vacations_employee_id ON vacations(employee_id);
CREATE INDEX IF NOT EXISTS idx_vacations_start_date ON vacations(start_date);
CREATE INDEX IF NOT EXISTS idx_vacations_end_date ON vacations(end_date);

-- Enable RLS
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to vacations"
  ON vacations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to vacations"
  ON vacations FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to vacations"
  ON vacations FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to vacations"
  ON vacations FOR DELETE
  TO public
  USING (true);

