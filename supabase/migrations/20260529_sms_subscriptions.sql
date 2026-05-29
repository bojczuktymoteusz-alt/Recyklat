-- Tabela subskrypcji SMS
-- Uruchom w panelu Supabase: Database > SQL Editor

create table if not exists public.sms_subscriptions (
  id                uuid primary key default gen_random_uuid(),
  phone             text not null,

  -- Nazwa materiału musi dokładnie odpowiadać wartości w oferty.material
  -- np. 'Tworzywa twarde (PP, PE, HDPE)', 'Folia bezbarwna (LDPE / LLDPE)'
  material_name     text not null,

  -- Województwo BEZ polskich znaków (normalizowane), np. 'dolnoslaskie', 'slaskie'
  -- Pełna lista kluczy: dolnoslaskie, kujawsko-pomorskie, lubelskie, lubuskie,
  --   lodzkie, malopolskie, mazowieckie, opolskie, podkarpackie, podlaskie,
  --   pomorskie, slaskie, swietokrzyskie, warminsko-mazurskie, wielkopolskie, zachodniopomorskie
  -- Wartość specjalna 'cala_polska' oznacza: subskrybent chce ogłoszenia z całej Polski
  wojewodztwo       text not null,

  -- Typ oferty KTÓRĄ subskrybent POSIADA ('sprzedam' lub 'kupie')
  -- Jeśli ma 'sprzedam' → dostanie SMS o nowych 'kupie' (szuka odbiorcy)
  -- Jeśli ma 'kupie'    → dostanie SMS o nowych 'sprzedam' (szuka dostawcy)
  typ_subskrybenta  text not null check (typ_subskrybenta in ('sprzedam', 'kupie')),

  zgoda_sms         boolean not null default true,
  created_at        timestamptz not null default now()
);

-- Jeden numer może subskrybować wiele kombinacji (materiał × województwo × typ)
create unique index if not exists sms_subscriptions_uniq_idx
  on public.sms_subscriptions (phone, material_name, wojewodztwo, typ_subskrybenta);

-- Indeks dla zapytan w Edge Function
create index if not exists sms_subscriptions_filter_idx
  on public.sms_subscriptions (material_name, typ_subskrybenta, zgoda_sms);

alter table public.sms_subscriptions enable row level security;

-- Tylko service_role (Edge Function) może czytać numery telefonów
create policy "service_role_select" on public.sms_subscriptions
  for select using (auth.role() = 'service_role');

-- Przykładowe dane testowe (zakomentuj przed produkcją)
-- insert into public.sms_subscriptions (phone, material_name, wojewodztwo, typ_subskrybenta)
-- values ('+48500000001', 'Tworzywa twarde (PP, PE, HDPE)', 'slaskie', 'kupie');
