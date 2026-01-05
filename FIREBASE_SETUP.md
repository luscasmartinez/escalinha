# Configuração do Firebase Firestore

## Estrutura das Coleções

O projeto usa 3 coleções no Firestore:

1. **employees** - Colaboradores
2. **schedules** - Escalas
3. **vacations** - Férias

## Índices Necessários

O Firestore requer índices compostos para algumas queries. Você precisa criar os seguintes índices no Firebase Console:

### 1. employees
- **Coleção**: `employees`
- **Campos**: `status` (Ascending), `name` (Ascending)
- **Query scope**: Collection

### 2. employees (alternativa - se o anterior não funcionar)
- **Coleção**: `employees`
- **Campos**: `team_type` (Ascending), `status` (Ascending), `name` (Ascending)
- **Query scope**: Collection

### 3. schedules
- **Coleção**: `schedules`
- **Campos**: `schedule_date` (Ascending)
- **Query scope**: Collection

## Como Criar os Índices

1. Acesse o Firebase Console: https://console.firebase.google.com
2. Selecione o projeto `escala-proj`
3. Vá em **Firestore Database** → **Indexes**
4. Clique em **Create Index**
5. Configure conforme descrito acima

**OU** o Firebase pode sugerir criar o índice automaticamente quando você executar a query pela primeira vez. Nesse caso, clique no link de erro que aparecer.

## Regras de Segurança (Security Rules)

Para desenvolvimento, você pode usar regras abertas temporariamente:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **ATENÇÃO**: Essas regras permitem acesso total. Para produção, configure regras de segurança adequadas.

## Dados de Exemplo

Após configurar, você pode adicionar dados manualmente ou através da aplicação.

### Estrutura de um Employee:
```json
{
  "name": "João Silva",
  "team_type": "external",
  "status": "active",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Estrutura de um Schedule:
```json
{
  "schedule_date": "2024-01-15",
  "day_type": "weekday",
  "external_employee1_id": "employee-id-1",
  "external_employee2_id": "employee-id-2",
  "internal_employee_id": "employee-id-3",
  "manual_edit": false,
  "last_edited_by": null,
  "last_edited_at": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Estrutura de um Vacation:
```json
{
  "employee_id": "employee-id-1",
  "start_date": "2024-02-01",
  "end_date": "2024-02-15",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Migração de Dados do Supabase

Se você tem dados no Supabase que quer migrar:

1. Exporte os dados do Supabase (via SQL ou interface)
2. Converta para formato JSON
3. Use a interface do Firestore para importar manualmente
4. Ou crie um script de migração usando os serviços Firebase

