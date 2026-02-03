# Setup do Supabase — SOFHIA Enterprise

Este documento contém as instruções para configurar o banco de dados Supabase para o projeto SOFHIA Enterprise.

---

## 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e faça login
2. Clique em "New Project"
3. Preencha:
   - **Name:** sofhia-enterprise
   - **Database Password:** (anote essa senha em local seguro)
   - **Region:** escolha a região mais próxima (ex: São Paulo)
   - **Pricing Plan:** Escolha conforme necessidade (Free funciona para desenvolvimento)
4. Aguarde a criação do projeto (~2 minutos)

---

## 2. Obter Credenciais

Após a criação do projeto:

1. No painel do Supabase, vá em **Settings** > **API**
2. Copie as seguintes informações:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY) - **⚠️ NUNCA exponha essa chave no frontend!**

---

## 3. Configurar Variáveis de Ambiente

1. No projeto Next.js, crie o arquivo `.env.local` (na raiz do projeto):

```bash
cd /home/frank/sofhia
cp .env.local.example .env.local
```

2. Edite o arquivo `.env.local` e preencha com suas credenciais:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **⚠️ IMPORTANTE:** O arquivo `.env.local` está no `.gitignore` e **NÃO deve ser commitado**.

---

## 4. Executar Script SQL do Schema

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo do arquivo [`database/schema.sql`](../database/schema.sql)
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a execução (pode levar alguns segundos)
6. Verifique se não há erros no console

---

## 5. Configurar Row Level Security (RLS)

O script SQL já cria as políticas de RLS, mas vamos verificar:

1. Vá em **Authentication** > **Policies**
2. Verifique se todas as tabelas têm políticas configuradas
3. As principais regras de RLS:
   - Usuários só acessam dados da própria empresa (`id_empresa`)
   - Políticas de SELECT, INSERT, UPDATE, DELETE por tenant
   - Tabelas públicas (sem RLS): `neurocores`, `agentes_tipos`, `ia_modelos`, `integracoes_catalogo`, `planos`

---

## 6. Configurar Autenticação

1. Vá em **Authentication** > **Settings**
2. Configure:
   - **Site URL:** `http://localhost:3000` (dev) ou sua URL de produção
   - **Redirect URLs:** Adicione:
     - `http://localhost:3000/auth/callback`
     - `https://seu-dominio.com/auth/callback` (produção)
3. **Email Auth** (Provider padrão):
   - Habilite "Enable Email Signup"
   - Configure templates de email (opcional, mas recomendado)

---

## 7. Seed de Dados Iniciais (Opcional)

Para facilitar o desenvolvimento, você pode popular o banco com dados de teste:

1. No SQL Editor, execute o arquivo [`database/seed.sql`](../database/seed.sql)
2. Isso criará:
   - 1 empresa de teste
   - 1 usuário admin
   - 1 neurocore base
   - Modelos de IA (OpenAI)
   - Planos de assinatura

---

## 8. Gerar Tipos TypeScript

Para manter os tipos TypeScript sincronizados com o banco:

```bash
npx supabase gen types typescript --project-id seu-project-id > types/database.ts
```

**Onde encontrar o Project ID:**
- Painel Supabase > Settings > General > Reference ID

---

## 9. Testar Conexão

1. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

2. Acesse `http://localhost:3000`
3. O sistema deve carregar sem erros de conexão
4. Verifique o console do navegador (F12) para possíveis erros

---

## 10. Criar Primeiro Usuário (via SQL)

Se quiser criar um usuário manualmente para testes:

```sql
-- 1. Criar usuário na tabela auth.users (Supabase Auth)
-- Vá em Authentication > Users > Add User
-- Email: admin@example.com
-- Password: (escolha uma senha)
-- Email Confirm: Marque "Auto Confirm User"

-- 2. Após criar, copie o UUID do usuário e execute:
INSERT INTO public.usuarios_sofhia (id, id_empresa, nome_usuario, ativo)
VALUES (
  'uuid-do-usuario-criado',
  'uuid-da-empresa',
  'Administrador',
  true
);
```

---

## Checklist de Validação

- [ ] Projeto Supabase criado
- [ ] Credenciais copiadas e salvas em `.env.local`
- [ ] Schema SQL executado sem erros
- [ ] RLS configurado e ativo
- [ ] Autenticação configurada (Email Provider)
- [ ] Redirect URLs configuradas
- [ ] Tipos TypeScript gerados (opcional mas recomendado)
- [ ] Servidor dev iniciado e funcionando
- [ ] Seed de dados executado (opcional)

---

## Troubleshooting

### Erro: "Invalid API key"
- Verifique se as credenciais em `.env.local` estão corretas
- Certifique-se de reiniciar o servidor dev após alterar `.env.local`

### Erro: "relation does not exist"
- O schema SQL não foi executado corretamente
- Execute novamente o script no SQL Editor

### Erro: "permission denied for table"
- RLS está bloqueando o acesso
- Verifique se as políticas RLS estão configuradas corretamente
- Para debug, você pode temporariamente desabilitar RLS (NÃO recomendado em produção)

### Erro de tipos TypeScript
- Execute: `npx supabase gen types typescript --project-id PROJECT_ID > types/database.ts`
- Reinicie o TypeScript server no VS Code (Cmd+Shift+P > "TypeScript: Restart TS Server")

---

## Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

**Próximos Passos:**
Após concluir este setup, você pode prosseguir com a implementação das telas de autenticação (Login/Cadastro).
