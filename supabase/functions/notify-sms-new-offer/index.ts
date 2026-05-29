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
  'slaskie':             ['dolnoslaskie', 'opolskie', 'lodzkie', 'malopolskie'],
  'swietokrzyskie':      ['lodzkie', 'mazowieckie', 'lubelskie', 'podkarpackie', 'malopolskie'],
  'warminsko-mazurskie': ['pomorskie', 'kujawsko-pomorskie', 'mazowieckie', 'podlaskie'],
  'wielkopolskie':       ['lubuskie', 'zachodniopomorskie', 'kujawsko-pomorskie', 'lodzkie', 'opolskie', 'dolnoslaskie'],
  'zachodniopomorskie':  ['lubuskie', 'wielkopolskie', 'kujawsko-pomorskie', 'pomorskie'],
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

function getReachableSet(offerWojewodztwaRaw: string): Set<string> | 'cala_polska' {
  const parts = offerWojewodztwaRaw.split(',').map(w => w.trim()).filter(Boolean)
  const normalized = parts.map(normalizeWoj)

  if (normalized.some(n => n.includes('cala polska') || n.includes('caly kraj'))) {
    return 'cala_polska'
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

  if (reachable !== 'cala_polska') {
    query = query.in('wojewodztwo', ['cala_polska', ...reachable])
  }

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

  const message =
    `Nowy anons w Twojej kategorii na Recyklat.pl - zobacz: recyklat.pl/rynek/${offer.id}`

  const results = await Promise.allSettled(
    (subscribers as SmsSubscription[]).map((sub) => sendSMS(sub.phone, message))
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(
        `SMS nie wyslany do ${(subscribers as SmsSubscription[])[i].phone}:`,
        (r as PromiseRejectedResult).reason
      )
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
