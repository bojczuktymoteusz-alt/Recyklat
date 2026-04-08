import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { nip, nazwaFirmy, telefon, ofertaId, material, chceCO2 } = await req.json();

    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || 'bojczuktymoteusz@gmail.com';

    if (!apiKey || apiKey === 'WSTAW_TU_KLUCZ_Z_RESEND') {
        // Brak klucza — logujemy ale nie crashujemy (weryfikacja w bazie już się zapisała)
        console.warn('[Weryfikacja] Brak RESEND_API_KEY — email nie wysłany');
        return NextResponse.json({ ok: true, email: false });
    }

    const co2Status = chceCO2 ? '✅ TAK — KLIENT PROSI O RAPORT CO₂' : '❌ NIE';

    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
      <div style="background: #0f172a; padding: 20px 24px; border-radius: 10px; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">
          ⭐ Nowa prośba o weryfikację — Recyklat.pl
        </h1>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 16px; background: white; border-radius: 8px 8px 0 0; border-bottom: 1px solid #f1f5f9;">
            <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Nazwa Firmy</span><br>
            <span style="font-size: 18px; font-weight: 900; color: #0f172a;">${nazwaFirmy || '—'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; background: white; border-bottom: 1px solid #f1f5f9;">
            <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">NIP</span><br>
            <span style="font-size: 16px; font-weight: 700; color: #1e293b; font-family: monospace;">${nip || '—'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; background: white; border-bottom: 1px solid #f1f5f9;">
            <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Telefon</span><br>
            <span style="font-size: 16px; font-weight: 700; color: #1e293b;">${telefon || '—'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; background: white; border-bottom: 1px solid #f1f5f9;">
            <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">ID Ogłoszenia / Materiał</span><br>
            <span style="font-size: 16px; font-weight: 700; color: #1e293b;">#${ofertaId} — ${material || '—'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; background: ${chceCO2 ? '#f0fdf4' : 'white'}; border-radius: 0 0 8px 8px;">
            <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Raport CO₂</span><br>
            <span style="font-size: 16px; font-weight: 900; color: ${chceCO2 ? '#16a34a' : '#64748b'};">${co2Status}</span>
          </td>
        </tr>
      </table>

      <div style="margin-top: 20px; padding: 16px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; font-size: 13px; color: #1e40af; font-weight: 600;">
          👉 Przejdź do Supabase i ustaw <code>is_verified = true</code> dla tej firmy po weryfikacji NIP.
        </p>
      </div>

      <p style="margin-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        Recyklat.pl — Panel Admina · ${new Date().toLocaleString('pl-PL')}
      </p>
    </div>
    `;

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: 'Recyklat <onboarding@resend.dev>',
                to: [adminEmail],
                subject: `⭐ Weryfikacja: ${nazwaFirmy || 'Nowa firma'} ${chceCO2 ? '+ RAPORT CO₂' : ''}`,
                html,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('[Resend] Błąd:', err);
            return NextResponse.json({ ok: true, email: false, error: err });
        }

        return NextResponse.json({ ok: true, email: true });
    } catch (err) {
        console.error('[Resend] Wyjątek:', err);
        return NextResponse.json({ ok: true, email: false });
    }
}
