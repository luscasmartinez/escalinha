-- ============================================
-- MIGRATION: Adicionar campos de auditoria e tabela de férias
-- ============================================
-- Execute este script no seu banco de dados PostgreSQL/Supabase
-- ============================================

-- 1. Adicionar campos de auditoria na tabela schedules
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS manual_edit boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_edited_by text,
ADD COLUMN IF NOT EXISTS last_edited_at timestamptz;

-- 2. Criar tabela de férias
CREATE TABLE IF NOT EXISTS vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_date >= start_date)
);

-- 3. Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_vacations_employee_id ON vacations(employee_id);
CREATE INDEX IF NOT EXISTS idx_vacations_start_date ON vacations(start_date);
CREATE INDEX IF NOT EXISTS idx_vacations_end_date ON vacations(end_date);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de acesso público (para ferramenta interna corporativa)
-- Remove políticas existentes se houver (para evitar erro de duplicação)
DROP POLICY IF EXISTS "Allow public read access to vacations" ON vacations;
DROP POLICY IF EXISTS "Allow public insert access to vacations" ON vacations;
DROP POLICY IF EXISTS "Allow public update access to vacations" ON vacations;
DROP POLICY IF EXISTS "Allow public delete access to vacations" ON vacations;

-- Cria as políticas
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

-- ============================================
-- FIM DA MIGRATION
-- ============================================
-- Verificação: Execute estas queries para confirmar que funcionou:
-- 
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'schedules' AND column_name IN ('manual_edit', 'last_edited_by', 'last_edited_at');
--
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'vacations';
-- ============================================

