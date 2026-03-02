# Guia de Deployment para Vercel

## Pré-requisitos

- Node.js 20.x ou superior
- npm 10.x ou superior
- Conta no Vercel (vercel.com)

## Variáveis de Ambiente Necessárias

Para um deployment completo, você precisa definir as seguintes variáveis no Vercel:

### Supabase Configuration
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=seu-chave-publica-aqui
```

## Instruções de Deployment

### 1. Local Testing (Antes do Deploy)
```bash
npm ci
npm run build
npm run preview
```

### 2. Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
```

### 3. Deploy via GitHub
1. Push para seu repositório GitHub
2. Conecte ao Vercel: https://vercel.com/new
3. Selecione seu repositório
4. Vercel detectará automaticamente que é um projeto Vite
5. Configure as variáveis de ambiente
6. Clique em "Deploy"

### 4. Deploy via Dashboard Vercel
1. Acesse https://vercel.com/dashboard
2. Clique em "Add New" > "Project"
3. Importe seu repositório GitHub
4. Configure as variáveis de ambiente
5. Clique em "Deploy"

## Arquivos de Configuração

- `vercel.json` - Configuração específica do Vercel
- `.nvmrc` - Versão do Node.js
- `vite.config.ts` - Configuração do Vite
- `.env.production` - Variáveis de produção (placeholders)

## Troubleshooting

### Erro: "vite: command not found"
✅ Resolvido via `vercel.json` com `buildCommand: "npm ci && npm run build"`

### Conflitos de Dependências
✅ Usando `npm ci` em vez de `npm install` para reprodutibilidade

### Variáveis de Ambiente
✅ Configure em: Vercel Dashboard > Settings > Environment Variables

## Performance

- Build otimizado com terser
- Code splitting automático
- Chunks de módulos: react, supabase, ui, charts, i18n

## Rollback

Se algo der errado:
1. Vercel mantém histórico de deployments
2. Clique no deployment anterior em "Deployments"
3. Clique em "Promote to Production"

## Monitoramento

- Acesse https://vercel.com/dashboard para ver logs
- Clique em seu projeto > "Deployments"
- Selecione um deploy para ver logs detalhados
