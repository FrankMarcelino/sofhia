# Checklist de Testes de Integração

Este documento contém os testes necessários para validar as integrações com Supabase após aplicar as correções.

---

## 🎯 Objetivo

Validar que todos os módulos do MVP funcionam corretamente com o banco de dados real após as correções implementadas na versão 0.7.1.

---

## ⚡ Pré-requisitos

Antes de iniciar os testes:

- [ ] Scripts SQL foram executados com sucesso (`database/EXECUTE_ME.md`)
- [ ] Aplicação está rodando localmente (`npm run dev`)
- [ ] Console do navegador está aberto (F12) para ver erros
- [ ] Terminal está visível para ver logs do servidor

---

## 1️⃣ Teste: Autenticação

### Login
- [ ] Acessar `/login`
- [ ] Preencher credenciais válidas
- [ ] Verificar redirecionamento para `/dashboard`
- [ ] Verificar que não há erros no console
- [ ] **Esperado:** Login bem-sucedido e redirecionamento

### Cadastro
- [ ] Acessar `/cadastro`
- [ ] Preencher formulário completo
- [ ] Submeter formulário
- [ ] Verificar que usuário foi criado em `usuarios_sofhia`
- [ ] **Esperado:** Conta criada e redirecionamento para dashboard

### Verificação no Banco
Execute no SQL Editor do Supabase:
```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

SELECT id, id_empresa, nome_usuario, ativo 
FROM usuarios_sofhia 
ORDER BY created_at DESC 
LIMIT 5;
```

**Esperado:** Registros em ambas as tabelas com mesmo `id`.

---

## 2️⃣ Teste: Dashboard (CRÍTICO)

### KPIs
- [ ] Acessar `/dashboard`
- [ ] Verificar que KPIs carregam (Conversas Ativas, Clientes, Agentes, Taxa Conversão)
- [ ] Verificar que não há "NaN", "null" ou "undefined"
- [ ] Verificar que saldo de créditos aparece
- [ ] **Esperado:** Todos os KPIs com valores numéricos (podem ser 0)

### Gráfico de Vendas
- [ ] Verificar que gráfico de tendência renderiza
- [ ] Passar mouse sobre pontos do gráfico
- [ ] Verificar tooltips com valores
- [ ] **Esperado:** Gráfico renderizado, mesmo sem dados mostra eixos

### Funil de Vendas
- [ ] Verificar que funil renderiza
- [ ] Verificar etapas: Leads → Contato → Proposta → Negociação → Fechamento
- [ ] Verificar percentuais
- [ ] **Esperado:** Funil com 5 etapas e percentuais calculados

### Feed de Atividades
- [ ] Verificar lista de atividades recentes
- [ ] Verificar timestamps
- [ ] Verificar status (ícones corretos)
- [ ] **Esperado:** Lista de conversas recentes (pode estar vazia)

### Verificação no Banco
```sql
-- Testar função de taxa de conversão
SELECT calcular_taxa_conversao_periodo(
  'e1a2b3c4-d5e6-47a8-b9c0-d1e2f3a4b5c6'::uuid, 
  30
);

-- Testar função de funil
SELECT * FROM analisar_funil_vendas(
  'e1a2b3c4-d5e6-47a8-b9c0-d1e2f3a4b5c6'::uuid,
  30
);
```

**Esperado:** Funções retornam valores numéricos sem erros.

---

## 3️⃣ Teste: Monitoramento

### Health Cards
- [x] Acessar `/monitoramento`
- [x] Verificar status API UpChat (verde/vermelho)
- [x] Verificar status Token
- [x] Verificar status Usuário
- [ ] **Esperado:** Cards com status visual claro

### Connection Info
- [x] Verificar que URLs aparecem
- [ ] Verificar que token aparece mascarado (`***...***`)
- [ ] Verificar timestamp da última verificação
- [ ] **Esperado:** Informações de conexão visíveis

