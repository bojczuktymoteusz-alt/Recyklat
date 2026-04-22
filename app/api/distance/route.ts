import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Prosta baza odleglosci miedzy glownymi miastami Polski (w km, w linii prostej * 1.3)
// Uzywana jako fallback gdy brak klucza Google Maps
const WSPOLRZEDNE: Record<string, [number, number]> = {
    warszawa: [52.23, 21.01], krakow: [50.06, 19.94], lodz: [51.76, 19.46],
    wroclaw: [51.11, 17.04], poznan: [52.41, 16.93], gdansk: [54.35, 18.65],
    szczecin: [53.43, 14.55], bydgoszcz: [53.12, 18.00], lublin: [51.25, 22.57],
    katowice: [50.26, 19.02], bialystok: [53.13, 23.16], gdynia: [54.52, 18.53],
    czestochowa: [50.81, 19.12], radom: [51.40, 21.15], sosnowiec: [50.29, 19.10],
    torun: [53.01, 18.60], kielce: [50.87, 20.63], rzeszow: [50.04, 22.00],
    gliwice: [50.29, 18.67], zabrze: [50.32, 18.79], olsztyn: [53.78, 20.49],
    rybnik: [50.10, 18.55], opole: [50.67, 17.92], tychy: [50.13, 18.99],
    gorzow: [52.73, 15.23], plock: [52.55, 19.71], elblag: [54.16, 19.41],
    walbrzych: [50.78, 16.28], wloclawek: [52.65, 19.07], tarnow: [50.01, 20.99],
    koszalin: [54.19, 16.17], kalisz: [51.76, 18.09], legnica: [51.21, 16.16],
    grudziadz: [53.49, 18.75], slupsk: [54.46, 17.03], inowroclaw: [52.80, 18.26],
    // Wojewodztwa — przyblizony srodek
    'dolnoslaskie': [51.11, 17.04], 'kujawsko-pomorskie': [53.12, 18.00],
    'lubelskie': [51.25, 22.57], 'lubuskie': [52.73, 15.23],
    'lodzkie': [51.76, 19.46], 'malopolskie': [50.06, 19.94],
    'mazowieckie': [52.23, 21.01], 'opolskie': [50.67, 17.92],
    'podkarpackie': [50.04, 22.00], 'podlaskie': [53.13, 23.16],
    'pomorskie': [54.35, 18.65], 'slaskie': [50.26, 19.02],
    'swietokrzyskie': [50.87, 20.63], 'warminsko-mazurskie': [53.78, 20.49],
    'wielkopolskie': [52.41, 16.93], 'zachodniopomorskie': [53.43, 14.55],
};

function normalizuj(s: string): string {
    return s.toLowerCase()
        .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
        .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
        .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
        .replace(/\s+/g, ' ').trim();
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Mnoznik 1.35 — drogowy dystans vs. linia prosta
    return Math.round(R * c * 1.35);
}

function znajdzWspolrzedne(query: string): [number, number] | null {
    const q = normalizuj(query);
    // Szukaj dokladnego dopasowania
    if (WSPOLRZEDNE[q]) return WSPOLRZEDNE[q];
    // Szukaj czesciowego dopasowania
    for (const [klucz, wsp] of Object.entries(WSPOLRZEDNE)) {
        if (q.includes(klucz) || klucz.includes(q.split(',')[0].trim())) return wsp;
    }
    return null;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    if (!from || !to) {
        return NextResponse.json({ error: 'Brak parametrow from/to' }, { status: 400 });
    }

    // Proba uzycia Google Maps Distance Matrix API
    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleKey) {
        try {
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(from)}&destinations=${encodeURIComponent(to)}&mode=driving&language=pl&key=${googleKey}`;
            const res = await fetch(url);
            const data = await res.json();
            const element = data?.rows?.[0]?.elements?.[0];
            if (element?.status === 'OK') {
                const dystansKm = Math.round(element.distance.value / 1000);
                return NextResponse.json({ dystansKm, zrodlo: 'google' });
            }
        } catch (err) {
            console.error('[Distance] Google Maps error:', err);
        }
    }

    // Fallback — wlasna baza wspolrzednych
    const wsp1 = znajdzWspolrzedne(from);
    const wsp2 = znajdzWspolrzedne(to);

    if (wsp1 && wsp2) {
        const dystansKm = haversineKm(wsp1[0], wsp1[1], wsp2[0], wsp2[1]);
        return NextResponse.json({ dystansKm, zrodlo: 'szacowany' });
    }

    return NextResponse.json({ error: 'Nie mozna obliczyc dystansu' }, { status: 404 });
}
