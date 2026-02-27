# Deploy Supabase

## Pré-requisitos
- Supabase CLI instalado (winget, scoop ou npm)
- Token de acesso temporário
- Project ref: uastfomemuftxvlzehww

## Migrações e Funções
1. Defina o token:
   - PowerShell: `$env:SUPABASE_ACCESS_TOKEN="SEU_TOKEN"`
2. Execute o script:
   - `powershell -ExecutionPolicy Bypass -File ./scripts/apply_supabase.ps1 -AccessToken $env:SUPABASE_ACCESS_TOKEN -ProjectRef uastfomemuftxvlzehww`
3. Configure variáveis das funções no Studio:
   - PayPal: `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_BASE_URL`
   - M-Pesa: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL`, `MPESA_BASE_URL`
   - Stripe: `STRIPE_SECRET_KEY`
   - Banner Track: usa `SUPABASE_URL` e `SUPABASE_ANON_KEY` padrão
4. Funções Edge:
   - create-escrow-payment, release-escrow
   - paypal-create-payment, paypal-webhook
   - mpesa-init
   - pix-webhook, mbway-webhook, multicaixa-webhook
   - subscription-dunning
   - banner-track

## Verificação
- Tabelas e triggers aplicadas
- Funções Edge deployadas
- Fluxos: onboarding, provas, disputa, pagamentos, banner tracking
