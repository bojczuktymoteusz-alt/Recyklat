// =============================================================================
// MODUŁ DOSTAWCY SMS — SMSPlanet (smsplanet.pl)
//
// Aby zmienić bramkę: podmień WYŁĄCZNIE ten plik.
// Sygnatura sendSMS(to, message) pozostaje bez zmian.
//
// Wymagane zmienne środowiskowe w Supabase Edge Function Secrets:
//   SMSPLANET_KEY      — klucz API z panelu SMSPlanet
//   SMSPLANET_PASSWORD — hasło API z panelu SMSPlanet
// =============================================================================

export async function sendSMS(to: string, message: string): Promise<void> {
  const key = Deno.env.get('SMSPLANET_KEY')
  const password = Deno.env.get('SMSPLANET_PASSWORD')

  if (!key || !password) {
    throw new Error('Brak zmiennych srodowiskowych SMSPLANET_KEY lub SMSPLANET_PASSWORD')
  }

  const body = new URLSearchParams({
    key,
    password,
    from: 'Recyklat',
    to,
    msg: message,
  })

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
  if (json.errorCode) {
    throw new Error(`SMSPlanet blad: ${json.errorCode} — ${json.errorMsg ?? ''}`)
  }
}
