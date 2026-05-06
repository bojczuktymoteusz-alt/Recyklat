'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft, MapPin, Phone, Info, Truck, Building2,
    Clock, Mail, CheckCircle, FileText, Eye, ExternalLink,
    ChevronRight, Fuel, Calculator, Send, Globe, Navigation
} from 'lucide-react';
import Link from 'next/link';
import { wyglądaJakUrl, fixUrl, urlDoWyswietlenia } from '@/lib/ofertaUtils';

const SPALANIE = 33;
const CENA_ON_DOMYSLNA = 6.5;

function obliczKosztPaliwa(dystansKm: number, cenaPaliwa: number) {
    return Math.round((dystansKm / 100) * SPALANIE * cenaPaliwa);
}

function KalkulatorTransportu({ oferta }: { oferta: any }) {
    const [mojaMiejscowosc, setMojaMiejscowosc] = useState('');
    const [dystans, setDystans] = useState<number | null>(null);
    const [ladowanie, setLadowanie] = useState(false);
    const [pokazReczny, setPokazReczny] = useState(false);
    const [dystansRecznyInput, setDystansRecznyInput] = useState('');
    const [leadWyslany, setLeadWyslany] = useState(false);
    const [leadLadowanie, setLeadLadowanie] = useState(false);

    const cenaPaliwa = parseFloat(process.env.NEXT_PUBLIC_CENA_ON || '') || CENA_ON_DOMYSLNA;
    const kosztPaliwa = dystans !== null ? obliczKosztPaliwa(dystans, cenaPaliwa) : null;
    const lokalizacjaTowaru = [oferta.lokalizacja, oferta.wojewodztwo].filter(Boolean).join(', ');

    const handleOblicz = async () => {
        if (!mojaMiejscowosc.trim()) return;
        setLadowanie(true); setDystans(null); setPokazReczny(false); setDystansRecznyInput('');
        try {
            const res = await fetch(`/api/distance?from=${encodeURIComponent(mojaMiejscowosc)}&to=${encodeURIComponent(lokalizacjaTowaru)}`);
            if (res.ok) { const d = await res.json(); setDystans(d.dystansKm); }
            else setPokazReczny(true);
        } catch { setPokazReczny(true); }
        setLadowanie(false);
    };

    const zatwierdDystans = () => {
        const km = parseFloat(dystansRecznyInput);
        if (!isNaN(km) && km > 0) setDystans(km);
    };

    const handleLead = async () => {
        setLeadLadowanie(true);
        try {
            await fetch('/api/transport-lead', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ofertaId: oferta.id, tytul: oferta.title || oferta.material, lokalizacja: oferta.lokalizacja, wojewodztwo: oferta.wojewodztwo, dystansKm: dystans, kosztPaliwa, cenaPaliwa, waga: oferta.waga }),
            });
        } catch { }
        setLeadLadowanie(false); setLeadWyslany(true);
    };

    return (
        <div className="bg-white p-8 rounded-[40px] border shadow-sm border-l-8 border-l-emerald-500">
            <h3 className="font-black text-gray-500 mb-1 flex items-center gap-2 text-xs uppercase tracking-widest">
                <Truck size={14} className="text-emerald-500" /> Kalkulator transportu
            </h3>
            <p className="text-slate-400 text-[11px] font-bold mb-5">
                Szacunkowy koszt paliwa dla TIR-a ({SPALANIE} l/100km · ON {cenaPaliwa} zł/l)
            </p>
            <div className="bg-slate-50 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
                <MapPin size={14} className="text-blue-500 shrink-0" />
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Towar jest w</p>
                    <p className="font-black text-slate-900 text-sm">{lokalizacjaTowaru || 'Lokalizacja nieznana'}</p>
                </div>
            </div>
            <div className="flex gap-2 mb-3">
                <input type="text" placeholder="Twoja miejscowość, np. Gdańsk"
                    value={mojaMiejscowosc} onChange={e => setMojaMiejscowosc(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleOblicz()}
                    className="flex-1 p-4 bg-slate-50 border-2 border-slate-200 focus:border-emerald-400 rounded-2xl outline-none font-bold text-slate-900 text-sm" />
                <button onClick={handleOblicz} disabled={!mojaMiejscowosc.trim() || ladowanie}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5">
                    <Calculator size={14} /><span className="hidden sm:inline">Oblicz</span>
                </button>
            </div>
            {pokazReczny && (
                <div className="mb-3">
                    <p className="text-slate-500 text-xs font-bold mb-2">Podaj przybliżony dystans ręcznie (km):</p>
                    <div className="flex gap-2">
                        <input type="number" placeholder="np. 317" value={dystansRecznyInput}
                            onChange={e => setDystansRecznyInput(e.target.value)}
                            onBlur={zatwierdDystans} onKeyDown={e => e.key === 'Enter' && zatwierdDystans()}
                            className="flex-1 p-3 bg-slate-50 border-2 border-slate-200 focus:border-emerald-400 rounded-xl outline-none font-bold text-slate-900 text-sm" />
                        <button onClick={zatwierdDystans} disabled={!dystansRecznyInput}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5">
                            <Calculator size={14} /> Przelicz
                        </button>
                    </div>
                </div>
            )}
            {ladowanie && <div className="text-center py-4 text-slate-400 text-sm font-bold animate-pulse">Obliczam dystans...</div>}
            {dystans !== null && kosztPaliwa !== null && (
                <div className="mt-4 space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Fuel size={10} /> Szacunkowy koszt paliwa
                        </p>
                        <p className="text-4xl font-black text-emerald-700 tracking-tighter">{kosztPaliwa.toLocaleString('pl-PL')} zł</p>
                        <p className="text-emerald-600 text-[11px] font-bold mt-1">Dystans: ~{Math.round(dystans)} km · {SPALANIE} l/100km · {cenaPaliwa} zł/l</p>
                        <p className="text-slate-400 text-[10px] font-bold mt-2">* Tylko koszt paliwa — bez wynagrodzenia kierowcy, amortyzacji i opłat drogowych.</p>
                    </div>
                    {leadWyslany ? (
                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                            <CheckCircle size={20} className="text-blue-600 shrink-0" />
                            <div>
                                <p className="font-black text-blue-900 text-sm">Zapytanie wysłane!</p>
                                <p className="text-blue-600 text-[11px] font-bold">Skontaktujemy się z propozycją transportu.</p>
                            </div>
                        </div>
                    ) : (
                        <button onClick={handleLead} disabled={leadLadowanie}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                            <Send size={16} />{leadLadowanie ? 'Wysyłam...' : 'Chcę wycenę transportu'}
                        </button>
                    )}
                    <p className="text-slate-400 text-[10px] text-center font-bold">Wyślemy Ci propozycję przewoźnika dla tej trasy</p>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// GEOLOKALIZACJA + ODLEGŁOŚĆ PO LINII PROSTEJ
// ─────────────────────────────────────────────────────────────────────────────
const COORDS: Record<string, [number, number]> = {
    'mazowieckie': [52.1, 21.0], 'śląskie': [50.3, 18.9], 'małopolskie': [50.0, 20.1],
    'wielkopolskie': [52.4, 17.0], 'dolnośląskie': [51.1, 17.0], 'łódzkie': [51.8, 19.5],
    'pomorskie': [54.2, 18.6], 'kujawsko-pomorskie': [53.1, 18.3], 'lubelskie': [51.2, 22.6],
    'podkarpackie': [50.0, 22.0], 'zachodniopomorskie': [53.4, 15.0], 'warmińsko-mazurskie': [53.8, 20.5],
    'podlaskie': [53.1, 23.2], 'opolskie': [50.7, 17.9], 'lubuskie': [52.0, 15.5],
    'świętokrzyskie': [50.9, 20.6],
    'warszawa': [52.23, 21.01], 'kraków': [50.06, 19.94], 'łódź': [51.77, 19.46],
    'wrocław': [51.11, 17.04], 'poznań': [52.41, 16.93], 'gdańsk': [54.35, 18.65],
    'szczecin': [53.43, 14.55], 'bydgoszcz': [53.12, 18.01], 'lublin': [51.25, 22.57],
    'katowice': [50.26, 19.02], 'białystok': [53.13, 23.16], 'gdynia': [54.52, 18.53],
    'częstochowa': [50.81, 19.12], 'radom': [51.40, 21.15], 'sosnowiec': [50.29, 19.13],
    'toruń': [53.01, 18.60], 'kielce': [50.87, 20.63], 'rzeszów': [50.04, 22.00],
    'gliwice': [50.29, 18.67], 'zabrze': [50.32, 18.78], 'olsztyn': [53.78, 20.49],
    'opole': [50.67, 17.93], 'tychy': [50.13, 18.99], 'gorzów': [52.73, 15.23],
    'płock': [52.55, 19.71], 'elbląg': [54.16, 19.40], 'wałbrzych': [50.78, 16.28],
    'tarnów': [50.01, 20.99], 'koszalin': [54.19, 16.17], 'kalisz': [51.76, 18.08],
    'legnica': [51.21, 16.16], 'stalowa wola': [50.58, 22.05], 'mielec': [50.29, 21.43],
    'suwałki': [54.10, 22.93], 'gniezno': [52.53, 17.60], 'tuszynek': [51.65, 19.70],
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function znajdzCoords(lokalizacja?: string, wojewodztwo?: string): [number, number] | null {
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (lokalizacja) {
        const kl = norm(lokalizacja);
        const hit = Object.entries(COORDS).find(([k]) => kl.includes(k) || k.includes(kl.split(' ')[0]));
        if (hit) return hit[1];
    }
    if (wojewodztwo) {
        const kw = norm(wojewodztwo);
        const hit = Object.entries(COORDS).find(([k]) => kw.startsWith(k.split(' ')[0]) || k.startsWith(kw.split(' ')[0]));
        if (hit) return hit[1];
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODUŁ PODOBNYCH OGŁOSZEŃ
// ─────────────────────────────────────────────────────────────────────────────
interface PodobnaOferta {
    id: number; title?: string; material: string; waga: number; cena: number;
    lokalizacja: string; wojewodztwo?: string; zdjecie_url?: string; typ_oferty?: string; telefon?: string;
}

type Priorytet = 'tenSamTelefon' | 'kategoria' | 'inne';

const NAGLOWEK: Record<Priorytet, string> = {
    tenSamTelefon: 'Więcej od tego wystawcy',
    kategoria:     'Podobne ogłoszenia',
    inne:          'Może Cię zainteresować',
};

// ── KLUCZOWA POPRAWKA: typ_oferty filtrowany we wszystkich priorytetach ──────
async function pobierzPodobne(oferta: any): Promise<{ oferty: PodobnaOferta[]; priorytet: Priorytet }> {
    const typOferty = oferta.typ_oferty || 'sprzedam';

    // P1: ten sam telefon + ten sam typ (sprzedam→sprzedam, kupie→kupie)
    if (oferta.telefon) {
        const { data } = await supabase
            .from('oferty')
            .select('id, title, material, waga, cena, lokalizacja, wojewodztwo, zdjecie_url, typ_oferty, telefon')
            .neq('id', oferta.id)
            .eq('status', 'aktywna')
            .eq('telefon', oferta.telefon)
            .eq('typ_oferty', typOferty)
            .limit(4);
        if (data && data.length > 0) return { oferty: data, priorytet: 'tenSamTelefon' };
    }

    // P2: ta sama kategoria materiału + TEN SAM TYP — sprzedam tylko ze sprzedam, kupie tylko z kupie
    const katSlowo = (oferta.material || '').split(/[\s(]/)[0].toLowerCase();
    if (katSlowo.length >= 3) {
        const { data } = await supabase
            .from('oferty')
            .select('id, title, material, waga, cena, lokalizacja, wojewodztwo, zdjecie_url, typ_oferty, telefon')
            .neq('id', oferta.id)
            .eq('status', 'aktywna')
            .eq('typ_oferty', typOferty)          // ← filtr typu zawsze aktywny
            .ilike('material', `%${katSlowo}%`)
            .limit(4);
        if (data && data.length > 0) return { oferty: data, priorytet: 'kategoria' };
    }

    // P3: awaryjne — najczęściej oglądane, bez filtra typu (mieszane — pełni rolę "odkryj coś nowego")
    const { data } = await supabase
        .from('oferty')
        .select('id, title, material, waga, cena, lokalizacja, wojewodztwo, zdjecie_url, typ_oferty, telefon')
        .neq('id', oferta.id)
        .eq('status', 'aktywna')
        .order('wyswietlenia', { ascending: false, nullsFirst: false })
        .limit(4);

    return { oferty: data || [], priorytet: 'inne' };
}

function getIcon(material: string): string {
    const m = material.toLowerCase();
    if (m.includes('folia')) return '🧻';
    if (m.includes('tworzywa') || m.includes('pet')) return '♻️';
    if (m.includes('makulatura') || m.includes('karton')) return '📄';
    if (m.includes('złom')) return '🔩';
    if (m.includes('drewno')) return '🪵';
    return '📦';
}

function KafelekPodobnej({ o, userLat, userLon }: { o: PodobnaOferta; userLat: number | null; userLon: number | null }) {
    const tytul = o.title || o.material;
    const cena = o.cena > 0 ? `${o.cena} zł/t` : 'Negocj.';
    const lokStr = [o.lokalizacja, o.wojewodztwo].filter(Boolean).join(', ') || 'Polska';
    const isOgolnopolska = (o.lokalizacja || '').toLowerCase().includes('polska');
    const placeholder = o.typ_oferty === 'kupie' ? '/placeholder-kupie.jpg' : '/placeholder-sprzedam.jpg';

    const odleglosc: string | null = (() => {
        if (userLat === null || userLon === null) return null;
        const coords = znajdzCoords(o.lokalizacja, o.wojewodztwo);
        if (!coords) return null;
        const km = haversineKm(userLat, userLon, coords[0], coords[1]);
        const zaokr = km < 20 ? km : km < 100 ? Math.round(km / 5) * 5 : Math.round(km / 10) * 10;
        return `~${zaokr} km`;
    })();

    return (
        <Link href={`/rynek/${o.id}`}
            className="group bg-white rounded-[24px] ring-1 ring-slate-100 shadow-sm hover:shadow-lg hover:ring-blue-100 transition-all overflow-hidden flex flex-col active:scale-[0.97]">
            <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
                <img src={o.zdjecie_url || placeholder} alt={tytul} loading="lazy"
                    onError={e => { const img = e.currentTarget; if (!img.src.includes('/placeholder-')) img.src = placeholder; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow ${o.typ_oferty === 'kupie' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {o.typ_oferty === 'kupie' ? 'Kupię' : 'Sprzedam'}
                    </span>
                </div>
                {odleglosc && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/95 backdrop-blur px-2 py-1 rounded-lg shadow text-[9px] font-black text-blue-600">
                        <Navigation size={8} />{odleglosc}
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-1.5 py-1 rounded-lg text-base shadow">
                    {getIcon(o.material)}
                </div>
            </div>
            <div className="p-3 flex flex-col flex-1">
                <p className="font-black text-slate-900 text-xs uppercase leading-tight line-clamp-2 mb-1.5 group-hover:text-blue-600 transition-colors">{tytul}</p>
                <div className="flex items-center gap-1 text-slate-400 text-[9px] font-bold uppercase mb-2">
                    {isOgolnopolska
                        ? <><Globe size={9} className="text-blue-500" /><span className="text-blue-500">Cały kraj</span></>
                        : <><MapPin size={9} className="text-blue-500" /><span className="truncate">{lokStr}</span></>
                    }
                </div>
                <div className="mt-auto flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">{cena}</span>
                    {o.waga > 0 && <span className="font-black text-blue-600 text-xs">{o.waga} t</span>}
                </div>
            </div>
        </Link>
    );
}

function PodobneOgloszenia({ oferta }: { oferta: any }) {
    const [oferty, setOferty] = useState<PodobnaOferta[]>([]);
    const [priorytet, setPriorytet] = useState<Priorytet>('kategoria');
    const [loading, setLoading] = useState(true);
    const [userLat, setUserLat] = useState<number | null>(null);
    const [userLon, setUserLon] = useState<number | null>(null);

    useEffect(() => {
        if (!oferta?.id) return;
        pobierzPodobne(oferta).then(({ oferty: o, priorytet: p }) => {
            setOferty(o); setPriorytet(p); setLoading(false);
        });
    }, [oferta?.id]);

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            pos => { setUserLat(pos.coords.latitude); setUserLon(pos.coords.longitude); },
            () => { },
            { timeout: 5000, maximumAge: 300_000 }
        );
    }, []);

    if (loading) return (
        <div className="mt-12 animate-pulse">
            <div className="h-4 w-44 bg-slate-200 rounded-xl mb-4" />
            <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-slate-100 rounded-[24px] h-40" />)}
            </div>
        </div>
    );

    if (oferty.length === 0) return null;

    return (
        <div className="mt-12">
            <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-slate-200" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5">
                    {priorytet === 'tenSamTelefon' && <Building2 size={11} />}
                    {NAGLOWEK[priorytet]}
                </p>
                <div className="flex-1 h-px bg-slate-200" />
            </div>
            {userLat !== null && (
                <p className="text-[9px] font-bold text-slate-400 text-right mb-2 flex items-center justify-end gap-1">
                    <Navigation size={9} className="text-blue-400" />
                    Odległości liczone od Twojej lokalizacji (w linii prostej)
                </p>
            )}
            <div className="grid grid-cols-2 gap-3">
                {oferty.map(o => (
                    <KafelekPodobnej key={o.id} o={o} userLat={userLat} userLon={userLon} />
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// KOMPONENT GŁÓWNY
// ─────────────────────────────────────────────────────────────────────────────
export default function SzczegolyOferty() {
    const { id } = useParams();
    const router = useRouter();
    const [oferta, setOferta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [czyToMoje, setCzyToMoje] = useState(false);
    const [numerOdkryty, setNumerOdkryty] = useState(false);

    const logClick = (ofertaId: number) => {
        fetch('/api/log-click', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ofertaId, type: 'phone_click', userType: 'gosc' }),
        }).catch(() => { });
    };

    const handlePokaz = (ofertaId: number) => { setNumerOdkryty(true); logClick(ofertaId); };

    const maskujNumer = (tel: string) => {
        if (!tel) return '';
        const c = tel.replace(/\D/g, '');
        return c.length >= 9 ? c.slice(0, 3) + ' ' + c.slice(3, 6) + ' ***' : tel.slice(0, -3) + '***';
    };

    const formatujNumer = (tel: string) => {
        const c = tel.replace(/\D/g, '');
        return c.length === 9 ? c.slice(0, 3) + ' ' + c.slice(3, 6) + ' ' + c.slice(6) : tel;
    };

    useEffect(() => {
        const handleViews = async () => {
            if (!id) return;
            const key = `viewed_${id}`;
            if (!sessionStorage.getItem(key)) {
                try {
                    const { error } = await supabase.rpc('increment_views', { row_id: Number(id) });
                    if (!error) sessionStorage.setItem(key, 'true');
                } catch { }
            }
        };
        handleViews();
    }, [id]);

    useEffect(() => {
        async function fetchOferta() {
            if (!id) return;
            const { data, error } = await supabase
                .from('oferty')
                .select('id, title, material, waga, cena, lokalizacja, wojewodztwo, telefon, email, zdjecie_url, created_at, status, typ_oferty, bdo_code, impurity, form, certificates, logistics, pickup_hours, opis, firma, website_url, wyswietlenia, category, material_type, color, param_mfi')
                .eq('id', id).single();
            if (error) { router.push('/rynek'); return; }
            if (data) {
                setOferta(data);
                const ids = JSON.parse(localStorage.getItem('moje_oferty') || '[]');
                if (ids.includes(Number(id))) setCzyToMoje(true);
            }
            setLoading(false);
        }
        fetchOferta();
    }, [id, router]);

    const getImpurityLabel = (val: any) => {
        if (val === null || val === undefined) return 'Brak danych';
        const v = Number(val);
        if (v === 0) return '0% (Idealny)';
        if (v === 2) return 'Do 2% (Bardzo czysty)';
        if (v === 5) return 'Do 5% (Czysty)';
        if (v === 10) return 'Do 10% (Lekko zabrudzony)';
        if (v === 20) return 'Powyżej 10% (Zabrudzony)';
        if (v === 99) return 'Nie potrafię ocenić';
        return v + '%';
    };

    const getToken = (id: number) => {
        try { return JSON.parse(localStorage.getItem('oferty_tokeny') || '{}')[id] || null; }
        catch { return null; }
    };

    const usunOferte = async () => {
        const token = getToken(Number(id));
        if (!token) { alert('Brak tokenu.'); return; }
        if (!confirm('Czy na pewno chcesz TRWALE usunąć tę ofertę?')) return;
        const { data, error } = await supabase.rpc('delete_oferta_with_token', { oferta_id: Number(id), token });
        if (error || !data) { alert('Błąd lub nieprawidłowy token.'); return; }
        try {
            const tm = JSON.parse(localStorage.getItem('oferty_tokeny') || '{}');
            delete tm[Number(id)];
            localStorage.setItem('oferty_tokeny', JSON.stringify(tm));
            const ids = JSON.parse(localStorage.getItem('moje_oferty') || '[]');
            localStorage.setItem('moje_oferty', JSON.stringify(ids.filter((x: number) => x !== Number(id))));
        } catch { }
        router.push('/rynek');
    };

    const oznaczJakoZakonczone = async () => {
        const token = getToken(Number(id));
        if (!token) { alert('Brak tokenu.'); return; }
        if (!confirm('Oznaczyć jako sprzedane?')) return;
        const { data, error } = await supabase.rpc('update_oferta_status_with_token', { oferta_id: Number(id), token, new_status: 'sprzedane' });
        if (error || !data) { alert('Błąd lub nieprawidłowy token.'); return; }
        setOferta({ ...oferta, status: 'sprzedane' });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin text-4xl">♻️</div></div>;
    if (!oferta) return <div className="p-10 text-center font-black uppercase">Nie znaleziono oferty.</div>;

    const jestSprzedane = oferta.status === 'sprzedane';
    const wyswietlanyTytul = oferta.title || oferta.material;
    const jestZapotrzebowanie = oferta.typ_oferty === 'kupie';

    const materialBez = (mat: string) => mat.replace(/\s*\(\d{2}\s?\d{2}\s?\d{2}\)\s*/g, '').trim();
    const extractBdo = (mat: string) => mat.match(/\b(\d{2}\s?\d{2}\s?\d{2})\b/)?.[1]?.trim() || null;
    const wyswietlaneBdo = oferta.bdo_code || extractBdo(oferta.material || '');
    const czystyMaterial = materialBez(oferta.material || '');
    const n = (s: string) => (s || '').toLowerCase().trim();
    const pokazForm = oferta.form && oferta.form !== 'Inne' && n(oferta.form) !== n(czystyMaterial);
    const pokazCategory = oferta.category && oferta.category !== 'Inne' &&
        n(oferta.category) !== n(czystyMaterial) && n(oferta.category) !== n(oferta.form);

    const maStrone = wyglądaJakUrl(oferta.website_url);
    const pelnyUrl = maStrone ? fixUrl(oferta.website_url) : '';
    const urlSkrocony = maStrone ? urlDoWyswietlenia(oferta.website_url) : '';
    const maFirme = !!oferta.firma || maStrone;
    const nazwaWyswietlana = oferta.firma || urlSkrocony.split('/')[0];

    const ab  = jestZapotrzebowanie ? 'bg-blue-600' : 'bg-slate-900';
    const ah  = jestZapotrzebowanie ? 'hover:bg-blue-700' : 'hover:bg-slate-800';
    const abr = jestZapotrzebowanie ? 'bg-blue-600' : 'bg-emerald-600';
    const ahr = jestZapotrzebowanie ? 'hover:bg-blue-700' : 'hover:bg-emerald-700';
    const lokalizacjaWyswietlana = [oferta.lokalizacja, oferta.wojewodztwo].filter(Boolean).join(', ') || 'Polska';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
            <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-bold uppercase text-xs tracking-widest">
                        <ArrowLeft size={18} /><span>Powrót</span>
                    </button>
                    <div className="flex items-center gap-4">
                        {czyToMoje && (
                            <>
                                {!jestSprzedane && <button onClick={oznaczJakoZakonczone} className="text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">Zakończ ofertę</button>}
                                <button onClick={usunOferte} className="text-red-500 border border-red-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">Usuń</button>
                            </>
                        )}
                        <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded">
                            <span className="text-[10px] text-gray-400 font-black uppercase">ID: #{oferta.id}</span>
                            {czyToMoje && <span className="text-[10px] text-blue-600 font-black flex items-center gap-1 border-l pl-2 border-gray-200 uppercase"><Eye size={12} /> {oferta.wyswietlenia || 0}</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 w-full pb-36">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="aspect-square bg-white rounded-[40px] overflow-hidden border shadow-sm">
                            <img src={oferta.zdjecie_url || (jestZapotrzebowanie ? '/placeholder-kupie.jpg' : '/placeholder-sprzedam.jpg')}
                                alt={wyswietlanyTytul || 'Oferta'}
                                onError={e => { const img = e.currentTarget; if (!img.src.includes('/placeholder-')) img.src = jestZapotrzebowanie ? '/placeholder-kupie.jpg' : '/placeholder-sprzedam.jpg'; }}
                                className={`w-full h-full object-contain p-8 ${jestSprzedane ? 'grayscale opacity-40' : ''}`}
                            />
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border shadow-sm border-l-8 border-l-blue-600">
                            <h3 className="font-black text-gray-500 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest"><Building2 size={14} /> Wystawca</h3>
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white font-black text-xl ${maFirme ? 'bg-blue-600' : 'bg-slate-700'}`}>
                                    {maFirme ? (oferta.firma ? oferta.firma[0].toUpperCase() : <Building2 size={24} />) : '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    {maFirme
                                        ? maStrone
                                            ? <a href={pelnyUrl} target="_blank" rel="noopener noreferrer" className="text-xl font-black text-blue-600 uppercase tracking-tighter hover:underline inline-flex items-center gap-1.5 leading-tight">{nazwaWyswietlana}<ExternalLink size={14} className="shrink-0" /></a>
                                            : <p className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{nazwaWyswietlana}</p>
                                        : <p className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Ogłoszenie prywatne</p>
                                    }
                                    <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${maFirme ? 'text-blue-600' : 'text-slate-400'}`}>{maFirme ? 'Firma' : 'Użytkownik indywidualny'}</p>
                                    {maStrone && <a href={pelnyUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-400 hover:text-blue-500 font-bold mt-0.5 truncate block">{urlSkrocony}</a>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-6">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 leading-none">{wyswietlanyTytul}</h1>
                            <div className="flex flex-wrap gap-3 items-center pt-2">
                                <span className={`px-5 py-3 rounded-2xl text-2xl font-black ${jestZapotrzebowanie ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                    {oferta.cena > 0 ? `${oferta.cena} zł / t` : 'Cena do negocjacji'}
                                </span>
                            </div>
                            <div className="flex items-start gap-3 pt-4 border-t">
                                <MapPin size={24} className="text-blue-500 shrink-0 mt-0.5" />
                                <span className="font-black text-xl uppercase text-slate-900 leading-tight">{lokalizacjaWyswietlana}</span>
                            </div>
                        </div>

                        {!jestSprzedane && <KalkulatorTransportu oferta={oferta} />}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[40px] border shadow-sm">
                            <h3 className="font-black text-gray-500 mb-6 flex items-center gap-2 text-xs uppercase tracking-widest"><Info size={14} /> Szczegóły techniczne</h3>
                            <div className="mb-4 p-5 bg-blue-50 rounded-[24px] border border-blue-100">
                                <p className="text-[10px] uppercase font-black text-blue-500 mb-1">Rodzaj materiału</p>
                                <p className="font-black text-blue-700 text-lg uppercase">{czystyMaterial || oferta.material || 'Nieokreślony'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 rounded-[24px]">
                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Kod BDO</p>
                                    <p className="font-black text-slate-700 text-lg tracking-widest">{wyswietlaneBdo || '---'}</p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-[24px]">
                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Zanieczyszczenie</p>
                                    <p className="font-black text-slate-700 text-lg">{getImpurityLabel(oferta.impurity)}</p>
                                </div>
                            </div>
                            {pokazForm && (
                                <div className="mt-4 p-5 bg-slate-50 rounded-[24px]">
                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Postać surowca</p>
                                    <p className="font-black text-slate-700 text-lg uppercase">{oferta.form}</p>
                                </div>
                            )}
                            {(oferta.param_mfi || oferta.color || oferta.material_type || pokazCategory) && (
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    {oferta.param_mfi && <div className="p-5 bg-emerald-50 rounded-[24px] border border-emerald-100"><p className="text-[10px] uppercase font-black text-emerald-500 mb-1">MFI (g/10min)</p><p className="font-black text-emerald-700 text-lg">{oferta.param_mfi}</p></div>}
                                    {oferta.color && <div className="p-5 bg-slate-50 rounded-[24px]"><p className="text-[10px] uppercase font-black text-slate-400 mb-1">Kolor</p><p className="font-black text-slate-700 text-lg uppercase">{oferta.color}</p></div>}
                                    {oferta.material_type && <div className="p-5 bg-slate-50 rounded-[24px]"><p className="text-[10px] uppercase font-black text-slate-400 mb-1">Typ materiału</p><p className="font-black text-slate-700 text-lg uppercase">{oferta.material_type}</p></div>}
                                    {pokazCategory && <div className="p-5 bg-slate-50 rounded-[24px]"><p className="text-[10px] uppercase font-black text-slate-400 mb-1">Kategoria</p><p className="font-black text-slate-700 text-lg uppercase">{oferta.category}</p></div>}
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border shadow-sm">
                            <h3 className="font-black text-gray-500 mb-6 flex items-center gap-2 text-xs uppercase tracking-widest"><Truck size={14} /> Logistyka</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[24px]">
                                    <Truck size={20} className="text-slate-400 shrink-0" />
                                    <div><p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Transport</p><p className="text-sm font-black text-slate-700">{oferta.logistics || 'Do ustalenia'}</p></div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[24px]">
                                    <Clock size={20} className="text-slate-400 shrink-0" />
                                    <div><p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Dostępność</p><p className="text-sm font-black text-slate-700">{oferta.pickup_hours || 'Całodobowo'}</p></div>
                                </div>
                            </div>
                        </div>

                        {oferta.opis && (
                            <div className="bg-white p-8 rounded-[40px] border shadow-sm border-l-8 border-l-emerald-500">
                                <h3 className="font-black text-gray-500 mb-6 flex items-center gap-2 text-xs uppercase tracking-widest"><FileText size={14} className="text-emerald-500" /> Dodatkowe informacje</h3>
                                <div className="text-slate-700 font-medium leading-relaxed whitespace-pre-line">{oferta.opis}</div>
                            </div>
                        )}
                    </div>
                </div>

                <PodobneOgloszenia oferta={oferta} />
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-50">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    {jestSprzedane ? (
                        <div className="h-14 w-full bg-red-50 border-2 border-red-100 rounded-2xl flex items-center justify-center gap-3">
                            <CheckCircle size={20} className="text-red-500" />
                            <span className="text-red-600 font-black uppercase tracking-tight text-base">Ogłoszenie archiwalne</span>
                        </div>
                    ) : !numerOdkryty ? (
                        <div className="flex gap-2 items-stretch">
                            <button onClick={() => handlePokaz(oferta.id)}
                                className={`flex-1 ${ab} ${ah} text-white rounded-2xl active:scale-95 transition-all shadow-xl flex flex-col items-center justify-center py-3 gap-0.5`}>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-75 flex items-center gap-1"><Phone size={10} /> Dotknij, aby odkryć numer</span>
                                <span className="text-2xl font-black tracking-widest">{maskujNumer(oferta.telefon)}</span>
                            </button>
                            {oferta.email && (
                                <a href={`mailto:${oferta.email}?subject=Zapytanie o: ${wyswietlanyTytul}`}
                                    className={`w-16 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 active:scale-95 transition-all shrink-0 ${jestZapotrzebowanie ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                    <Mail size={20} /><span className="text-[9px] font-black uppercase">Mail</span>
                                </a>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-2 items-stretch">
                            <a href={`tel:${oferta.telefon}`}
                                className={`flex-1 ${abr} ${ahr} text-white rounded-2xl active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 py-4`}>
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Phone size={22} fill="white" /></div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Zadzwoń teraz</span>
                                    <span className="text-2xl font-black tracking-widest leading-tight">{formatujNumer(oferta.telefon)}</span>
                                </div>
                                <ChevronRight size={20} className="opacity-60 ml-auto" />
                            </a>
                            {oferta.email && (
                                <a href={`mailto:${oferta.email}?subject=Zapytanie o: ${wyswietlanyTytul}`}
                                    className={`w-16 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 active:scale-95 transition-all shrink-0 ${jestZapotrzebowanie ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                    <Mail size={20} /><span className="text-[9px] font-black uppercase">Mail</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
