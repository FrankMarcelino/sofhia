# Diretrizes de Desenvolvimento — SOFHIA Enterprise

Este documento estabelece os princípios, padrões e práticas que devem ser seguidos durante todo o desenvolvimento do projeto SOFHIA Enterprise.

---

## 🎯 Princípios Fundamentais

### 1. Simplicidade e Pragmatismo

**❌ NUNCA use over-engineering**

- Implemente apenas o que é necessário para atender aos requisitos
- Evite abstrações prematuras
- Prefira código simples e direto ao código "elegante" mas complexo
- "Make it work, make it right, make it fast" — nessa ordem

### 2. Princípios SOLID

Todos os componentes e módulos devem seguir os princípios SOLID:

- **S (Single Responsibility)**: Cada componente/função tem uma única responsabilidade bem definida
- **O (Open/Closed)**: Aberto para extensão, fechado para modificação
- **L (Liskov Substitution)**: Subtipos devem ser substituíveis pelos seus tipos base
- **I (Interface Segregation)**: Interfaces específicas são melhores que interfaces genéricas
- **D (Dependency Inversion)**: Dependa de abstrações, não de implementações concretas

### 3. Clean Code

- Nomes descritivos e auto-explicativos
- Funções pequenas e focadas (máximo 20-30 linhas)
- Evite comentários óbvios; o código deve ser auto-documentado
- Comentários apenas para explicar o "porquê", não o "o quê"

---

## 🔍 Qualidade de Código

### ESLint

**SEMPRE execute ESLint antes de cada commit:**

```bash
npm run lint
```

- Corrija todos os erros e warnings
- Não desabilite regras sem justificativa documentada
- Mantenha o arquivo `.eslintrc` atualizado

### TypeScript Strict Mode

**Tipos são obrigatórios, nunca use `any`:**

- Use tipos explícitos em todos os parâmetros de função
- Aproveite a inferência de tipos do TypeScript quando possível
- Crie tipos customizados em `/types` para entidades de domínio
- Use `unknown` ao invés de `any` quando necessário

**Exemplos:**

```typescript
// ❌ ERRADO
function processar(dados: any) {
  return dados.valor;
}

// ✅ CORRETO
interface DadosProcessamento {
  valor: number;
  timestamp: Date;
}

function processar(dados: DadosProcessamento): number {
  return dados.valor;
}
```

### Build Testing

**Ao final de CADA implementação, execute:**

```bash
npm run build
```

- Garanta que o build passa sem erros
- Verifique warnings e resolva se possível
- Teste a aplicação em modo produção localmente

---

## 📁 Organização de Código

### Estrutura de Diretórios

Mantenha a estrutura organizada e consistente:

```
/app              → Rotas e páginas (Next.js App Router)
/components       → Componentes React reutilizáveis
  /ui            → Componentes base (Shadcn/UI)
  /dashboard     → Componentes específicos do Dashboard
  /[modulo]      → Componentes por módulo
/lib              → Utilitários, helpers, hooks
  /supabase      → Cliente e helpers do Supabase
  /utils         → Funções utilitárias
  /hooks         → Custom hooks
/types            → Definições de tipos TypeScript
/doc              → Documentação do projeto
```

### Convenções de Nomenclatura

- **Componentes React**: PascalCase (`DashboardCard.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useAuth.ts`)
- **Utilitários**: camelCase (`formatCurrency.ts`)
- **Tipos/Interfaces**: PascalCase (`User`, `DashboardKPIs`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)

---

## 🎨 Padrões de UI/UX

### Componentes

1. **Um componente = Um arquivo**
2. **Co-locate** estilos e testes com o componente
3. **Props explícitas**: sempre defina interface de props
4. **Composição > Herança**: componha componentes menores

```typescript
// ✅ CORRETO
interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning';
}

export function KPICard({ title, value, icon: Icon, variant = 'default' }: KPICardProps) {
  return (
    <Card className={cn('p-4', variantStyles[variant])}>
      <Icon className="w-6 h-6" />
      <h3>{title}</h3>
      <p>{value}</p>
    </Card>
  );
}
```

### Responsividade

- **Mobile-first**: desenvolva primeiro para mobile
- Use breakpoints do Tailwind: `sm:`, `md:`, `lg:`, `xl:`
- Teste em múltiplos tamanhos de tela

### Acessibilidade

- **Sempre** use atributos ARIA quando necessário
- **Sempre** forneça `alt` em imagens
- **Sempre** garanta contraste adequado (WCAG AA)
- **Sempre** suporte navegação por teclado

---

## 🔐 Segurança

### Regras de Ouro

