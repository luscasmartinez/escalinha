# Instruções para Executar a Migration

## Problema
Os erros ocorrem porque a migration ainda não foi executada no banco de dados Supabase. A tabela `vacations` e os campos de auditoria (`manual_edit`, `last_edited_by`, `last_edited_at`) ainda não existem.

## Solução

Você precisa executar a migration no Supabase. Existem duas formas:

### Opção 1: Via Interface do Supabase (Recomendado)

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral)
4. Abra o arquivo `supabase/migrations/20260106000000_add_audit_and_vacations.sql`
5. Copie todo o conteúdo do arquivo
6. Cole no editor SQL do Supabase
7. Clique em **Run** (ou pressione Ctrl+Enter)

### Opção 2: Via Supabase CLI (Se você usa CLI)

Se você tem o Supabase CLI configurado:

```bash
supabase db push
```

Ou:

```bash
supabase migration up
```

## O que a Migration faz:

1. **Adiciona campos de auditoria na tabela `schedules`:**
   - `manual_edit` (boolean) - indica se foi editado manualmente
   - `last_edited_by` (text) - nome de quem editou
   - `last_edited_at` (timestamptz) - quando foi editado

2. **Cria a tabela `vacations`:**
   - Armazena períodos de férias dos colaboradores
   - Campos: employee_id, start_date, end_date
   - Com índices e políticas RLS configuradas

## Após Executar a Migration:

- ✅ A funcionalidade de férias funcionará
- ✅ As alterações manuais serão registradas corretamente
- ✅ Todos os erros 404 desaparecerão

## Nota:

O código foi ajustado para funcionar mesmo sem os campos de auditoria (para não quebrar), mas algumas funcionalidades não estarão disponíveis até a migration ser executada.

