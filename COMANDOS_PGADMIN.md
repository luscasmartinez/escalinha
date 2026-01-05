# Como Executar a Migration no pgAdmin ou PostgreSQL

## Opção 1: Via pgAdmin (Interface Gráfica)

1. Abra o pgAdmin
2. Conecte ao servidor usando:
   - Host: `db.tzjpfzjjvxxhyhqjauzl.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - Username: `postgres`
   - Password: `escala`

3. No painel esquerdo, navegue até:
   - Servers → [Seu Servidor] → Databases → postgres → Schemas → public

4. Clique com o botão direito em "public" → Query Tool

5. Abra o arquivo `EXECUTAR_MIGRATION.sql` e copie todo o conteúdo

6. Cole no Query Tool

7. Clique em "Execute" (ou pressione F5)

## Opção 2: Via psql (Linha de Comando)

```bash
psql "postgresql://postgres:escala@db.tzjpfzjjvxxhyhqjauzl.supabase.co:5432/postgres" -f EXECUTAR_MIGRATION.sql
```

## Opção 3: Via Supabase SQL Editor (Web)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo de `EXECUTAR_MIGRATION.sql`
5. Clique em **Run**

## Verificar se Funcionou

Execute estas queries para confirmar:

```sql
-- Verificar campos de auditoria
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'schedules' 
  AND column_name IN ('manual_edit', 'last_edited_by', 'last_edited_at')
ORDER BY column_name;

-- Verificar se a tabela vacations foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'vacations';

-- Verificar estrutura da tabela vacations
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'vacations'
ORDER BY ordinal_position;
```

Se tudo estiver OK, você verá:
- 3 campos na tabela schedules (manual_edit, last_edited_by, last_edited_at)
- A tabela vacations existindo
- 7 colunas na tabela vacations (id, employee_id, start_date, end_date, created_at, updated_at, + constraint)

