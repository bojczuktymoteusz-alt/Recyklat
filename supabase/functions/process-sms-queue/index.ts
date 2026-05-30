import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Wysyła SMS-y z kolejki — uruchamiany cronem o 08:01 pon–sob (czasu warszawskiego)

async function sendSMS(to: string, message: string): Promise<void> {
  const key = Deno.env.get('SMS_PLANET_API_KEY')
  const password = Deno.env.get('SMS_PLANET_API_PASSWORD')
  if (!key || !password) throw new Error('Brak sekretow SMS_PLANET_API_KEY / SMS_PLANET_API_PASSWORD')

  const body = new URLSearchParams({ key, password, from: 'Recyklat.pl', to, msg: message })
  const response = await fetch('https://api2.smsplanet.pl/sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SMSPlanet HTTP ${response.status}: ${text}`)
  }
  const json = await response.json()
  if (json.errorCode) throw new Error(`SMSPlanet blad: ${json.errorCode} — ${json.errorMsg ?? ''}`)
}

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: pending, error } = await supabase
    .from('sms_queue')
    .select('id, phone, message')
    .lte('scheduled_for', new Date().toISOString())
    .is('sent_at', null)
    .limit(200)

  if (error) {
    console.error('Blad pobierania kolejki:', error)
    return new Response('Internal Server Error', { status: 500 })
  }

  if (!pending?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 })
  }

  const results = await Promise.allSettled(
    pending.map(async (item) => {
      await sendSMS(item.phone, item.message)
      await supabase
        .from('sms_queue')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', item.id)
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Blad kolejki dla ${pending[i].phone}:`, (r as PromiseRejectedResult).reason)
    }
  })

  console.log(`Kolejka SMS: wyslano ${sent}, bledy ${failed}`)
  return new Response(JSON.stringify({ sent, failed }), { status: 200 })
})