### System Stats
- [ ] Verificar "Conversas Ativas"
- [ ] Verificar "Agentes Ativos"
- [ ] Verificar "Tokens Hoje"
- [ ] Verificar "Requisições/min" (não deve ser número aleatório)
- [ ] **Esperado:** Estatísticas reais do banco

### Verificação no Banco
```sql
-- Verificar requisições por minuto (não deve usar Math.random)
SELECT COUNT(*) as req_por_minuto
FROM interacoes
WHERE id_empresa = 'e1a2b3c4-d5e6-47a8-b9c0-d1e2f3a4b5c6'
AND created_at >= NOW() - INTERVAL '1 minute';
```

---

## 4️⃣ Teste: Parâmetros

### Dados da Empresa
- [x] Acessar `/parametros`
- [x] Aba "Empresa" carrega
- [x] Preencher/editar campos
- [x] Clicar "Salvar"
- [x] Verificar mensagem de sucesso
- [x] **Esperado:** Dados salvos sem erros

### Configuração UpChat
- [x] Aba "UpChat" carrega
- [x] Preencher URLs e tokens
- [x] Clicar "Testar Conexão"
- [x] Verificar feedback visual
- [x] Clicar "Salvar"
- [x] **Esperado:** Configuração salva e teste executado

### Preferências IA
- [x] Aba "IA" carrega
- [x] Alternar toggles
- [x] Ajustar sliders
- [x] Clicar "Salvar"
- [x] **Esperado:** Preferências salvas

### Verificação no Banco
```sql
-- Verificar UPDATE nas tabelas
SELECT * FROM empresa WHERE id_empresa = 'sua-empresa-id';
SELECT * FROM configuracoes_upchat WHERE id_empresa = 'sua-empresa-id';
SELECT * FROM empresa_preferencias_ia WHERE id_empresa = 'sua-empresa-id';
```

**Esperado:** `updated_at` deve ser recente.

---

## 5️⃣ Teste: Financeiro

### Carteira
- [x] Acessar `/financeiro`
- [x] Verificar saldo atual
- [x] Verificar alertas (se saldo baixo)
- [x] Verificar previsão de dias
- [x] **Esperado:** Card de carteira com informações corretas

### Resumo Financeiro
- [x] Verificar "Consumo 30d"
- [x] Verificar "Consumo 7d"
- [x] Verificar "Média Diária"
- [x] Verificar "Total Recargas"
- [x] **Esperado:** KPIs financeiros calculados

### Extrato
- [x] Verificar lista de movimentações
- [x] Verificar CRÉDITO (verde) e DÉBITO (vermelho)
- [x] Verificar timestamps
- [x] Verificar saldo após cada operação
- [x] **Esperado:** Extrato ordenado por data decrescente

### Opções de Recarga
- [x] Verificar botões de valores (R$ 50, 100, 200, 500)
- [x] Verificar campo valor personalizado
- [x] Verificar opções de pagamento
- [x] **Esperado:** UI de recarga funcional

### Verificação no Banco
```sql
SELECT * FROM carteiras WHERE id_empresa = 'sua-empresa-id';
SELECT * FROM carteiras_movimentacoes 
WHERE id_empresa = 'sua-empresa-id' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 6️⃣ Teste: Atendimento

### Lista de Conversas
- [X] Acessar `/atendimento`
- [x] Verificar cards de estatísticas
- [x] Verificar lista de conversas carrega
- [X] Verificar badges de status (cores corretas)
- [X] **Esperado:** Lista de conversas com informações completas

### Filtros
- [x] Filtrar por status (Ativa, Pausada, etc)
- [x] Filtrar por busca (nome ou telefone)
- [x] Verificar que lista atualiza
- [x] **Esperado:** Filtros funcionam corretamente

### Chat Viewer
- [X] Clicar em uma conversa
- [x] Verificar que chat abre
- [x] Verificar mensagens agrupadas por dia
- [x] Verificar cores: IA (verde), Cliente (cinza), Humano (slate)
- [x] **Esperado:** Chat renderizado com mensagens formatadas

### Verificação no Banco
```sql
SELECT COUNT(*) as total_conversas
FROM conversas
WHERE id_empresa = 'sua-empresa-id';

