import { NextRequest, NextResponse } from 'next/server';

// Wspolna funkcja wysylki przez Resend
async function wyslijEmail(apiKey: string, to: string, subject: string, html: string) {
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            from: 'Recyklat <onboarding@resend.dev>',
            to: [to],
            subject,
            html,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('[Resend error]', res.status, text);
        return false;
    }
    return true;
}

// ── TRANSPORT LEAD ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const body = await req.json();
    const { type, ...data } = body;

    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || 'bojczuktymoteusz@gmail.com';

    if (!apiKey) {
        console.error('[Mail] Brak RESEND_API_KEY');
        return NextResponse.json({ ok: false, error: 'Brak klucza API' }, { status: 500 });
    }

    // ── WERYFIKACJA FIRMY ────────────────────────────────────────────────────
    if (type === 'weryfikacja') {
        const { nip, nazwaFirmy, telefon, ofertaId, chceCO2 } = data;

        const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fffbeb; border-radius: 12px;">
          <div style="background: #b45309; padding: 20px 24px; border-radius: 10px; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 900;">⭐ Nowe zgłoszenie weryfikacji — Recyklat.pl</h1>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 16px; background: white; border-radius: 8px 8px 0 0; border-bottom: 1px solid #fef3c7;">
              <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8;">Firma</span><br>
              <span style="font-size: 20px; font-weight: 900; color: #0f172a;">${nazwaFirmy || '—'}</span>
            </td></tr>
            <tr><td style="padding: 12px 16px; background: white; border-bottom: 1px solid #fef3c7;">
              <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8;">NIP</span><br>
              <span style="font-size: 18px; font-weight: 700; color: #1e293b;">${nip || '—'}</span>
            </td></tr>
            <tr><td style="padding: 12px 16px; background: white; border-bottom: 1px solid #fef3c7;">
              <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8;">Telefon</span><br>
              <span style="font-size: 18px; font-weight: 700; color: #1e293b;">${telefon || '—'}</span>
            </td></tr>
            <tr><td style="padding: 12px 16px; background: white; border-bottom: 1px solid #fef3c7;">
              <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8;">ID Ogłoszenia</span><br>
              <span style="font-size: 18px; font-weight: 700; color: #1e293b;">#${ofertaId || '—'}</span>
            </td></tr>
            <tr><td style="padding: 12px 16px; background: white; border-radius: 0 0 8px 8px;">
              <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8;">Raport CO₂</span><br>
              <span style="font-size: 18px; font-weight: 900; color: ${chceCO2 ? '#16a34a' : '#94a3b8'};">
                ${chceCO2 ? '✅ TAK — klient prosi o raport' : '❌ NIE'}
              </span>
            </td></tr>
          </table>
          <p style="margin-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
            Recyklat.pl · ${new Date().toLocaleString('pl-PL')}
          </p>
        </div>`;

        const ok = await wyslijEmail(
            apiKey,
            adminEmail,
            `⭐ Weryfikacja: ${nazwaFirmy} (NIP: ${nip}) — CO₂: ${chceCO2 ? 'TAK' : 'NIE'}`,
            html
        );

        return NextResponse.json({ ok });
    }

    // ── TRANSPORT LEAD (domyslny typ) ─────────────────────────────────────────
    const { ofertaId, tytul, lokalizacja, wojewodztwo, dystansKm, kosztPaliwa, cenaPaliwa, waga } = data;
    const lokStr = [lokalizacja, wojewodztwo].filter(Boolean).join(', ') || '—';

    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
      <div style="background: #0f172a; padding: 20px 24px; border-radius: 10px; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 900;">🚛 Zapytanie o transport — Recyklat.pl</h1>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 12px 16px; background: white; border-radius: 8px 8px 0 0; border-bottom: 1px solid #f1f5f9;">
          <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8;">Ogłoszenie</span><br>
          <span style="font-size: 18px; font-weight: 900; color: #0f172a;">#${ofertaId} — ${tytul || '—'}</span>
        </td></tr>
        <tr><td style="padding: 12px 16px; background: white; border-bottom: 1px solid #f1f5f9;">
          <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8;">Lokalizacja towaru</span><br>
          <span style="font-size: 16px; font-weight: 700; color: #1e293b;">${lokStr}</span>
        </td></tr>
        <tr><td style="padding: 12px 16px; background: white; border-bottom: 1px solid #f1f5f9;">
          <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8;">Szacowany dystans</span><br>
          <span style="font-size: 16px; font-weight: 700; color: #1e293b;">${dystansKm ? dystansKm + ' km' : 'nieznany'}</span>
        </td></tr>
        <tr><td style="padding: 12px 16px; background: white; border-bottom: 1px solid #f1f5f9;">
          <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8;">Szacunkowy koszt paliwa</span><br>
          <span style="font-size: 20px; font-weight: 900; color: #2563eb;">${kosztPaliwa ? kosztPaliwa + ' zł' : '—'}</span>
          <span style="font-size: 11px; color: #94a3b8; display: block; margin-top: 2px;">cena ON: ${cenaPaliwa || '?'} zł/l · spalanie 33 l/100km</span>
        </td></tr>
        <tr><td style="padding: 12px 16px; background: white; border-radius: 0 0 8px 8px;">
          <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8;">Ilość towaru</span><br>
          <span style="font-size: 16px; font-weight: 700; color: #1e293b;">${waga ? waga + ' ton' : '—'}</span>
        </td></tr>
      </table>
      <div style="margin-top: 20px; padding: 16px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; font-size: 13px; color: #1e40af; font-weight: 600;">
          👉 Kupiec zainteresowany wyceną transportu dla tej oferty.
        </p>
      </div>
      <p style="margin-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        Recyklat.pl · ${new Date().toLocaleString('pl-PL')}
      </p>
    </div>`;

    const ok = await wyslijEmail(
        apiKey,
        adminEmail,
        `🚛 Lead transportowy: Oferta #${ofertaId} — ${lokStr}`,
        html
    );

    return NextResponse.json({ ok });
}
