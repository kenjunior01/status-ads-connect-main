# Desenvolvimento StatusAds

## Requisitos

- Node.js 18+
- npm, yarn, pnpm ou bun

## Começando

### 1. Instalar dependências
```bash
npm install
# ou
pnpm install
# ou
yarn install
# ou
bun install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
```

Se você não tem um projeto Supabase ainda, o projeto virá com valores padrão que permitirão visualizar a interface.

### 3. Executar o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:8080`

## Estrutura do Projeto

```
src/
├── components/        # Componentes React reutilizáveis
├── contexts/         # React Contexts (Auth, Localization, etc)
├── hooks/           # Custom React hooks
├── integrations/    # Integrações externas (Supabase, etc)
├── lib/            # Funções utilitárias
├── pages/          # Páginas da aplicação
├── App.tsx         # Componente raiz
└── main.tsx        # Ponto de entrada
```

## Tecnologias

- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Supabase** - Backend/Auth
- **TanStack Query** - Data fetching
- **Lucide Icons** - Icons
- **i18next** - Internationalização

## Recursos de Desenvolvimento

### Componentes disponíveis

A aplicação possui componentes UI pré-construídos baseados em shadcn/ui. Você pode encontrá-los em `src/components/ui/`.

### Temas

O projeto suporta temas via Tailwind CSS. As cores são definidas em `src/index.css` usando variáveis CSS.

### Internacionalização

O projeto suporta múltiplos idiomas via i18next. Adicione seus idiomas em `src/lib/i18n.ts`.

## Build

Para produção:

```bash
npm run build
```

O output estará em `dist/`.

## Problemas Comuns

### Supabase não está conectado
Se você vir erros relacionados ao Supabase, certifique-se de que as variáveis de ambiente estão definidas corretamente em `.env.local`.

### Componentes não carregam
Certifique-se de que todos os componentes importados existem em `src/components/`.

## Estrutura de Rotas

- `/` - Home
- `/auth` - Login/Signup
- `/creators` - Listagem de criadores
- `/ranking` - Ranking
- `/dashboard/creator` - Dashboard criador
- `/dashboard/advertiser` - Dashboard anunciante
- `/dashboard/admin` - Dashboard admin

## Debugging

Use `console.log("[v0] ...")` para debug. Logs de desenvolvimento serão visíveis no console do navegador.
