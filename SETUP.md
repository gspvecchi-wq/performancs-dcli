# PerformanCS — Guia de Configuração

## 1. Criar Projeto Supabase

1. Acesse [app.supabase.com](https://app.supabase.com) e crie um novo projeto
2. Anote: **URL do projeto**, **anon key** e **service_role key**

---

## 2. Configurar `.env.local`

Edite o arquivo `app/.env.local` com suas credenciais reais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WhatsApp (escolha um)
WHATSAPP_PROVIDER=zapi  # ou: evolution

# Z-API (https://app.z-api.io)
ZAPI_INSTANCE_ID=SUA_INSTANCIA
ZAPI_TOKEN=SEU_TOKEN
ZAPI_CLIENT_TOKEN=SEU_CLIENT_TOKEN
ZAPI_WEBHOOK_SECRET=UMA_CHAVE_SECRETA_ALEATORIA  # Ex: openssl rand -hex 32

# Evolution API (self-hosted)
# EVOLUTION_API_URL=https://sua-instancia.com
# EVOLUTION_API_KEY=sua-api-key
# EVOLUTION_INSTANCE=nome-da-instancia
```

---

## 3. Rodar as Migrations

Instale o [Supabase CLI](https://supabase.com/docs/guides/cli) e execute:

```bash
cd app

# Login no Supabase
supabase login

# Vincular ao seu projeto
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migrations (schema + RLS)
supabase db push

# Carregar seed data (4 pacientes de exemplo)
supabase db execute --file supabase/seed.sql
```

Ou rode manualmente no **SQL Editor** do dashboard Supabase:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_functions.sql` (se existir)
4. `supabase/seed.sql` (dados de exemplo)

---

## 4. Criar Primeiro Usuário

No dashboard Supabase → **Authentication** → **Users** → **Invite user**

Depois execute no SQL Editor para criar o perfil do usuário na tabela `usuarios`:

```sql
-- Substitua pelos valores reais
INSERT INTO usuarios (id, clinica_id, nome, email, papel)
VALUES (
  'UUID_DO_AUTH_USER',    -- auth.users.id do usuário criado
  (SELECT id FROM clinicas LIMIT 1),  -- primeira clínica do seed
  'Seu Nome',
  'seu@email.com',
  'admin'
);
```

---

## 5. Configurar Edge Functions (Cron)

```bash
# Deploy das funções
supabase functions deploy weekly-motivational
supabase functions deploy weekly-weight-request
supabase functions deploy generate-alerts

# Configurar cron jobs no dashboard:
# supabase → Edge Functions → Schedules
# - weekly-motivational:  0 9 * * 2   (toda terça 9h UTC)
# - weekly-weight-request: 0 10 * * 5  (toda sexta 10h UTC)
# - generate-alerts:       0 6 * * *   (diariamente 6h UTC)
```

Ou via SQL:

```sql
-- No SQL Editor do Supabase (requer pg_cron extensão)
SELECT cron.schedule('weekly-motivational',  '0 9 * * 2', 'SELECT net.http_post(...)');
SELECT cron.schedule('weekly-weight-request', '0 10 * * 5', 'SELECT net.http_post(...)');
SELECT cron.schedule('generate-alerts',       '0 6 * * *',  'SELECT net.http_post(...)');
```

---

## 6. Configurar Webhook WhatsApp

1. No dashboard da Z-API ou Evolution API, configure o webhook como:
   ```
   https://SEU_DOMINIO.vercel.app/api/whatsapp/webhook
   ```
2. Configure o `ZAPI_WEBHOOK_SECRET` no `.env.local` com o mesmo secret gerado

---

## 7. Rodar em Desenvolvimento

```bash
cd app
npm install
npm run dev
```

Acesse: http://localhost:3000 → redireciona para `/login`

---

## 8. Deploy para Produção (Vercel)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configurar variáveis de ambiente no dashboard Vercel
# → Settings → Environment Variables
```

**Variáveis obrigatórias na Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_PROVIDER`
- `ZAPI_INSTANCE_ID` / `ZAPI_TOKEN` / `ZAPI_CLIENT_TOKEN` / `ZAPI_WEBHOOK_SECRET`

---

## Arquitetura de Segurança

```
Browser → API Route (server-side)
  → WhatsApp API (com tokens secretos do .env)
  → Supabase (com service_role key)

Browser → Supabase Anon Key (somente leitura com RLS)
```

**Nunca exponha:**
- `SUPABASE_SERVICE_ROLE_KEY` — tem acesso admin ao banco
- `ZAPI_TOKEN` — controla a instância WhatsApp
- `ZAPI_WEBHOOK_SECRET` — usado para validar webhooks

---

## Estrutura de Pastas

```
app/
├── app/             # Next.js App Router
│   ├── (auth)/      # Tela de login
│   ├── (app)/       # Páginas autenticadas
│   └── api/         # API Routes (server-side)
├── components/      # Componentes React reutilizáveis
├── lib/             # Utilitários (supabase, whatsapp, scoring, etc.)
├── types/           # TypeScript interfaces
└── supabase/        # Migrations, seed, edge functions
```
