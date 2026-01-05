# Como Criar o Índice no Firebase

## Opção 1: Usar o Link Direto do Erro (Mais Rápido)

1. **Clique no link** que aparece no erro no console do navegador
2. O link te levará diretamente para a página de criação do índice no Firebase Console
3. Clique em **"Create Index"** (Criar Índice)
4. Aguarde alguns minutos até o índice ser criado
5. Recarregue a aplicação

## Opção 2: Criar Manualmente no Firebase Console

1. Acesse: https://console.firebase.google.com
2. Selecione o projeto **escala-proj**
3. Vá em **Firestore Database** → **Indexes** (no menu lateral)
4. Clique em **Create Index**
5. Configure:
   - **Collection ID**: `employees`
   - **Fields to index**:
     - Campo 1: `status` → Ascending
     - Campo 2: `name` → Ascending
   - **Query scope**: Collection
6. Clique em **Create**
7. Aguarde alguns minutos (o índice fica "Building" primeiro)
8. Quando estiver "Enabled", recarregue a aplicação

## Índices Necessários

Você precisará criar estes índices:

### 1. employees - status + name
- **Collection**: `employees`
- **Campos**: 
  - `status` (Ascending)
  - `name` (Ascending)

### 2. schedules - schedule_date (pode não precisar, mas é bom ter)
- **Collection**: `schedules`
- **Campos**: 
  - `schedule_date` (Ascending)

## Status do Índice

Após criar, o índice aparecerá na lista com status:
- 🟡 **Building** - Sendo construído (aguarde alguns minutos)
- 🟢 **Enabled** - Pronto para uso

Enquanto estiver "Building", a query ainda falhará. Aguarde até ficar "Enabled".

