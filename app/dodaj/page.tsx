'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { CheckCircle, ShoppingBag, ArrowDownToLine, ImagePlus, Sparkles, Lightbulb, X, Globe, ChevronDown, Mic, MicOff, Calendar, Keyboard, MapPin, Plane } from 'lucide-react';
import { sanitizeText } from '@/lib/security';

const KATEGORIE_Z_BDO = [
    { nazwa: "Folia bezbarwna (LDPE / LLDPE)", bdo: "15 01 02" },
    { nazwa: "Folia kolorowa / rolnicza", bdo: "15 01 02" },
    { nazwa: "Opakowania PET", bdo: "15 01 02" },
    { nazwa: "Tworzywa twarde (PP, PE, HDPE)", bdo: "19 12 04" },
    { nazwa: "Tworzywa techniczne (ABS, PC, PS, PA)", bdo: "19 12 04" },
    { nazwa: "Elektroodpady (WEEE) / Kable", bdo: "16 02 14" },
    { nazwa: "Makulatura (Karton / Tektura)", bdo: "15 01 01" },
    { nazwa: "Makulatura (Gazety / Mix)", bdo: "20 01 01" },
    { nazwa: "Złom stalowy i żeliwny", bdo: "19 12 02" },
    { nazwa: "Złom kolorowy (Al, Cu, inne)", bdo: "19 12 03" },
    { nazwa: "Drewno i Palety", bdo: "15 01 03" },
    { nazwa: "Inne", bdo: "" }
];

const WOJEWODZTWA = [
    "dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie",
    "łódzkie", "małopolskie", "mazowieckie", "opolskie",
    "podkarpackie", "podlaskie", "pomorskie", "śląskie",
    "świętokrzyskie", "warmińsko-mazurskie", "wielkopolskie", "zachodniopomorskie"
];

// Specjalne opcje zasięgu — wartości trafiają do pola lokalizacja
const ZASIEG_SPECJALNY = [
    { value: '__cala_polska__', label: '🌐 Cała Polska', lokalizacja: 'Cała Polska', wojewodztwo: '' },
    { value: '__zagranica__',   label: '✈️ Europa / Zagranica', lokalizacja: 'Europa / Zagranica', wojewodztwo: '' },
];

const WOJEWODZTWA_ASCII: Record<string, string> = {
    "dolnoslaskie": "dolnośląskie", "kujawsko-pomorskie": "kujawsko-pomorskie",
    "lubelskie": "lubelskie", "lubuskie": "lubuskie", "lodzkie": "łódzkie",
    "malopolskie": "małopolskie", "mazowieckie": "mazowieckie", "opolskie": "opolskie",
    "podkarpackie": "podkarpackie", "podlaskie": "podlaskie", "pomorskie": "pomorskie",
    "slaskie": "śląskie", "swietokrzyskie": "świętokrzyskie",
    "warminsko-mazurskie": "warmińsko-mazurskie", "wielkopolskie": "wielkopolskie",
    "zachodniopomorskie": "zachodniopomorskie",
};

const MIASTA_WOJEWODZTWA: Record<string, string> = {
    warszawa: "mazowieckie", krakow: "malopolskie", lodz: "lodzkie", wroclaw: "dolnoslaskie",
    poznan: "wielkopolskie", gdansk: "pomorskie", szczecin: "zachodniopomorskie", bydgoszcz: "kujawsko-pomorskie",
    lublin: "lubelskie", katowice: "slaskie", bialystok: "podlaskie", gdynia: "pomorskie",
    czestochowa: "slaskie", radom: "mazowieckie", sosnowiec: "slaskie", torun: "kujawsko-pomorskie",
    kielce: "swietokrzyskie", rzeszow: "podkarpackie", gliwice: "slaskie", zabrze: "slaskie",
    olsztyn: "warminsko-mazurskie", rybnik: "slaskie", opole: "opolskie", tychy: "slaskie",
    gorzow: "lubuskie", plock: "mazowieckie", elblag: "warminsko-mazurskie", walbrzych: "dolnoslaskie",
    wloclawek: "kujawsko-pomorskie", tarnow: "malopolskie", koszalin: "zachodniopomorskie",
    kalisz: "wielkopolskie", legnica: "dolnoslaskie", grudziadz: "kujawsko-pomorskie",
    slupsk: "pomorskie", inowroclaw: "kujawsko-pomorskie", lubin: "dolnoslaskie", suwalki: "podlaskie",
    gniezno: "wielkopolskie", mielec: "podkarpackie", elk: "warminsko-mazurskie",
};

