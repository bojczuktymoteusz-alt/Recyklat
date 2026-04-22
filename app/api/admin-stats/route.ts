import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Wylacz cache calkowicie — dane zawsze swiezee z bazy
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// SERVICE_ROLE_KEY do odczytu phone_clicks (omija RLS)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { password, ofertaIdFilter } = body;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
        await new Promise(r => setTimeout(r, 800));
        return NextResponse.json({ error: 'Brak dostepu' }, { status: 401 });
    }

    const teraz = new Date();
    const przed7Dniami = new Date(teraz); przed7Dniami.setDate(teraz.getDate() - 7);
    const przed30Dniami = new Date(teraz); przed30Dniami.setDate(teraz.getDate() - 30);
    const dzisiajStart = new Date(teraz); dzisiajStart.setHours(0, 0, 0, 0);
    const wczorajStart = new Date(dzisiajStart); wczorajStart.setDate(dzisiajStart.getDate() - 1);

    // Opcjonalny filtr po konkretnym ID ogloszenia
    const filterOfertaId = ofertaIdFilter ? Number(ofertaIdFilter) : null;

    try {
        // Zapytania do phone_clicks — z opcjonalnym filtrem po oferta_id
        const buildClickQuery = (q: any) =>
            filterOfertaId ? q.eq('oferta_id', filterOfertaId) : q;

        const [
            { count: wszystkie },
            { count: ostatnie7dni },
            { count: aktywne },
            { count: magicBoxUzyte },
            { count: dodaneDzisiaj },
            { count: dodaneWczoraj },
            { count: dodaneOstatnie30dni },
            { data: wszystkieOferty },
            { count: clicksWszystkie },
            { count: clicksFirmy },
            { count: clicksGoscie },
            { count: clicksDzisiaj },
            { count: clicksWczoraj },
            { data: topKlikniecia },
            // Jesli filtr — pobierz tytul oferty
            { data: ofertaInfo },
        ] = await Promise.all([
            supabase.from('oferty').select('*', { count: 'exact', head: true }),
            supabase.from('oferty').select('*', { count: 'exact', head: true }).gte('created_at', przed7Dniami.toISOString()),
            // Aktywne = wszystko poza 'sprzedane' (obsluguje brak statusu i rozne wartosci)
            supabase.from('oferty').select('*', { count: 'exact', head: true }).neq('status', 'sprzedane'),
            supabase.from('oferty').select('*', { count: 'exact', head: true }).eq('magic_box_used', true),
            supabase.from('oferty').select('*', { count: 'exact', head: true }).gte('created_at', dzisiajStart.toISOString()),
            supabase.from('oferty').select('*', { count: 'exact', head: true }).gte('created_at', wczorajStart.toISOString()).lt('created_at', dzisiajStart.toISOString()),
            supabase.from('oferty').select('*', { count: 'exact', head: true }).gte('created_at', przed30Dniami.toISOString()),
            supabase.from('oferty').select('id, wojewodztwo, typ_oferty, wyswietlenia, created_at, material, title'),
            buildClickQuery(supabase.from('phone_clicks').select('*', { count: 'exact', head: true })),
            buildClickQuery(supabase.from('phone_clicks').select('*', { count: 'exact', head: true }).eq('user_type', 'firma')),
            buildClickQuery(supabase.from('phone_clicks').select('*', { count: 'exact', head: true }).eq('user_type', 'gosc')),
            buildClickQuery(supabase.from('phone_clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', dzisiajStart.toISOString())),
            buildClickQuery(supabase.from('phone_clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', wczorajStart.toISOString()).lt('clicked_at', dzisiajStart.toISOString())),
            supabase.from('phone_clicks').select('oferta_id').limit(1000),
            filterOfertaId
                ? supabase.from('oferty').select('id, title, material').eq('id', filterOfertaId).single()
                : Promise.resolve({ data: null }),
        ]);

        const wyswietleniaWszystkie = wszystkieOferty?.reduce((s, o) => s + (o.wyswietlenia || 0), 0) ?? 0;
        const wyswietleniaOstatnie30dni = wszystkieOferty
            ?.filter(o => new Date(o.created_at) >= przed30Dniami)
            .reduce((s, o) => s + (o.wyswietlenia || 0), 0) ?? 0;

        // DEBUG: zaloguj do konsoli Vercel jesli wszystkie=0
        if ((wszystkie ?? 0) === 0) {
            console.warn('STATS: wszystkie=0 — sprawdz RLS tabeli oferty lub SERVICE_ROLE_KEY');
        }

        const ctr = wyswietleniaWszystkie > 0
            ? Math.round(((clicksWszystkie ?? 0) / wyswietleniaWszystkie) * 1000) / 10
            : 0;

        // Mapa id->material dla top surowcow
        const ofertaIdMap: Record<number, { material: string; title: string }> = {};
        (wszystkieOferty || []).forEach((o: any) => {
            if (o.id) ofertaIdMap[o.id] = { material: o.material || '', title: o.title || '' };
        });

        const surowiecCount: Record<string, number> = {};
        (topKlikniecia || []).forEach((c: any) => {
            // Jesli jest filtr, liczymy tylko klikniecia dla tej oferty
            if (filterOfertaId && c.oferta_id !== filterOfertaId) return;
            const oferta = ofertaIdMap[c.oferta_id];
            if (oferta) {
                const kat = oferta.material || oferta.title || 'Inne';
                surowiecCount[kat] = (surowiecCount[kat] || 0) + 1;
            }
        });
        const topSurowce = Object.entries(surowiecCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

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

        const uzyteMagicBox = magicBoxUzyte ?? 0;
        const oszczednoscMinut = uzyteMagicBox * 3;
        const oszczednoscGodzin = Math.round(oszczednoscMinut / 60 * 10) / 10;

        // Tytul oferty dla raportu filtrowanego
        const tytulFiltru = ofertaInfo
            ? ((ofertaInfo as any).title || (ofertaInfo as any).material || `Oferta #${filterOfertaId}`)
            : null;

        const response = NextResponse.json({
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
            ruch: { wyswietleniaWszystkie, wyswietleniaOstatnie30dni },
            klikniecia: {
                wszystkie: clicksWszystkie ?? 0,
                firmy: clicksFirmy ?? 0,
                goscie: clicksGoscie ?? 0,
                dzisiaj: clicksDzisiaj ?? 0,
                wczoraj: clicksWczoraj ?? 0,
                ctr,
            },
            magicBox: { uzyte: uzyteMagicBox, procent: wszystkie ? Math.round((uzyteMagicBox / wszystkie) * 100) : 0, oszczednoscGodzin, oszczednoscMinut },
            topWojewodztwa,
            topSurowce,
            // Metadane filtru
            filtr: filterOfertaId ? { ofertaId: filterOfertaId, tytul: tytulFiltru } : null,
        });

        // Wylacz cache na poziomie HTTP
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        return response;

    } catch (err) {
        console.error('Admin stats error:', err);
        return NextResponse.json({ error: 'Blad serwera' }, { status: 500 });
    }
}
