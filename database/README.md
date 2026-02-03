# Database Schema — SOFHIA Enterprise

Este diretório contém os scripts SQL para configuração do banco de dados.

## Arquivos

- **`schema.sql`** - Schema completo do banco de dados (v3.5)
- **`rls_policies.sql`** - Políticas de Row Level Security
- **`rpc_functions.sql`** - Funções RPC para consultas otimizadas
- **`seed.sql`** - Dados iniciais para desenvolvimento (opcional)

## Ordem de Execução

1. `schema.sql` - Criar todas as tabelas e relacionamentos
2. `rls_policies.sql` - Configurar políticas de segurança
3. `rpc_functions.sql` - Criar funções auxiliares
4. `seed.sql` (opcional) - Inserir dados de teste

## Executar via Supabase Dashboard

1. Acesse o SQL Editor no painel do Supabase
2. Copie e cole o conteúdo de cada arquivo na ordem acima
3. Execute cada script (Run ou Ctrl+Enter)
4. Verifique se não há erros

## Executar via Supabase CLI (alternativa)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Link com o projeto
supabase link --project-ref seu-project-ref

# Executar migrations
supabase db push
```

## Backup

Para fazer backup do banco:

```bash
supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Notas Importantes

- ⚠️ O schema usa tipos ENUM customizados (USER-DEFINED)
- ⚠️ RLS deve estar habilitado em todas as tabelas de tenant
- ⚠️ Algumas constraints foram simplificadas para evitar dependências circulares
- ⚠️ O schema fornecido foi reorganizado para execução sequencial
