param(
  [string]$AccessToken,
  [string]$ProjectRef,
  [string]$AdminEmail = "admin.test@example.com",
  [string]$AdminPassword = "Password123!",
  [string]$CreatorEmail = "creator.test@example.com",
  [string]$CreatorPassword = "Password123!",
  [string]$AdvertiserEmail = "advertiser.test@example.com",
  [string]$AdvertiserPassword = "Password123!"
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

supabase auth admin create-user --email $AdminEmail --password $AdminPassword --email-confirm
supabase auth admin create-user --email $CreatorEmail --password $CreatorPassword --email-confirm
supabase auth admin create-user --email $AdvertiserEmail --password $AdvertiserPassword --email-confirm

$sql = @"
insert into public.user_roles(user_id, role)
select id, 'admin'::public.app_role from auth.users where email = '$AdminEmail'
on conflict (user_id) do update set role = excluded.role, created_at = now();

insert into public.user_roles(user_id, role)
select id, 'creator'::public.app_role from auth.users where email = '$CreatorEmail'
on conflict (user_id) do update set role = excluded.role, created_at = now();

insert into public.user_roles(user_id, role)
select id, 'advertiser'::public.app_role from auth.users where email = '$AdvertiserEmail'
on conflict (user_id) do update set role = excluded.role, created_at = now();
"@

supabase db query "$sql"