1. **NUNCA** exponha chaves de API no frontend
2. **SEMPRE** use Row Level Security (RLS) no Supabase
3. **SEMPRE** valide input no cliente E no servidor
4. **SEMPRE** sanitize dados antes de renderizar
5. **NUNCA** confie em dados do cliente

### Exemplo de Validação

```typescript
// ✅ CORRETO - Validação no cliente
const schema = z.object({
  email: z.string().email(),
  nome: z.string().min(3).max(100),
});

// Validação no servidor (Supabase RPC/Edge Function)
if (!validateInput(data)) {
  throw new Error('Invalid input');
}
```

---

## 🧪 Testing

### Testes Críticos

Priorize testes para:

1. **Autenticação**: login, cadastro, reset de senha
2. **Financeiro**: cálculos de créditos, transações
3. **Integrações**: chamadas a APIs externas (mock)
4. **Formulários**: validações e submissões

### Padrão de Testes

```typescript
// exemplo.test.tsx
import { render, screen } from '@testing-library/react';
import { KPICard } from './KPICard';

describe('KPICard', () => {
  it('renders title and value correctly', () => {
    render(<KPICard title="Vendas Hoje" value={1250.50} icon={DollarSign} />);
    
    expect(screen.getByText('Vendas Hoje')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.250,50')).toBeInTheDocument();
  });
});
```

---

## 🚀 Performance

### Otimizações Obrigatórias

1. **React Query**: cache e revalidação de dados
2. **Lazy Loading**: componentes pesados com `React.lazy()`
3. **Virtual Scroll**: listas com 100+ itens
4. **Image Optimization**: use `next/image`
5. **Bundle Analysis**: monitore tamanho do bundle

### Métricas Alvo

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

---

## 📝 Git e Versionamento

### Commits

Formato: `tipo(escopo): descrição`

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (sem mudança de lógica)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

**Exemplos:**
```
feat(dashboard): adiciona gráfico de funil de vendas
fix(auth): corrige validação de token expirado
docs(readme): atualiza instruções de setup
```

### Branches

- `main`: Produção (protegida)
- `develop`: Desenvolvimento
- `feature/nome-feature`: Novas funcionalidades
- `fix/nome-bug`: Correções
- `refactor/nome`: Refatorações

---

## 📊 Monitoramento e Logging

### Logs

- Use níveis apropriados: `info`, `warn`, `error`
- **NUNCA** logue informações sensíveis (tokens, senhas, CPF, etc.)
- Use logging estruturado (JSON)

```typescript
// ✅ CORRETO
logger.info('User logged in', { userId: user.id, timestamp: Date.now() });

// ❌ ERRADO
console.log('User logged in:', user.email, user.password);
```

---

## 🔄 Workflow de Desenvolvimento

### Ciclo de Implementação

1. **Ler** o plano e entender o requisito
2. **Implementar** seguindo as diretrizes
3. **Testar** manualmente a funcionalidade
4. **Executar** ESLint e corrigir erros
5. **Verificar** tipos TypeScript
6. **Executar** build (`npm run build`)
7. **Atualizar** `status_do_projeto.md`
8. **Commit** com mensagem descritiva

### Checklist Antes do Commit

- [ ] Código segue princípios SOLID
- [ ] ESLint passa sem erros
- [ ] TypeScript sem erros de tipo
- [ ] Build executa com sucesso
- [ ] Funcionalidade testada manualmente
- [ ] Documentação atualizada (se necessário)
- [ ] `status_do_projeto.md` atualizado

---

## 🎓 Recursos de Referência

- [Clean Code (Robert C. Martin)](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [SOLID Principles](https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

---

## 🚨 Proibições Absolutas

### NUNCA faça isso:

1. ❌ Commit código com `console.log` para debug
2. ❌ Commit código com `any` types sem justificativa
3. ❌ Commit código com erros de ESLint
4. ❌ Commit código sem testar build
5. ❌ Commit credenciais ou chaves de API
6. ❌ Disable TypeScript checks (`@ts-ignore` sem motivo)
7. ❌ Código duplicado (DRY - Don't Repeat Yourself)
8. ❌ Componentes gigantes (>300 linhas)
9. ❌ Funções com mais de 5 parâmetros
10. ❌ Deploy sem testar em ambiente de staging

---

## 📌 Notas Finais

- **Estas diretrizes são vivas**: atualize conforme o projeto evolui
- **Quando em dúvida**: pergunte, não assuma
- **Qualidade > Velocidade**: código bem feito economiza tempo no futuro
- **Documente decisões importantes**: use comentários e ADRs (Architecture Decision Records)

---

**Versão:** 1.0  
**Última Atualização:** 03/02/2026  
**Mantido por:** Equipe SOFHIA Enterprise
