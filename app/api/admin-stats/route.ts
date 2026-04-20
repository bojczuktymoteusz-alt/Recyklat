import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
    const { password } = await req.json();

    if (!password || password !== process.env.ADMIN_PASSWORD) {
        await new Promise(r => setTimeout(r, 800));
        return NextResponse.json({ error: 'Brak dostepu' }, { status: 401 });
    }

    const teraz = new Date();
    const przed7Dniami = new Date(teraz); przed7Dniami.setDate(teraz.getDate() - 7);
    const przed30Dniami = new Date(teraz); przed30Dniami.setDate(teraz.getDate() - 30);
    const dzisiajStart = new Date(teraz); dzisiajStart.setHours(0, 0, 0, 0);
    const wczorajStart = new Date(dzisiajStart); wczorajStart.setDate(dzisiajStart.getDate() - 1);

    try {
        const [
            { count: wszystkie },
            { count: ostatnie7dni },
            { count: aktywne },
            { count: magicBoxUzyte },
            { count: dodaneDzisiaj },
            { count: dodaneWczoraj },
            { count: dodaneOstatnie30dni },
            { data: wszystkieOferty },
            // Klikniecia telefonu
            { count: clicksWszystkie },
            { count: clicksFirmy },
            { count: clicksGoscie },
            { count: clicksDzisiaj },
            { count: clicksWczoraj },
            { data: topKlikniecia },
        ] = await Promise.all([
            supabase.from('oferty').select('*', { count: 'exact', head: true }),
            supabase.from('oferty').select('*', { count: 'exact', head: true }).gte('created_at', przed7Dniami.toISOString()),
            supabase.from('oferty').select('*', { count: 'exact', head: true }).eq('status', 'aktywna'),
            supabase.from('oferty').select('*', { count: 'exact', head: true }).eq('magic_box_used', true),
            supabase.from('oferty').select('*', { count: 'exact', head: true }).gte('created_at', dzisiajStart.toISOString()),
            supabase.from('oferty').select('*', { count: 'exact', head: true }).gte('created_at', wczorajStart.toISOString()).lt('created_at', dzisiajStart.toISOString()),
            supabase.from('oferty').select('*', { count: 'exact', head: true }).gte('created_at', przed30Dniami.toISOString()),
            supabase.from('oferty').select('wojewodztwo, typ_oferty, wyswietlenia, created_at, material, title'),
            // Klikniecia — z tabeli phone_clicks (jesli istnieje)
            supabase.from('phone_clicks').select('*', { count: 'exact', head: true }),
            supabase.from('phone_clicks').select('*', { count: 'exact', head: true }).eq('user_type', 'firma'),
            supabase.from('phone_clicks').select('*', { count: 'exact', head: true }).eq('user_type', 'gosc'),
            supabase.from('phone_clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', dzisiajStart.toISOString()),
            supabase.from('phone_clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', wczorajStart.toISOString()).lt('clicked_at', dzisiajStart.toISOString()),
            // Top klikniete oferty z materialem
            supabase.from('phone_clicks').select('oferta_id').limit(500),
        ]);

        // Wyswietlenia
        const wyswietleniaWszystkie = wszystkieOferty?.reduce((s, o) => s + (o.wyswietlenia || 0), 0) ?? 0;
        const wyswietleniaOstatnie30dni = wszystkieOferty?.filter(o => new Date(o.created_at) >= przed30Dniami).reduce((s, o) => s + (o.wyswietlenia || 0), 0) ?? 0;

        // CTR: klikniecia / wyswietlenia * 100
        const ctr = wyswietleniaWszystkie > 0
            ? Math.round(((clicksWszystkie ?? 0) / wyswietleniaWszystkie) * 1000) / 10
            : 0;

        // Top surowce na podstawie klikniec w telefon
        const ofertaIdMap: Record<number, { material: string; title: string }> = {};
        (wszystkieOferty || []).forEach((o: any) => {
            if (o.id) ofertaIdMap[o.id] = { material: o.material || '', title: o.title || '' };
        });

        // Zlicz klikniecia per surowiec
        const surowiecCount: Record<string, number> = {};
        (topKlikniecia || []).forEach((c: any) => {
            const oferta = ofertaIdMap[c.oferta_id];
            if (oferta) {
                const kat = oferta.material || oferta.title || 'Inne';
                surowiecCount[kat] = (surowiecCount[kat] || 0) + 1;
            }
        });
        const topSurowce = Object.entries(surowiecCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Top wojewodztwa
        const topWojewodztwa = wszystkieOferty
            ? Object.entries(
                wszystkieOferty.reduce((acc: Record<string, number>, o) => {
                    const w = o.wojewodztwo?.trim();
                    if (w) acc[w] = (acc[w] || 0) + 1;
                    return acc;
                }, {})
            ).sort((a, b) => b[1] - a[1]).slice(0, 5)
            : [];

        const sprzedam = wszystkieOferty?.filter(o => o.typ_oferty !== 'kupie').length ?? 0;
        const kupie = wszystkieOferty?.filter(o => o.typ_oferty === 'kupie').length ?? 0;

        // Magic Box: oszczednosc czasu (3 min na uzycie)
        const uzyteMagicBox = magicBoxUzyte ?? 0;
        const oszczednoscMinut = uzyteMagicBox * 3;
        const oszczednoscGodzin = Math.round(oszczednoscMinut / 60 * 10) / 10;

        return NextResponse.json({
            ogloszenia: {
                wszystkie: wszystkie ?? 0,
                ostatnie7dni: ostatnie7dni ?? 0,
                aktywne: aktywne ?? 0,
                dodaneDzisiaj: dodaneDzisiaj ?? 0,
                dodaneWczoraj: dodaneWczoraj ?? 0,
                dodaneOstatnie30dni: dodaneOstatnie30dni ?? 0,
                sprzedam,
                kupie,
            },
            ruch: {
                wyswietleniaWszystkie,
                wyswietleniaOstatnie30dni,
            },
            klikniecia: {
                wszystkie: clicksWszystkie ?? 0,
                firmy: clicksFirmy ?? 0,
                goscie: clicksGoscie ?? 0,
                dzisiaj: clicksDzisiaj ?? 0,
                wczoraj: clicksWczoraj ?? 0,
                ctr,
            },
            magicBox: {
                uzyte: uzyteMagicBox,
                procent: wszystkie ? Math.round((uzyteMagicBox / wszystkie) * 100) : 0,
                oszczednoscGodzin,
                oszczednoscMinut,
            },
            topWojewodztwa,
            topSurowce,
        });

    } catch (err) {
        console.error('Admin stats error:', err);
        return NextResponse.json({ error: 'Blad serwera' }, { status: 500 });
    }
}
