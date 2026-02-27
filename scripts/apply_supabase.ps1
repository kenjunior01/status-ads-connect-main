param(
  [string]$AccessToken,
  [string]$ProjectRef
)

if (-not $ProjectRef) {
  $envPath = Join-Path (Get-Location) ".env"
  if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    $line = $envContent | Where-Object { $_ -match "^VITE_SUPABASE_PROJECT_ID=" }
    if ($line) {
      $ProjectRef = ($line -split "=",2)[1].Trim('"')
    }
  }
}

if (-not $ProjectRef) {
  $ProjectRef = "uastfomemuftxvlzehww"
}

if (-not $AccessToken) {
  $AccessToken = $env:SUPABASE_ACCESS_TOKEN
}

if (-not $AccessToken) {
  Write-Error "Provide AccessToken or set SUPABASE_ACCESS_TOKEN environment variable."
  exit 1
}

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    winget install Supabase.SupabaseCLI --silent
  } elseif (Get-Command scoop -ErrorAction SilentlyContinue) {
    scoop install supabase
  } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    npm i -g supabase
  } else {
    Write-Error "Supabase CLI not found and no installer available."
    exit 1
  }
}

$env:SUPABASE_ACCESS_TOKEN = $AccessToken
supabase login --token $env:SUPABASE_ACCESS_TOKEN
supabase link --project-ref $ProjectRef
supabase db push
supabase functions deploy create-escrow-payment
supabase functions deploy release-escrow
supabase functions deploy paypal-create-payment
supabase functions deploy mpesa-init
supabase functions deploy paypal-webhook
supabase functions deploy pix-webhook
supabase functions deploy mbway-webhook
supabase functions deploy multicaixa-webhook
supabase functions deploy subscription-dunning
supabase functions deploy banner-track