const MIASTA_NAZWY_PL: Record<string, string> = {
    warszawa: "Warszawa", krakow: "Kraków", lodz: "Łódź", wroclaw: "Wrocław",
    poznan: "Poznań", gdansk: "Gdańsk", szczecin: "Szczecin", bydgoszcz: "Bydgoszcz",
    lublin: "Lublin", katowice: "Katowice", bialystok: "Białystok", gdynia: "Gdynia",
    czestochowa: "Częstochowa", radom: "Radom", sosnowiec: "Sosnowiec", torun: "Toruń",
    kielce: "Kielce", rzeszow: "Rzeszów", gliwice: "Gliwice", zabrze: "Zabrze",
    olsztyn: "Olsztyn", rybnik: "Rybnik", opole: "Opole", tychy: "Tychy",
    gorzow: "Gorzów", plock: "Płock", elblag: "Elbląg", walbrzych: "Wałbrzych",
    wloclawek: "Włocławek", tarnow: "Tarnów", koszalin: "Koszalin",
    kalisz: "Kalisz", legnica: "Legnica", grudziadz: "Grudziądz",
    slupsk: "Słupsk", inowroclaw: "Inowrocław", lubin: "Lubin", suwalki: "Suwałki",
    gniezno: "Gniezno", mielec: "Mielec", elk: "Ełk",
};

function norm(s: string): string {
    return s.toLowerCase()
        .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
        .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
        .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
        .replace(/Ą/g, 'a').replace(/Ć/g, 'c').replace(/Ę/g, 'e')
        .replace(/Ł/g, 'l').replace(/Ń/g, 'n').replace(/Ó/g, 'o')
        .replace(/Ś/g, 's').replace(/Ź/g, 'z').replace(/Ż/g, 'z');
}

const SLOWA_KLUCZE: { slowa: string[], kategoria: string }[] = [
    { slowa: ["folia stretch", "stretch", "agrofolia", "folia bezbarwna", "folia ldpe", "ldpe", "lldpe"], kategoria: "Folia bezbarwna (LDPE / LLDPE)" },
    { slowa: ["folia kolorowa", "folia rolnicza", "folia czarna", "folia mieszana"], kategoria: "Folia kolorowa / rolnicza" },
    { slowa: ["opakowania pet", "butelka pet", "butelki pet", "platki pet"], kategoria: "Opakowania PET" },
    { slowa: ["abs", "polistyren", "poliweglan", "poliamid", "tworzywa techniczne", "pc ", "pa ", "ps "], kategoria: "Tworzywa techniczne (ABS, PC, PS, PA)" },
    { slowa: ["hdpe", "polietylen", "pp ", "polipropylen", "kanister", "bigbag", "regranulat", "przemial", "aglomerat", "recyklat", "tworzywa twarde", "aglo"], kategoria: "Tworzywa twarde (PP, PE, HDPE)" },
    { slowa: ["kabel", "kable", "elektroodpad", "weee", "elektronika"], kategoria: "Elektroodpady (WEEE) / Kable" },
    { slowa: ["karton", "kartony", "tektura", "makulatura"], kategoria: "Makulatura (Karton / Tektura)" },
    { slowa: ["gazeta", "gazety", "papier mix"], kategoria: "Makulatura (Gazety / Mix)" },
    { slowa: ["zlom stalowy", "zlom czarny", "zeliwo", "stal "], kategoria: "Złom stalowy i żeliwny" },
    { slowa: ["miedz", "aluminium", "alu ", "puszki", "zlom kolorowy", "mosiadz"], kategoria: "Złom kolorowy (Al, Cu, inne)" },
    { slowa: ["drewno", "paleta", "palety", "europaleta"], kategoria: "Drewno i Palety" },
];

const SLOWA_SPRZEDAM = ["sprzedam", "oferuje", "oddam", "dostepne", "sprzedaz"];
const SLOWA_KUPIE = ["kupie", "szukam", "potrzebuje", "przyjme", "skupiamy", "skupiam"];

type SupplyFreq = 'jednorazowo' | 'co_tydzien' | 'co_miesiac' | 'stala_wspolpraca';
const SLOWA_CYKL: { slowa: string[], wartosc: SupplyFreq }[] = [
    { slowa: ['co tydzien', 'tygodniowo', 'weekly'], wartosc: 'co_tydzien' },
    { slowa: ['co miesiac', 'miesieczne', 'monthly', 'ton miesiecznie'], wartosc: 'co_miesiac' },
    { slowa: ['stala wspolpraca', 'dlugoterminowo', 'ciagla dostawa', 'regularnie', 'regularne odbiory', 'staly odbiorca', 'na stale'], wartosc: 'stala_wspolpraca' },
];

const formatujTelefon = (value: string) => {
    const tylkoCyfry = value.replace(/\D/g, '').substring(0, 9);
    const grupy = tylkoCyfry.match(/(\d{0,3})(\d{0,3})(\d{0,3})/);
    return !grupy ? "" : [grupy[1], grupy[2], grupy[3]].filter(Boolean).join(' ').trim();
};

