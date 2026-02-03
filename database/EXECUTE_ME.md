# Scripts SQL - Ordem de Execução

Este documento contém as instruções para executar os scripts SQL atualizados no Supabase.

## ⚠️ IMPORTANTE

Execute os scripts na **ordem exata** especificada abaixo para evitar erros de dependência.

---

## Pré-requisitos

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Navegue até o projeto: `xqmrjzeqkefrnxngshgh`
3. Abra o **SQL Editor** (menu lateral)
4. Certifique-se de estar autenticado como administrador

---

## Ordem de Execução

### 1️⃣ Schema (Se ainda não foi executado)

Se você está configurando o banco pela primeira vez, execute:

```
database/schema.sql
```

**Status:** Verificar se já foi executado anteriormente.

**Como verificar:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('empresa', 'conversas', 'agentes');
```

Se retornar as 3 tabelas, o schema já foi executado. ✅

---

### 2️⃣ RPC Functions (ATUALIZADO - Executar Novamente)

**Arquivo:** `database/rpc_functions.sql`

**O que foi adicionado:**
- ✅ `calcular_taxa_conversao_periodo(uuid, integer)` - Calcula taxa de conversão
- ✅ `analisar_funil_vendas(uuid, integer)` - Retorna dados do funil de vendas

**Motivo:** Essas funções são chamadas pelo Dashboard mas estavam ausentes.

**Como executar:**
1. Abra o arquivo `database/rpc_functions.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** ou pressione `Ctrl+Enter`

**Como verificar:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('calcular_taxa_conversao_periodo', 'analisar_funil_vendas');
```

Deve retornar 2 funções. ✅

---

### 3️⃣ RLS Policies (ATUALIZADO - Executar Novamente)

**Arquivo:** `database/rls_policies.sql`

**O que foi adicionado:**
- ✅ Políticas INSERT para `conversas`, `interacoes`, `vendas_contratos`, `carteiras_movimentacoes`, `feedback_mensagens`, `usos_ia`
- ✅ Políticas UPDATE para `conversas`, `interacoes`, `pessoas_dados_qualificacao`, `feedback_mensagens`, `carteiras_movimentacoes`
- ✅ Políticas DELETE para `interacoes`, `pessoas_dados_qualificacao`, `feedback_mensagens`, `carteiras_movimentacoes`

**Motivo:** Sem essas políticas, usuários não conseguem criar/editar dados mesmo autenticados.

**Como executar:**
1. Abra o arquivo `database/rls_policies.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** ou pressione `Ctrl+Enter`

**⚠️ Nota:** Você pode ver avisos de "policy already exists" - isso é normal para políticas antigas. As novas serão criadas.

**Como verificar:**
```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('conversas', 'interacoes', 'vendas_contratos')
ORDER BY tablename, cmd;
```

Cada tabela deve ter políticas para SELECT, INSERT, UPDATE, DELETE. ✅

---

### 4️⃣ Seed Data (Opcional - Somente se for novo banco)

**Arquivo:** `database/seed.sql`

**Quando executar:**
- ✅ Se você está configurando um banco de dados novo
- ❌ Se já tem dados de produção (NÃO execute para não duplicar)

**Como verificar se precisa:**
```sql
SELECT COUNT(*) FROM empresa;
```

Se retornar 0, execute o seed. Se retornar > 0, já tem dados.

---

## Verificação Final

Execute este script para verificar se tudo está correto:

```sql
-- 1. Verificar tabelas principais
SELECT 'Tabelas' as tipo, COUNT(*) as total 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Verificar funções RPC
SELECT 'Funções RPC' as tipo, COUNT(*) as total 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- 3. Verificar políticas RLS
SELECT 'Políticas RLS' as tipo, COUNT(*) as total 
FROM pg_policies 
WHERE schemaname = 'public';

-- 4. Verificar empresa de exemplo
SELECT 'Empresas' as tipo, COUNT(*) as total 
FROM empresa;
```

**Resultado esperado:**
- Tabelas: ~30+
- Funções RPC: ~15+
- Políticas RLS: ~60+
- Empresas: 1+ (se seed foi executado)

---

## Solução de Problemas

### Erro: "function already exists"

**Causa:** A função já foi criada anteriormente.

**Solução:** Isso é normal. O script usa `DROP FUNCTION IF EXISTS` antes de criar, então deve funcionar. Se o erro persistir, remova manualmente:

```sql
DROP FUNCTION IF EXISTS calcular_taxa_conversao_periodo(uuid, integer);
DROP FUNCTION IF EXISTS analisar_funil_vendas(uuid, integer);
```

E execute novamente.

---

### Erro: "policy already exists"

**Causa:** A política já foi criada anteriormente.

**Solução:** Isso é esperado para políticas antigas. As novas políticas serão criadas. Se quiser recomeçar do zero:

```sql
-- Remove todas as políticas de uma tabela específica
DROP POLICY IF EXISTS "nome_da_policy" ON nome_da_tabela;
```

---

### Erro: "permission denied for function user_empresa_id"

**Causa:** A função auxiliar `user_empresa_id()` não foi criada ainda.

**Solução:** Execute o script `rls_policies.sql` que inclui a criação dessa função na PARTE 2.

---

## Próximos Passos

Após executar todos os scripts com sucesso:

1. ✅ Testar login na aplicação
2. ✅ Verificar se Dashboard carrega sem erros
3. ✅ Testar criação de dados (conversas, vendas, etc)
4. ✅ Verificar logs de erro no console do navegador

---

## Suporte

Se encontrar problemas:

1. Verifique os logs do Supabase (menu "Logs" no dashboard)
2. Verifique o console do navegador (F12) para erros JavaScript
3. Verifique os logs do servidor Next.js

---

**Última Atualização:** 03/02/2026  
**Versão:** 0.7.1 (Correções de Integração Supabase)
