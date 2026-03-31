import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase inicjalizowany TYLKO po stronie serwera
// Dane statystyczne nigdy nie opuszczają serwera bez autoryzacji
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
    const { password } = await req.json();

    // Hasło weryfikowane po stronie serwera — ADMIN_PASSWORD nigdy nie jest NEXT_PUBLIC_
    if (!password || password !== process.env.ADMIN_PASSWORD) {
        // Celowe opóźnienie żeby utrudnić brute force
        await new Promise(r => setTimeout(r, 800));
        return NextResponse.json({ error: 'Brak dostępu' }, { status: 401 });
    }

    const teraz = new Date();

    const przed7Dniami = new Date(teraz);
    przed7Dniami.setDate(teraz.getDate() - 7);

    const przed30Dniami = new Date(teraz);
    przed30Dniami.setDate(teraz.getDate() - 30);

    const dzisiajStart = new Date(teraz);
    dzisiajStart.setHours(0, 0, 0, 0);

    const wczorajStart = new Date(dzisiajStart);
    wczorajStart.setDate(dzisiajStart.getDate() - 1);

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
        ] = await Promise.all([
            supabase.from('oferty').select('*', { count: 'exact', head: true }),
            supabase.from('oferty').select('*', { count: 'exact', head: true })
                .gte('created_at', przed7Dniami.toISOString()),
            supabase.from('oferty').select('*', { count: 'exact', head: true })
                .neq('status', 'sprzedane'),
            supabase.from('oferty').select('*', { count: 'exact', head: true })
                .eq('magic_box_used', true),
            supabase.from('oferty').select('*', { count: 'exact', head: true })
                .gte('created_at', dzisiajStart.toISOString()),
            supabase.from('oferty').select('*', { count: 'exact', head: true })
                .gte('created_at', wczorajStart.toISOString())
                .lt('created_at', dzisiajStart.toISOString()),
            supabase.from('oferty').select('*', { count: 'exact', head: true })
                .gte('created_at', przed30Dniami.toISOString()),
            supabase.from('oferty').select('wojewodztwo, typ_oferty, wyswietlenia, created_at'),
        ]);

        // Suma wyświetleń wszystkich ogłoszeń
        const wyswietleniaWszystkie = wszystkieOferty?.reduce(
            (sum, o) => sum + (o.wyswietlenia || 0), 0
        ) ?? 0;

        // Wyświetlenia z ostatnich 30 dni (dla ogłoszeń dodanych w tym okresie)
        const wyswietleniaOstatnie30dni = wszystkieOferty
            ?.filter(o => new Date(o.created_at) >= przed30Dniami)
            .reduce((sum, o) => sum + (o.wyswietlenia || 0), 0) ?? 0;

        // Top 5 województw
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
            magicBox: {
                uzyte: magicBoxUzyte ?? 0,
                procent: wszystkie ? Math.round(((magicBoxUzyte ?? 0) / wszystkie) * 100) : 0,
            },
            topWojewodztwa,
        });

    } catch (err) {
        console.error('Admin stats error:', err);
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }
}
