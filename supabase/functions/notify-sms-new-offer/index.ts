import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendSMS } from './sms-provider.ts'

// =============================================================================
// KONFIGURACJA — zmień tu, gdy zmieni się kategoria do obserwowania
// =============================================================================
//
// Musi dokładnie odpowiadać wartości pola `material` w tabeli `oferty`.
// Przykładowe wartości: 'Tworzywa twarde (PP, PE, HDPE)',
//   'Folia bezbarwna (LDPE / LLDPE)', 'Opakowania PET'
//
const TARGET_MATERIAL = 'Tworzywa twarde (PP, PE, HDPE)' // <-- TU WPISZ WŁAŚCIWĄ KATEGORIĘ

// =============================================================================
// MAPA SĄSIADÓW — 16 województw, klucze znormalizowane (bez polskich znaków)
// =============================================================================

const NEIGHBORS: Record<string, string[]> = {
  'dolnoslaskie':        ['lubuskie', 'wielkopolskie', 'opolskie', 'slaskie'],
  'kujawsko-pomorskie':  ['zachodniopomorskie', 'pomorskie', 'warminsko-mazurskie', 'mazowieckie', 'lodzkie', 'wielkopolskie'],
  'lubelskie':           ['mazowieckie', 'podlaskie', 'podkarpackie', 'swietokrzyskie'],
  'lubuskie':            ['zachodniopomorskie', 'wielkopolskie', 'dolnoslaskie'],
  'lodzkie':             ['kujawsko-pomorskie', 'mazowieckie', 'swietokrzyskie', 'slaskie', 'opolskie', 'wielkopolskie', 'malopolskie'],
  'malopolskie':         ['slaskie', 'swietokrzyskie', 'podkarpackie', 'lodzkie'],
  'mazowieckie':         ['kujawsko-pomorskie', 'lodzkie', 'swietokrzyskie', 'lubelskie', 'podlaskie', 'warminsko-mazurskie'],
  'opolskie':            ['dolnoslaskie', 'lodzkie', 'slaskie', 'wielkopolskie'],
  'podkarpackie':        ['malopolskie', 'swietokrzyskie', 'lubelskie'],
  'podlaskie':           ['warminsko-mazurskie', 'mazowieckie', 'lubelskie'],
  'pomorskie':           ['zachodniopomorskie', 'kujawsko-pomorskie', 'warminsko-mazurskie', 'wielkopolskie'],
  'slaskie':             ['dolnoslaskie', 'opolskie', 'lodzkie', 'malopolskie', 'swietokrzyskie'],
  'swietokrzyskie':      ['lodzkie', 'mazowieckie', 'lubelskie', 'podkarpackie', 'malopolskie', 'slaskie'],
  'warminsko-mazurskie': ['pomorskie', 'kujawsko-pomorskie', 'mazowieckie', 'podlaskie'],
  'wielkopolskie':       ['lubuskie', 'zachodniopomorskie', 'kujawsko-pomorskie', 'lodzkie', 'opolskie', 'dolnoslaskie'],
  'zachodniopomorskie':  ['lubuskie', 'wielkopolskie', 'kujawsko-pomorskie', 'pomorskie'],
}

// =============================================================================
// DOZWOLONE GODZINY WYSYŁKI (pon–sob, 08:00–21:00 czasu warszawskiego)
// =============================================================================

function getWarsawTime(date: Date = new Date()): { hour: number; dayOfWeek: number } {
  const fake = new Date(
    date.toLocaleString('sv-SE', { timeZone: 'Europe/Warsaw' }).replace(' ', 'T') + 'Z'
  )
  return { hour: fake.getUTCHours(), dayOfWeek: fake.getUTCDay() }
}

function isAllowedTime(): boolean {
  const { hour, dayOfWeek } = getWarsawTime()
  return dayOfWeek !== 0 && hour >= 8 && hour < 21
}

function nextAllowedSendTime(): Date {
  const now = new Date()
  const { hour, dayOfWeek } = getWarsawTime(now)

  // Ile dni do przodu: 0 jeśli przed 08:00 (tego samego dnia), inaczej jutro
  let daysToAdd = hour < 8 ? 0 : 1

  // Pomiń niedzielę
  while ((dayOfWeek + daysToAdd) % 7 === 0) daysToAdd++

  // Oblicz datę docelową w czasie warszawskim jako "fake UTC"
  const fakeNow = new Date(
    now.toLocaleString('sv-SE', { timeZone: 'Europe/Warsaw' }).replace(' ', 'T') + 'Z'
  )
  const fakeTarget = new Date(fakeNow.getTime() + daysToAdd * 86400000)
  fakeTarget.setUTCHours(8, 0, 0, 0)

  // Konwersja z czasu warszawskiego na prawdziwy UTC (metoda round-trip)
  const y = fakeTarget.getUTCFullYear()
  const m = String(fakeTarget.getUTCMonth() + 1).padStart(2, '0')
  const d = String(fakeTarget.getUTCDate()).padStart(2, '0')
  const approxUTC = new Date(`${y}-${m}-${d}T08:00:00Z`)
  const warsawCheck = new Date(
    approxUTC.toLocaleString('sv-SE', { timeZone: 'Europe/Warsaw' }).replace(' ', 'T') + 'Z'
  )
  const offsetMs = approxUTC.getTime() - warsawCheck.getTime()
  return new Date(approxUTC.getTime() + offsetMs)
}

