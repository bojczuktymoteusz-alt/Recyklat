// =============================================================================
// MODUŁ DOSTAWCY SMS
//
// Aby zmienić bramkę (Twilio, WhatsApp, inny provider):
// podmień WYŁĄCZNIE ten plik. Sygnatura sendSMS pozostaje bez zmian.
// =============================================================================

export async function sendSMS(to: string, message: string): Promise<void> {
  const token = Deno.env.get('SMSAPI_TOKEN')
  if (!token) {
    throw new Error('Brak zmiennej srodowiskowej SMSAPI_TOKEN')
  }

  const body = new URLSearchParams({
    to,
    message,
    from: 'Recyklat',
    format: 'json',
  })

  const response = await fetch('https://api.smsapi.pl/sms.do', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SMSAPI HTTP ${response.status}: ${text}`)
  }

  const json = await response.json()
  if (json.invalid_number || json.error) {
    throw new Error(`SMSAPI blad logiczny: ${JSON.stringify(json)}`)
  }
}
