# Database Schema — SOFHIA Enterprise

Este diretório contém os scripts SQL para configuração do banco de dados.

---

## 📁 Arquivos

### Scripts Principais
- **`schema.sql`** - Schema completo do banco de dados (v3.5)
  - 30+ tabelas com relacionamentos
  - Tipos ENUM customizados
  - Constraints e índices
  
- **`rls_policies.sql`** - Políticas de Row Level Security (✅ ATUALIZADO v0.7.1)
  - ~60+ políticas multi-tenant
  - Isolamento completo por empresa
  - Permissões INSERT/UPDATE/DELETE
  
- **`rpc_functions.sql`** - Funções RPC para consultas otimizadas (✅ ATUALIZADO v0.7.1)
  - 15+ funções auxiliares
  - Inclui `calcular_taxa_conversao_periodo`
  - Inclui `analisar_funil_vendas`
  
- **`seed.sql`** - Dados iniciais para desenvolvimento (opcional)
  - Empresa de exemplo
  - Agentes de teste
  - Conversas e interações exemplo

### Scripts Auxiliares
- **`auto_mirror_users.sql`** - Trigger para espelhar auth.users → usuarios_sofhia
- **`fix_user_id.sql`** - Correção pontual de ID de usuário
- **`assign_empresa_to_user.sql`** - Associar usuário a empresa
- **`migration_multi_tenant.sql`** - Função de migração multi-tenant

### Documentação
- **`EXECUTE_ME.md`** - 📘 **LEIA PRIMEIRO!** Guia completo de execução
- **`TEST_CHECKLIST.md`** - Checklist de testes pós-execução
- **`README.md`** - Este arquivo

---

## 🚀 Ordem de Execução (v0.7.1)

### ⚠️ IMPORTANTE: Siga a ordem exata!

**Para bancos novos (primeira execução):**
1. ✅ `schema.sql` - Criar estrutura
2. ✅ `rls_policies.sql` - Habilitar segurança
3. ✅ `rpc_functions.sql` - Adicionar funções
4. ✅ `seed.sql` (opcional) - Dados de exemplo

**Para bancos existentes (atualização v0.7.1):**
1. ⚠️ **PULE** `schema.sql` (já executado)
2. ✅ `rpc_functions.sql` - **EXECUTAR NOVAMENTE** (funções novas)
3. ✅ `rls_policies.sql` - **EXECUTAR NOVAMENTE** (políticas novas)

> 💡 **Dica:** Leia `EXECUTE_ME.md` para instruções detalhadas com verificações.

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

## 📝 Notas Importantes

### Versão 0.7.1 (03/02/2026)
- ✅ Adicionadas 2 novas RPC functions para Dashboard
- ✅ Adicionadas ~20 políticas RLS para operações de escrita
- ✅ Corrigidos type mismatches nas queries TypeScript
- ✅ Build passa sem erros

### Schema
- ⚠️ O schema usa tipos ENUM customizados (USER-DEFINED)
- ⚠️ RLS deve estar habilitado em todas as tabelas de tenant
- ⚠️ Algumas constraints foram simplificadas para evitar dependências circulares
- ⚠️ O schema fornecido foi reorganizado para execução sequencial

### Segurança
- 🔒 Função `user_empresa_id()` retorna empresa do usuário autenticado
- 🔒 Todas as políticas RLS usam `SECURITY DEFINER`
- 🔒 Multi-tenancy garantido por `id_empresa` em todas as queries

### Performance
- 🚀 Índices criados em colunas frequentemente consultadas
- 🚀 RPC functions otimizadas para reduzir round-trips
- 🚀 Queries usam `head: true` quando possível para contar sem buscar dados

---

## 🔍 Verificação Pós-Execução

Após executar os scripts, verifique:

```sql
-- 1. Contar tabelas
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Esperado: ~30+

-- 2. Contar funções
SELECT COUNT(*) FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
-- Esperado: ~15+

-- 3. Contar políticas RLS
SELECT COUNT(*) FROM pg_policies 
WHERE schemaname = 'public';
-- Esperado: ~60+

-- 4. Verificar funções críticas (v0.7.1)
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('calcular_taxa_conversao_periodo', 'analisar_funil_vendas');
-- Esperado: 2 resultados
```

---

## 🆘 Troubleshooting

### "Function already exists"
Normal. Scripts usam `DROP FUNCTION IF EXISTS` antes de criar.

### "Policy already exists"  
Normal para políticas antigas. Novas políticas (v0.7.1) serão criadas.

### "Permission denied"
Execute como superuser ou verifique se `user_empresa_id()` foi criado.

### "Type does not exist"
Execute `schema.sql` primeiro para criar tipos ENUM.

---

## 📚 Recursos Adicionais

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Database Migrations Best Practices](https://supabase.com/docs/guides/database/migrations)

---

**Última Atualização:** 03/02/2026  
**Versão:** 0.7.1