// =============================================================================
// TYPY
// =============================================================================

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: OfertaRecord
}

interface OfertaRecord {
  id: number
  material: string
  typ_oferty: 'sprzedam' | 'kupie'
  wojewodztwo: string
  status: string
}

interface SmsSubscription {
  phone: string
}

// =============================================================================
// POMOCNICZE
// =============================================================================

function normalizeWoj(s: string): string {
  return s
    .toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .trim()
}

function getReachableSet(offerWojewodztwaRaw: string): Set<string> {
  const parts = offerWojewodztwaRaw.split(',').map(w => w.trim()).filter(Boolean)
  const normalized = parts.map(normalizeWoj)

  // Oferta ogólnopolska — powiadamiamy subskrybentów ze wszystkich konkretnych województw
  if (normalized.some(n => n.includes('cala polska') || n.includes('caly kraj'))) {
    return new Set(Object.keys(NEIGHBORS))
  }

  const reachable = new Set<string>()
  for (const woj of normalized) {
    reachable.add(woj)
    for (const neighbor of (NEIGHBORS[woj] ?? [])) {
      reachable.add(neighbor)
    }
  }
  return reachable
}

// =============================================================================
// HANDLER GŁÓWNY
// =============================================================================

Deno.serve(async (req: Request) => {
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
  if (webhookSecret) {
    const incoming = req.headers.get('x-webhook-secret')
    if (incoming !== webhookSecret) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  if (payload.type !== 'INSERT') {
    return new Response(JSON.stringify({ skipped: true, reason: 'not_insert' }), { status: 200 })
  }

  const offer = payload.record

  if (offer.material !== TARGET_MATERIAL) {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'wrong_material', material: offer.material }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (offer.status !== 'aktywna') {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'not_active' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const wojRaw = offer.wojewodztwo ?? ''
  if (normalizeWoj(wojRaw).includes('europa') || normalizeWoj(wojRaw).includes('zagranica')) {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'zagranica' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const reachable = getReachableSet(wojRaw)

  // Sprzedający szuka kupującego i odwrotnie
  const targetTypSubskrybenta: 'sprzedam' | 'kupie' =
    offer.typ_oferty === 'sprzedam' ? 'kupie' : 'sprzedam'

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let query = supabase
    .from('sms_subscriptions')
    .select('phone')
    .eq('material_name', TARGET_MATERIAL)
    .eq('typ_subskrybenta', targetTypSubskrybenta)
    .eq('zgoda_sms', true)

  // Tylko subskrybenci z konkretnym województwem (bez 'cala_polska', 'europa_zagranica')
  query = query.in('wojewodztwo', [...reachable])

  const { data: subscribers, error } = await query

  if (error) {
    console.error('Blad pobierania subskrybentow:', error)
    return new Response('Internal Server Error', { status: 500 })
  }

  if (!subscribers || subscribers.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, reason: 'no_subscribers' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const message = `Nowy anons w Twojej kategorii - zobacz: recyklat.pl/rynek/${offer.id}`
  const phones = (subscribers as SmsSubscription[]).map(s => s.phone)

  if (!isAllowedTime()) {
    // Poza dozwolonymi godzinami — dodaj do kolejki
    const scheduledFor = nextAllowedSendTime()
    const queueRows = phones.map(phone => ({
      phone,
      message,
      scheduled_for: scheduledFor.toISOString(),
    }))
    const { error: qErr } = await supabase.from('sms_queue').insert(queueRows)
    if (qErr) console.error('Blad kolejki SMS:', qErr)
    console.log(`Oferta ${offer.id} | zakolejkowano ${phones.length} SMS na ${scheduledFor.toISOString()}`)
    return new Response(
      JSON.stringify({ queued: phones.length, scheduled_for: scheduledFor }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Dozwolone godziny — wyślij natychmiast
  const results = await Promise.allSettled(phones.map(phone => sendSMS(phone, message)))

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`SMS nie wyslany do ${phones[i]}:`, (r as PromiseRejectedResult).reason)
    }
  })

  console.log(
    `Oferta ${offer.id} | material: ${offer.material} | typ: ${offer.typ_oferty}` +
    ` | woj: ${wojRaw} | wyslano: ${sent} | bledy: ${failed}`
  )

  return new Response(
    JSON.stringify({ sent, failed, offer_id: offer.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