SELECT COUNT(*) as total_interacoes
FROM interacoes i
JOIN conversas c ON c.id_conversa = i.id_conversa
WHERE c.id_empresa = 'sua-empresa-id';
```

---

## 7️⃣ Teste: RLS Policies (Segurança)

### Teste de Isolamento Multi-Tenant

**Criar usuário de teste:**
```sql
-- No Supabase Dashboard, crie um segundo usuário via Auth
-- Associe a uma empresa diferente em usuarios_sofhia
```

**Testar isolamento:**
- [ ] Login com usuário 1 (empresa A)
- [ ] Verificar dados visíveis
- [ ] Logout
- [ ] Login com usuário 2 (empresa B)
- [ ] Verificar que NÃO vê dados da empresa A
- [ ] **Esperado:** Completo isolamento entre empresas

### Teste de Permissões de Escrita

**Executar no SQL Editor (conectado como usuário autenticado):**
```sql
-- Tentar inserir conversa
INSERT INTO conversas (id_empresa, id_agente, status_conversa)
VALUES ('sua-empresa-id', 'algum-agente-id', 'conversando');

-- Deve funcionar ✅

-- Tentar inserir conversa de outra empresa
INSERT INTO conversas (id_empresa, id_agente, status_conversa)
VALUES ('empresa-id-diferente', 'algum-agente-id', 'conversando');

-- Deve falhar com RLS error ❌
```

---

## 8️⃣ Teste: Error Handling

### Teste de Erro de Rede
- [ ] Desconectar internet
- [ ] Tentar acessar qualquer página
- [ ] Verificar que erro é logado no console
- [ ] Verificar mensagem de erro amigável (não stack trace)
- [ ] **Esperado:** Erro tratado graciosamente

### Teste de Função RPC Inexistente
```sql
-- Renomear temporariamente uma função
ALTER FUNCTION calcular_taxa_conversao_periodo 
RENAME TO calcular_taxa_conversao_periodo_backup;

-- Acessar /dashboard
-- Verificar console
```

- [ ] Erro é logado com contexto claro
- [ ] Aplicação não quebra completamente
- [ ] **Esperado:** Erro estruturado no console

```sql
-- Restaurar função
ALTER FUNCTION calcular_taxa_conversao_periodo_backup 
RENAME TO calcular_taxa_conversao_periodo;
```

---

## 🎯 Resumo de Resultados

### Aprovado ✅
- [ ] Todos os módulos carregam sem erros
- [ ] RPC Functions funcionam
- [ ] RLS Policies isolam empresas
- [ ] Error handling está ativo
- [ ] Nenhum mock data restante

### Falhou ❌
Liste aqui os testes que falharam e os erros encontrados:

```
1. [Módulo/Teste]: [Descrição do erro]
   Console: [Mensagem de erro]
   
2. ...
```

---

## 🔍 Logs para Análise

### Console do Navegador
Procure por:
- ❌ `[Supabase Error - ...]` - Erros de banco
- ⚠️ `[Supabase Warning - ...]` - Avisos (não críticos)
- ❌ `Uncaught Error` - Erros não tratados
- ❌ `404` - Recursos não encontrados

### Logs do Servidor Next.js
Procure por:
- ❌ `Error:` - Erros do servidor
- ⚠️ `Warning:` - Avisos
- ℹ️ Query logs do Supabase

---

## 📝 Próximos Passos Após Testes

Se todos os testes passarem:
1. ✅ Executar `npm run lint`
2. ✅ Executar `npm run build`
3. ✅ Atualizar documentação
4. ✅ Criar commit com mudanças

Se algum teste falhar:
1. ❌ Anotar erro específico
2. ❌ Verificar logs detalhados
3. ❌ Corrigir problema
4. ❌ Re-executar teste

---

**Data de Criação:** 03/02/2026  
**Versão:** 0.7.1