function slugify(text: string): string {
    return norm(text).replace(/[^a-z0-9\s-]/g, '').trim()
        .replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 80);
}

interface ParsedData {
    telefon?: string; waga?: string; cena?: number | null;
    miejscowosc?: string; wojewodztwo?: string; material?: string;
    autoBdo?: string; title?: string; typOferty?: 'sprzedam' | 'kupie';
    website_url?: string; supplyFreq?: SupplyFreq;
}

const URL_REGEX = /(?:https?:\/\/|www\.)\S+|\S+\.(?:pl|com|eu|net|org|biz|info)\S*/gi;

function parsujTekst(tekst: string): ParsedData {
    const wynik: ParsedData = {};
    const t = norm(tekst);

    const telFmt = tekst.match(/(\+48[\s-]?)?\d{3}[\s-]\d{3}[\s-]\d{3}/);
    if (telFmt) {
        const c = telFmt[0].replace(/\D/g, '').slice(-9);
        if (c.length === 9) wynik.telefon = c.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    if (!wynik.telefon) {
        const bloki = tekst.replace(/\D/g, ' ').split(/\s+/).filter(b => b.length === 9);
        if (bloki.length > 0) wynik.telefon = bloki[0].replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    if (!wynik.telefon) {
        const m = tekst.match(/\b(\d[\s\-]?){8}\d\b/);
        if (m) {
            const c = m[0].replace(/\D/g, '').slice(-9);
            if (c.length === 9) wynik.telefon = c.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        }
    }

    const wagaMatch = tekst.match(/(\d+[\.,]?\d*)\s*(t\b|ton\b|tony\b|kg\b)/i);
    if (wagaMatch) {
        let val = parseFloat(wagaMatch[1].replace(',', '.'));
        if (wagaMatch[2].toLowerCase() === 'kg') val = val / 1000;
        wynik.waga = val.toString();
    }

    const negFrazy = ['do ustalenia', 'do negocjacji', 'negocjacja', 'do uzgodnienia', 'cena umowna', 'bez ceny'];
    if (!negFrazy.some(f => t.includes(f))) {
        const cenaMatch = tekst.match(/(\d+[\.,]?\d*)\s*(?:zł|pln|zl)/i);
        if (cenaMatch) wynik.cena = parseFloat(cenaMatch[1].replace(',', '.'));
    }

    const urlMatch = tekst.match(/(?:https?:\/\/|www\.)[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]?(?:\.[a-zA-Z]{2,6})+(?:[/?#][^\s]*)?\b/i);
    if (urlMatch) {
        let url = urlMatch[0];
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        wynik.website_url = url;
    }

    if (t.includes('cala polska') || t.includes('caly kraj') || t.includes('ogolnopolski')) {
        wynik.miejscowosc = 'Cała Polska';
        wynik.wojewodztwo = '';
    } else if (t.includes('europa') || t.includes('zagranica') || t.includes('eksport')) {
        wynik.miejscowosc = 'Europa / Zagranica';
        wynik.wojewodztwo = '';
    } else {
        for (const [asciiKey, plNazwa] of Object.entries(WOJEWODZTWA_ASCII)) {
            if (t.includes(asciiKey)) { wynik.wojewodztwo = plNazwa; break; }
        }
        for (const [miastoKey, wojKey] of Object.entries(MIASTA_WOJEWODZTWA)) {
            if (t.includes(miastoKey)) {
                wynik.miejscowosc = MIASTA_NAZWY_PL[miastoKey] || miastoKey;
                if (!wynik.wojewodztwo) wynik.wojewodztwo = WOJEWODZTWA_ASCII[wojKey] || wojKey;
                break;
            }
        }
    }

    for (const { slowa, kategoria } of SLOWA_KLUCZE) {
        if (slowa.some(s => t.includes(s))) {
            const found = KATEGORIE_Z_BDO.find(k => norm(k.nazwa).includes(norm(kategoria).split(' ')[0]));
            wynik.material = found?.nazwa || kategoria;
            if (found) wynik.autoBdo = found.bdo;
            break;
        }
    }

    if (SLOWA_KUPIE.some(s => t.includes(s))) wynik.typOferty = 'kupie';
    else if (SLOWA_SPRZEDAM.some(s => t.includes(s))) wynik.typOferty = 'sprzedam';

    for (const { slowa, wartosc } of SLOWA_CYKL) {
        if (slowa.some(s => t.includes(s))) { wynik.supplyFreq = wartosc; break; }
    }

    const ZBEDNE_TYTUL = ['sprzedam', 'kupie', 'oferuje', 'oferujemy', 'zapraszamy', 'oddam',
        'firma', 'przedsiebiorstwo', 'spolka', 'oferta', 'ogloszenie',
        'tel', 'telefon', 'kontakt', 'dzwon', 'ilosc', 'ilo', 'cena', 'cene'];
    const tekstBezUrl = tekst.replace(URL_REGEX, '').replace(/\s+/g, ' ').trim();
    const surowiecMatch = tekstBezUrl.match(
        /(regranulat|re\s*granulat|przemial|aglomerat|folia|zlom|makulatura|karton|drewno|kabel|platki|butelk|kanister|recyklat|aglo)[\s\w\-\/]{0,50}/i
    );
    if (surowiecMatch) {
        let tyt = surowiecMatch[0].replace(/[\.,!?;:]+$/, '').replace(/(?:tel\.?|telefon|kontakt|dzwon|ilo[sś][cć]?|\d{9})[^\w].*$/i, '').trim();
        const tytN = norm(tyt);
        for (const fraza of ZBEDNE_TYTUL) {
            if (tytN.includes(fraza)) tyt = tyt.replace(new RegExp('(?:^|\\s)' + fraza + '(?:\\s|$)', 'gi'), ' ');
        }
        tyt = tyt.replace(/\s+/g, ' ').trim().substring(0, 55);
        if (tyt.length > 3) wynik.title = tyt.charAt(0).toUpperCase() + tyt.slice(1);
    }
    if (!wynik.title || wynik.title.length < 4) {
        let linia = tekstBezUrl.split('\n')[0].trim();
        linia = linia.replace(/\b(?:z|ze)\s+\w+(?:a|y|i|u|ów|em)\b/gi, '');
        const liniaN = norm(linia);
        for (const fraza of ZBEDNE_TYTUL) {
            if (liniaN.includes(fraza)) linia = linia.replace(new RegExp('(?:^|\\s)' + fraza + '(?:\\s|$)', 'gi'), ' ');
        }
        linia = linia.replace(/\s+/g, ' ').trim();
        if (linia.length > 3) wynik.title = linia.charAt(0).toUpperCase() + linia.slice(1).substring(0, 55);
    }

    return wynik;
}

function czyiOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// Zwraca wartość selectu dla aktualnych stanów lokalizacja/województwo
function getSelectValue(miejscowosc: string, wojewodztwo: string): string {
    if (miejscowosc === 'Cała Polska') return '__cala_polska__';
    if (miejscowosc === 'Europa / Zagranica') return '__zagranica__';
    return wojewodztwo;
}

export default function DodajOferteKrok1() {
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [typOferty, setTypOferty] = useState<'sprzedam' | 'kupie'>('sprzedam');
    const [title, setTitle] = useState('');
    const [material, setMaterial] = useState('');
    const [waga, setWaga] = useState('');
    const [miejscowosc, setMiejscowosc] = useState('');
    const [wojewodztwo, setWojewodztwo] = useState('');
    const [telefon, setTelefon] = useState('');
    const [autoBdo, setAutoBdo] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hp, setHp] = useState('');
    const [magicTekst, setMagicTekst] = useState('');
    const [magicOtwarte, setMagicOtwarte] = useState(false);
    const [podswietlone, setPodswietlone] = useState<Set<string>>(new Set());
    const [seoOpis, setSeoOpis] = useState('');
    const [seoWygenerowane, setSeoWygenerowane] = useState(false);
    const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
    const [supplyFreq, setSupplyFreq] = useState<SupplyFreq>('jednorazowo');
    const [nasluchuje, setNasluchuje] = useState(false);
    const [wspieraMikrofon, setWspieraMikrofon] = useState(false);
    const [jestIOS, setJestIOS] = useState(false);

    const zdjecieRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Czy wybrana opcja to zasięg ogólny (ukrywa pole miejscowości)
    const jestZasiegOgolny = miejscowosc === 'Cała Polska' || miejscowosc === 'Europa / Zagranica';

    useEffect(() => {
        setIsCheckingAuth(false);
        const ios = czyiOS();
        setJestIOS(ios);
        if (!ios && typeof window !== 'undefined') {
            setWspieraMikrofon('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
        }
    }, []);

    const startMikrofon = () => {
        if (!wspieraMikrofon || jestIOS) return;
        if (nasluchuje && recognitionRef.current) { recognitionRef.current.stop(); setNasluchuje(false); return; }
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRec) return;
        const recognition = new SpeechRec();
        recognition.lang = 'pl-PL'; recognition.continuous = false; recognition.interimResults = false; recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;
        recognition.onstart = () => setNasluchuje(true);
        recognition.onresult = (e: any) => { const tekst = e.results[0]?.[0]?.transcript || ''; if (tekst) setMagicTekst(prev => prev ? prev + ' ' + tekst : tekst); };
        recognition.onend = () => setNasluchuje(false);
        recognition.onerror = (e: any) => { setNasluchuje(false); if (e.error === 'not-allowed') alert('Zezwól na dostęp do mikrofonu.'); };
        try { recognition.start(); } catch { setNasluchuje(false); }
    };

    const handleHeroClick = () => { setMagicOtwarte(true); if (!jestIOS) startMikrofon(); };

    // Obsługa zmiany selekta lokalizacji
    const handleLokalizacjaChange = (val: string) => {
        const specjalna = ZASIEG_SPECJALNY.find(z => z.value === val);
        if (specjalna) {
            setMiejscowosc(specjalna.lokalizacja);
            setWojewodztwo(specjalna.wojewodztwo);
        } else {
            // Wybrano województwo — czyść zasięg ogólny z miejscowości jeśli był
            if (jestZasiegOgolny) setMiejscowosc('');
            setWojewodztwo(val);
        }
        setPodswietlone(p => { const n = new Set(p); n.delete('wojewodztwo'); return n; });
    };

    const handleAnalizuj = () => {
        if (!magicTekst.trim()) return;
        const parsed = parsujTekst(magicTekst);
        const nowePodswietlone = new Set<string>();

        const zastap = (pole: string, nowaWartosc: string, obecnaWartosc: string, setter: (v: string) => void) => {
            if (!nowaWartosc) return;
            if (obecnaWartosc && obecnaWartosc !== nowaWartosc) {
                if (!confirm(`Pole "${pole}" ma już wartość "${obecnaWartosc}". Zastąpić?`)) return;
            }
            setter(nowaWartosc);
        };

        if (parsed.telefon) zastap('Telefon', parsed.telefon, telefon, setTelefon); else nowePodswietlone.add('telefon');
        if (parsed.waga) zastap('Waga', parsed.waga, waga, setWaga); else nowePodswietlone.add('waga');
        if (parsed.miejscowosc) zastap('Miejscowość', parsed.miejscowosc, miejscowosc, setMiejscowosc); else nowePodswietlone.add('miejscowosc');
        if (parsed.wojewodztwo) zastap('Województwo', parsed.wojewodztwo, wojewodztwo, setWojewodztwo); else nowePodswietlone.add('wojewodztwo');
        if (parsed.material) {
            zastap('Kategoria', parsed.material, material, setMaterial);
            const found = KATEGORIE_Z_BDO.find(k => k.nazwa === parsed.material);
            if (found) setAutoBdo(found.bdo);
        } else nowePodswietlone.add('material');
        if (parsed.title) zastap('Tytuł', parsed.title, title, setTitle); else nowePodswietlone.add('title');
        if (parsed.typOferty) setTypOferty(parsed.typOferty);
        if (parsed.supplyFreq) setSupplyFreq(parsed.supplyFreq);
        if (parsed.cena) localStorage.setItem('magic_cena', String(parsed.cena));
        if (parsed.website_url) localStorage.setItem('magic_website_url', parsed.website_url);
        setPodswietlone(nowePodswietlone);

        const nowyTytul = parsed.title || title;
        const nowyMaterial = parsed.material || material;
        const nowaLok = [parsed.miejscowosc || miejscowosc, parsed.wojewodztwo || wojewodztwo].filter(Boolean).join(', ');
        const opis = [nowyTytul || nowyMaterial, nowyMaterial && nowyMaterial !== nowyTytul ? `Kategoria: ${nowyMaterial}` : '', (parsed.waga || waga) ? `Waga: ${parsed.waga || waga} ton` : '', nowaLok ? `Lokalizacja: ${nowaLok}` : ''].filter(Boolean).join('\n');
        setSeoOpis(opis);
        localStorage.setItem('magic_opis', opis);
        const slugBase = [nowyTytul || nowyMaterial, parsed.miejscowosc || miejscowosc].filter(Boolean).join(' ');
        if (slugBase) localStorage.setItem('magic_slug', slugify(slugBase));
        setSeoWygenerowane(true);
    };

    const getFieldClass = (pole: string, base = '') =>
        podswietlone.has(pole) ? `${base} border-yellow-400 bg-yellow-50` : `${base} bg-slate-50 border-slate-200`;

    const uploadImage = async (fileToUpload: File) => {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1080, useWebWorker: true };
        const compressedFile = await imageCompression(fileToUpload, options);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.png`;
        await supabase.storage.from('oferty-zdjecia').upload(fileName, compressedFile);
        const { data } = supabase.storage.from('oferty-zdjecia').getPublicUrl(fileName);
        return data.publicUrl;
    };

    const handleDalej = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hp !== '') { router.push('/rynek'); return; }
        setLoading(true);
        try {
            let uploadedImageUrl = '';
            if (file) uploadedImageUrl = await uploadImage(file);
            const step1Data = {
                typ_oferty: typOferty,
                title: sanitizeText(title),
                material: sanitizeText(material),
                waga: parseFloat(waga) || 0,
                lokalizacja: sanitizeText(miejscowosc),
                wojewodztwo: sanitizeText(wojewodztwo),
                telefon: sanitizeText(telefon),
                zdjecie_url: uploadedImageUrl,
                bdo_code: autoBdo,
                magic_box_used: seoWygenerowane,
                supply_frequency: supplyFreq,
            };
            localStorage.setItem('temp_offer', JSON.stringify(step1Data));
            router.push('/dodaj/parametry');
        } catch (err: any) {
            alert(err.message);
            setLoading(false);
        }
    };

    if (isCheckingAuth) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
            <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border-4 border-white">

                <div style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1 }}>
                    <input type="text" value={hp} onChange={e => setHp(e.target.value)} tabIndex={-1} autoComplete="off" />
                </div>

                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">Dodaj Ofertę</h1>
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">Krok 1</span>
                            <p className="text-sm font-extrabold text-slate-500 uppercase tracking-tight">Informacje podstawowe</p>
                        </div>
                    </div>
                    <Link href="/rynek" className="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 p-3 rounded-2xl transition-all font-black text-[10px] uppercase">Anuluj</Link>
                </div>

                {/* HERO */}
                {!magicOtwarte && (
                    <button type="button" onClick={handleHeroClick}
                        className="w-full mb-6 group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl">
                        <div className="absolute -right-6 -top-6 w-36 h-36 rounded-full bg-red-500/20 animate-ping" />
                        <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full bg-red-500/30" />
                        <div className="relative flex items-center gap-5">
                            <div className="shrink-0 w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center shadow-xl">
                                {jestIOS ? <Keyboard size={30} className="text-white" strokeWidth={2} /> : <Mic size={32} className="text-white" strokeWidth={2.5} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-1">✦ Nowość — AI asystent</p>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight leading-tight mb-1">
                                    {jestIOS ? 'Dyktuj przez klawiaturę' : 'Wystaw ofertę głosem'}
                                </h2>
                                <p className="text-slate-300 text-xs font-medium leading-relaxed">
                                    {jestIOS ? 'Kliknij → dotknij pola tekstowego → naciśnij 🎤 na klawiaturze → dyktuj.' : 'Kliknij, powiedz co masz, miasto i telefon — AI wypełni resztę.'}
                                </p>
                            </div>
                            <div className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                            </div>
                        </div>
                        <p className="relative mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">lub wklej tekst z Facebooka / WhatsApp</p>
                    </button>
                )}

                {/* MAGIC BOX */}
                {magicOtwarte && (
                    <div className="border-2 border-blue-400 rounded-[28px] overflow-hidden shadow-lg mb-6">
                        <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white"><Sparkles size={16} /><span className="font-black text-xs uppercase tracking-widest">Magic Box — AI</span></div>
                            <div className="flex items-center gap-2">
                                {wspieraMikrofon && !jestIOS && (
                                    <button type="button" onClick={startMikrofon}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${nasluchuje ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                                        {nasluchuje ? <MicOff size={13} /> : <Mic size={13} />}
                                        <span className="hidden sm:inline">{nasluchuje ? 'Słucham...' : 'Dyktuj'}</span>
                                    </button>
                                )}
                                <button type="button" onClick={() => { setMagicOtwarte(false); setNasluchuje(false); recognitionRef.current?.stop(); }} className="text-blue-200 hover:text-white ml-1"><X size={18} /></button>
                            </div>
                        </div>
                        <div className="p-4 bg-white">
                            {nasluchuje && (
                                <div className="flex items-center gap-2 mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                                    <span className="text-red-600 text-xs font-black uppercase tracking-widest">Słucham... powiedz co masz, miasto i telefon</span>
                                </div>
                            )}
                            {jestIOS && (
                                <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
                                    <span className="text-2xl shrink-0">🎤</span>
                                    <div>
                                        <p className="text-blue-800 text-xs font-black uppercase tracking-widest mb-1">Dyktowanie na iPhone</p>
                                        <p className="text-blue-700 text-[12px] font-medium leading-relaxed"><strong>1.</strong> Dotknij pola poniżej<br /><strong>2.</strong> Naciśnij ikonę 🎤 na klawiaturze<br /><strong>3.</strong> Dyktuj po polsku</p>
                                    </div>
                                </div>
                            )}
                            <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-[20px] font-medium text-slate-700 min-h-[110px] resize-none outline-none focus:border-blue-400 transition-colors text-sm placeholder:text-slate-400"
                                placeholder={jestIOS ? 'Dotknij tutaj → naciśnij 🎤 na klawiaturze i dyktuj...' : 'Wpisz lub powiedz: Sprzedam 24 tony PP czarny, Łódź, tel. 676 787 678'}
                                value={magicTekst} onChange={e => setMagicTekst(e.target.value)} lang="pl" autoCorrect="on" autoCapitalize="sentences" />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {[
                                    { label: 'Sprzedam...', tekst: 'Sprzedam 24 tony regranulatu PP czarny, cena 2500 zł/t, tel. 600 700 800, śląskie.' },
                                    { label: 'Kupię...', tekst: 'Kupię folię LDPE, ok. 5 ton/miesiąc. Tel. 500 100 200, Mazowieckie.' },
                                    { label: 'Oddam...', tekst: 'Oddam za darmo strzepy foliowe, odbiór własny. Tel. 400 300 200. Kraków.' },
                                ].map((s, i) => (
                                    <button key={i} type="button" onClick={() => setMagicTekst(s.tekst)}
                                        className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-full transition-all active:scale-95">{s.label}</button>
                                ))}
                            </div>
                            <button type="button" onClick={handleAnalizuj} disabled={!magicTekst.trim()}
                                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-3 rounded-[18px] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95">
                                <Sparkles size={16} /> Analizuj i wypełnij pola
                            </button>
                            {seoWygenerowane && (
                                <div className="mt-4 border-2 border-emerald-400 rounded-[20px] overflow-hidden">
                                    <div className="bg-emerald-50 px-4 py-2 flex items-center gap-2 border-b border-emerald-200">
                                        <Sparkles size={14} className="text-emerald-600" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Opis SEO wygenerowany</span>
                                    </div>
                                    <textarea className="w-full p-4 bg-white text-slate-700 font-medium text-sm min-h-[100px] resize-none outline-none" value={seoOpis} onChange={e => setSeoOpis(e.target.value)} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <form onSubmit={handleDalej} className="space-y-6">
                    {/* TYP OFERTY */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-100 p-2 rounded-[28px]">
                        <button type="button" onClick={() => setTypOferty('sprzedam')}
                            className={`py-4 rounded-[20px] text-sm font-black uppercase flex items-center justify-center gap-3 transition-all ${typOferty === 'sprzedam' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                            <ShoppingBag size={20} /> Sprzedam
                        </button>
                        <button type="button" onClick={() => setTypOferty('kupie')}
                            className={`py-4 rounded-[20px] text-sm font-black uppercase flex items-center justify-center gap-3 transition-all ${typOferty === 'kupie' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                            <ArrowDownToLine size={20} /> Kupię
                        </button>
                    </div>

                    {/* TYTUŁ */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 flex items-center gap-2">
                            Tytuł ogłoszenia <span className="text-red-500">*</span>
                            {podswietlone.has('title') && (
                                <span className="relative flex items-center">
                                    <button type="button" onMouseEnter={() => setTooltipVisible('title')} onMouseLeave={() => setTooltipVisible(null)} className="text-yellow-500"><Lightbulb size={14} /></button>
                                    {tooltipVisible === 'title' && <span className="absolute left-5 top-0 z-50 w-52 bg-slate-900 text-white text-[10px] font-bold p-2.5 rounded-xl shadow-xl">Uzupełnij tytuł — ogłoszenia z tytułem mają 2x większą oglądalność!</span>}
                                </span>
                            )}
                        </label>
                        <input required type="text" placeholder="np. Regranulat LDPE jasny"
                            className={`w-full p-5 border-2 rounded-[24px] font-bold focus:border-blue-500 outline-none transition-colors ${getFieldClass('title')}`}
                            value={title} onChange={e => { setTitle(e.target.value); setPodswietlone(p => { const n = new Set(p); n.delete('title'); return n; }); }} />
                    </div>

                    {/* KATEGORIA */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 block">Kategoria surowca <span className="text-red-500">*</span></label>
                        <select required className={`w-full p-5 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors ${getFieldClass('material')}`}
                            value={material}
                            onChange={e => {
                                setMaterial(e.target.value);
                                const found = KATEGORIE_Z_BDO.find(k => k.nazwa === e.target.value);
                                if (found) setAutoBdo(found.bdo);
                                setPodswietlone(p => { const n = new Set(p); n.delete('material'); return n; });
                            }}>
                            <option value="">Wybierz kategorię...</option>
                            {KATEGORIE_Z_BDO.map(k => <option key={k.nazwa} value={k.nazwa}>{k.nazwa}</option>)}
                        </select>
                    </div>

                    {/* WAGA I TELEFON */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 block">Waga (tony)</label>
                            <input type="number" placeholder="np. 24"
                                className={`w-full p-5 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors ${getFieldClass('waga')}`}
                                value={waga} onChange={e => { setWaga(e.target.value); setPodswietlone(p => { const n = new Set(p); n.delete('waga'); return n; }); }} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 block">Telefon <span className="text-red-500">*</span></label>
                            <input required type="tel" placeholder="000 000 000"
                                className={`w-full p-5 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors ${getFieldClass('telefon')}`}
                                value={telefon} onChange={e => { setTelefon(formatujTelefon(e.target.value)); setPodswietlone(p => { const n = new Set(p); n.delete('telefon'); return n; }); }} />
                        </div>
                    </div>

                    {/* LOKALIZACJA — jeden select z zasięgiem + województwami */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 flex items-center gap-2">
                            <Globe size={11} /> Zasięg / Województwo <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            className={`w-full p-5 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors ${getFieldClass('wojewodztwo')}`}
                            value={getSelectValue(miejscowosc, wojewodztwo)}
                            onChange={e => handleLokalizacjaChange(e.target.value)}
                        >
                            <option value="">Wybierz zasięg lub województwo...</option>
                            {/* Specjalne opcje zasięgu */}
                            <optgroup label="── Zasięg ogólny ──">
                                {ZASIEG_SPECJALNY.map(z => (
                                    <option key={z.value} value={z.value}>{z.label}</option>
                                ))}
                            </optgroup>
                            {/* Województwa */}
                            <optgroup label="── Województwa ──">
                                {WOJEWODZTWA.map(w => (
                                    <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>
                                ))}
                            </optgroup>
                        </select>

                        {/* Wizualna informacja o wybranym zasięgu ogólnym */}
                        {jestZasiegOgolny && (
                            <div className={`mt-2 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold ${miejscowosc === 'Europa / Zagranica' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                {miejscowosc === 'Europa / Zagranica' ? <Plane size={14} /> : <Globe size={14} />}
                                Ogłoszenie widoczne dla: <strong>{miejscowosc}</strong>
                            </div>
                        )}
                    </div>

                    {/* MIEJSCOWOŚĆ — ukryta gdy wybrany zasięg ogólny */}
                    {!jestZasiegOgolny && (
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 flex items-center gap-2">
                                <MapPin size={11} /> Miejscowość
                            </label>
                            <input
                                type="text"
                                placeholder="np. Toruń, Bydgoszcz..."
                                className={`w-full p-5 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors ${getFieldClass('miejscowosc')}`}
                                value={miejscowosc}
                                onChange={e => { setMiejscowosc(e.target.value); setPodswietlone(p => { const n = new Set(p); n.delete('miejscowosc'); return n; }); }}
                            />
                            <p className="text-[10px] text-slate-400 font-bold ml-5 mt-1">Opcjonalne — pomaga kupującym z sąsiedztwa</p>
                        </div>
                    )}

                    {/* CZĘSTOTLIWOŚĆ */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-2 flex items-center gap-2">
                            <Calendar size={12} /> Częstotliwość sprzedaży
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {([
                                { v: 'jednorazowo', label: 'Jednorazowo', icon: '1×' },
                                { v: 'co_tydzien', label: 'Co tydzień', icon: '7d' },
                                { v: 'co_miesiac', label: 'Co miesiąc', icon: '30d' },
                                { v: 'stala_wspolpraca', label: 'Stała współpraca', icon: '∞' },
                            ] as const).map(opt => (
                                <button key={opt.v} type="button" onClick={() => setSupplyFreq(opt.v)}
                                    className={`flex items-center gap-2 p-3 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${supplyFreq === opt.v ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black ${supplyFreq === opt.v ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>{opt.icon}</span>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ZDJĘCIE */}
                    <div ref={zdjecieRef} onClick={() => document.getElementById('fileInput')?.click()}
                        className="border-4 border-dashed rounded-[40px] p-10 text-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                        <input type="file" id="fileInput" className="hidden" accept="image/*" onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
                        }} />
                        {preview ? (
                            <div className="relative inline-block">
                                <img src={preview} className="h-40 mx-auto rounded-2xl shadow-lg" alt="Podgląd" />
                                <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full"><CheckCircle size={16} /></div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <ImagePlus size={40} className="text-slate-300" />
                                <p className="font-black text-slate-400 uppercase text-sm">Kliknij, aby dodać zdjęcie</p>
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full bg-slate-900 text-white py-8 rounded-[32px] font-black text-2xl uppercase flex items-center justify-center gap-4 hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 mt-4">
                        {loading ? 'Przetwarzanie...' : 'Dalej do parametrów'}
                        <CheckCircle size={28} />
                    </button>
                </form>
            </div>
        </div>
    );
}
