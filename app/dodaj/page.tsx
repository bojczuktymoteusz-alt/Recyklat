'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { CheckCircle, ShoppingBag, ArrowDownToLine, ImagePlus, Sparkles, Lightbulb, X } from 'lucide-react';
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

// Baza miast -> województwo
const MIASTA_WOJEWODZTWA: Record<string, string> = {
    warszawa: "mazowieckie", kraków: "małopolskie", łódź: "łódzkie", wrocław: "dolnośląskie",
    poznań: "wielkopolskie", gdańsk: "pomorskie", szczecin: "zachodniopomorskie", bydgoszcz: "kujawsko-pomorskie",
    lublin: "lubelskie", katowice: "śląskie", białystok: "podlaskie", gdynia: "pomorskie",
    częstochowa: "śląskie", radom: "mazowieckie", sosnowiec: "śląskie", toruń: "kujawsko-pomorskie",
    kielce: "świętokrzyskie", rzeszów: "podkarpackie", gliwice: "śląskie", zabrze: "śląskie",
    olsztyn: "warmińsko-mazurskie", bielsko: "śląskie", bytom: "śląskie", zielona: "lubuskie",
    rybnik: "śląskie", ruda: "śląskie", opole: "opolskie", tychy: "śląskie",
    gorzów: "lubuskie", dąbrowa: "śląskie", płock: "mazowieckie", elbląg: "warmińsko-mazurskie",
    wałbrzych: "dolnośląskie", włocławek: "kujawsko-pomorskie", tarnów: "małopolskie", chorzów: "śląskie",
    koszalin: "zachodniopomorskie", kalisz: "wielkopolskie", legnica: "dolnośląskie", grudziądz: "kujawsko-pomorskie",
    słupsk: "pomorskie", jaworzno: "śląskie", jastrzębie: "śląskie", nowy: "małopolskie",
    siedlce: "mazowieckie", mysłowice: "śląskie", konin: "wielkopolskie", piotrków: "łódzkie",
    inowrocław: "kujawsko-pomorskie", lubin: "dolnośląskie", ostrów: "wielkopolskie", suwałki: "podlaskie",
    gniezno: "wielkopolskie", ostrowiec: "świętokrzyskie", siemianowice: "śląskie", stargard: "zachodniopomorskie",
    głogów: "dolnośląskie", pabianice: "łódzkie", wodzisław: "śląskie", zgierz: "łódzkie",
    mielec: "podkarpackie", ełk: "warmińsko-mazurskie", żory: "śląskie", tarnowskie: "śląskie",
    // Dodatkowe miasta
    kutno: "łódzkie", łęczyca: "łódzkie", skierniewice: "łódzkie", sieradz: "łódzkie",
    zduńska: "łódzkie", bełchatów: "łódzkie", tomaszów: "łódzkie", radomsko: "łódzkie",
    włoszczowa: "świętokrzyskie", jędrziejów: "świętokrzyskie", starachowice: "świętokrzyskie",
    chełm: "lubelskie", zamość: "lubelskie", biała: "podlaskie",
    nowy: "małopolskie", gorlice: "małopolskie", oświęcim: "małopolskie",
    przemyśl: "podkarpackie", krośno: "podkarpackie", stalowa: "podkarpackie",
    elbląg: "warmińsko-mazurskie", giżycko: "warmińsko-mazurskie",
    kościerzyna: "pomorskie", starogard: "pomorskie", tczew: "pomorskie",
    leszno: "wielkopolskie", piła: "wielkopolskie", ostrów: "wielkopolskie",
    zgorzelec: "dolnośląskie", bolestławiec: "dolnośląskie", jelenia: "dolnośląskie",
    szczecinek: "zachodniopomorskie", kołobrzeg: "zachodniopomorskie",
    międzyrzecz: "lubuskie", nowa: "lubuskie",
    nysa: "opolskie", krapkowice: "opolskie",
    grudziądz: "kujawsko-pomorskie", włocławek: "kujawsko-pomorskie", świę: "kujawsko-pomorskie",
};

// Słownik słów kluczowych -> kategoria
const SLOWA_KLUCZE: { slowa: string[], kategoria: string }[] = [
    { slowa: ["ldpe", "lldpe", "folia bezbarwna", "folia czysta"], kategoria: "Folia bezbarwna (LDPE / LLDPE)" },
    { slowa: ["folia kolorowa", "folia rolnicza", "folia czarna", "folia zielona", "agrofolia"], kategoria: "Folia kolorowa / rolnicza" },
    { slowa: ["pet", "butelka", "butelki", "płatka", "płatki pet"], kategoria: "Opakowania PET" },
    { slowa: ["hdpe", "pp", "pe ", "tworzywa twarde", "kanister", "skrzynka"], kategoria: "Tworzywa twarde (PP, PE, HDPE)" },
    { slowa: ["abs", "pc ", "ps ", "pa ", "tworzywa techniczne", "polipropyl"], kategoria: "Tworzywa techniczne (ABS, PC, PS, PA)" },
    { slowa: ["kabel", "elektroodpad", "weee", "elektronika", "złom elektroniczny"], kategoria: "Elektroodpady (WEEE) / Kable" },
    { slowa: ["karton", "tektura", "makulatura", "opakowania papier"], kategoria: "Makulatura (Karton / Tektura)" },
    { slowa: ["gazeta", "papier mix", "makulatura mix"], kategoria: "Makulatura (Gazety / Mix)" },
    { slowa: ["złom stalowy", "żeliwo", "stal", "żeliwny", "złom czarny"], kategoria: "Złom stalowy i żeliwny" },
    { slowa: ["miedź", "aluminium", "złom kolorowy", "al ", "cu ", "mosiądz", "cynk"], kategoria: "Złom kolorowy (Al, Cu, inne)" },
    { slowa: ["drewno", "paleta", "palety", "europaleta"], kategoria: "Drewno i Palety" },
    { slowa: ["wapno", "kreda", "nawóz", "nawozowe", "regranulat"], kategoria: "Inne" },
];

const formatujTelefon = (value: string) => {
    const tylkoCyfry = value.replace(/\D/g, '').substring(0, 9);
    const grupy = tylkoCyfry.match(/(\d{0,3})(\d{0,3})(\d{0,3})/);
    return !grupy ? "" : [grupy[1], grupy[2], grupy[3]].filter(Boolean).join(' ').trim();
};

// ============================================================
// SEO GENERATOR
// ============================================================

function slugify(text: string): string {
    // Mapa WSZYSTKICH polskich znaków (wielkie i małe) -> odpowiedniki ASCII
    const mapa: Record<string, string> = {
        // Małe
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        // Wielkie (zamieniane przed toLowerCase, więc obsługujemy również wejścia z wielkich liter)
        'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l', 'Ń': 'n', 'Ó': 'o', 'Ś': 's', 'Ź': 'z', 'Ż': 'z',
    };
    return text
        // 1. Podmień polskie znaki PRZED toLowerCase (inaczej wielkie gubią się)
        .split('')
        .map(c => mapa[c] ?? c)
        .join('')
        // 2. Zamień na małe litery
        .toLowerCase()
        // 3. Zamień &, /, \, (, ), +, % i inne znaki specjalne na spacje
        .replace(/[&\/\\#,+()$~%.'";:*?<>{}@!^|`=\[\]]/g, ' ')
        // 4. Zostaw tylko a-z, 0-9, spacje i myślniki
        .replace(/[^a-z0-9\s-]/g, '')
        // 5. Przytnij białe znaki z brzegów
        .trim()
        // 6. Zamień spacje na myślniki
        .replace(/\s+/g, '-')
        // 7. Usuń podwojone myślniki
        .replace(/-+/g, '-')
        // 8. Usuń myślniki na początku i końcu
        .replace(/^-+|-+$/g, '')
        // 9. Ogranicz długość
        .substring(0, 80);
}

function generateSEODescription(data: {
    typOferty: string;
    title?: string;
    material?: string;
    waga?: string;
    lokalizacja?: string;
    wojewodztwo?: string;
    telefon?: string;
    cena?: string;
}): string {
    const typ = data.typOferty === 'kupie' ? 'Kupię' : 'Sprzedam';
    const surowiec = data.material || data.title || 'surowiec wtórny';
    const miejsce = [data.lokalizacja, data.wojewodztwo ? `woj. ${data.wojewodztwo}` : ''].filter(Boolean).join(', ');

    const linie: string[] = [];

    linie.push(`${typ}: ${data.title || surowiec}${miejsce ? ` — ${miejsce}` : ''}`);
    linie.push('');
    linie.push('Parametry oferty:');
    if (data.waga) linie.push(`• Dostępna ilość: ${data.waga} ton`);
    if (data.cena) linie.push(`• Cena: ${data.cena} zł/t netto`);
    if (miejsce) linie.push(`• Lokalizacja: ${miejsce}`);
    if (data.telefon) linie.push(`• Kontakt: ${data.telefon}`);
    linie.push('');
    linie.push(`Zapraszamy do zapoznania się z ofertą na surowiec ${surowiec}. Zapewniamy profesjonalną obsługę i wysoką jakość towaru. Oferujemy surowce wtórne w atrakcyjnych cenach netto. Działamy w branży recyklingu i gospodarki odpadami.`);
    linie.push('');
    linie.push('Slowa kluczowe: recykling, surowce wtórne, odpady, cena netto, ' + surowiec.toLowerCase());

    return linie.join('\n');
}

// ============================================================
// PARSER MAGIC BOX
// ============================================================
interface ParsedData {
    telefon?: string;
    waga?: string;
    cena?: string;
    lokalizacja?: string;
    wojewodztwo?: string;
    material?: string;
    autoBdo?: string;
    title?: string;
}

function parsujTekst(tekst: string): ParsedData {
    const wynik: ParsedData = {};
    const t = tekst.toLowerCase();

    // --- TELEFON: 9 cyfr, opcjonalnie z odstępami/myślnikami ---
    const telMatch = tekst.match(/(\+48\s?)?(\d[\s\-]?){8}\d/);
    if (telMatch) {
        const cyfry = telMatch[0].replace(/\D/g, '').slice(-9);
        if (cyfry.length === 9) {
            wynik.telefon = cyfry.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        }
    }

    // --- WAGA: liczba + jednostka t/ton/kg ---
    const wagaMatch = tekst.match(/(\d+[\.,]?\d*)\s*(t\b|ton\b|tony\b|kg\b)/i);
    if (wagaMatch) {
        let val = parseFloat(wagaMatch[1].replace(',', '.'));
        if (wagaMatch[2].toLowerCase() === 'kg') val = val / 1000;
        wynik.waga = val.toString();
    }

    // --- CENA: liczba + zł ---
    const cenaMatch = tekst.match(/(\d+[\.,]?\d*)\s*(zł|pln|zl)/i);
    if (cenaMatch) {
        wynik['cena' as keyof ParsedData] = parseFloat(cenaMatch[1].replace(',', '.')) as any;
    }

    // --- KOD BDO: 6 cyfr ---
    const bdoMatch = tekst.match(/\b(15|16|17|18|19|20)\s?\d{2}\s?\d{2}\b/);
    if (bdoMatch) {
        wynik.autoBdo = bdoMatch[0].replace(/\s/g, ' ').trim();
    }

    // --- WOJEWÓDZTWO wprost z tekstu ("woj. łódzkie", "województwo śląskie", "okolice X") ---
    const LISTA_WOJEW = [
        "dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie",
        "łódzkie", "małopolskie", "mazowieckie", "opolskie",
        "podkarpackie", "podlaskie", "pomorskie", "śląskie",
        "świętokrzyskie", "warmińsko-mazurskie", "wielkopolskie", "zachodniopomorskie"
    ];
    for (const woj of LISTA_WOJEW) {
        if (t.includes(woj)) {
            wynik.wojewodztwo = woj;
            break;
        }
    }

    // --- MIASTO ---
    for (const [miasto, woj] of Object.entries(MIASTA_WOJEWODZTWA)) {
        if (t.includes(miasto)) {
            wynik.lokalizacja = miasto.charAt(0).toUpperCase() + miasto.slice(1);
            // Ustaw województwo tylko jeśli nie wykryto go wcześniej bezpośrednio z tekstu
            if (!wynik.wojewodztwo) wynik.wojewodztwo = woj;
            break;
        }
    }

    // --- KATEGORIA ---
    for (const { slowa, kategoria } of SLOWA_KLUCZE) {
        if (slowa.some(s => t.includes(s))) {
            wynik.material = kategoria;
            const found = KATEGORIE_Z_BDO.find(k => k.nazwa === kategoria);
            if (found && !wynik.autoBdo) wynik.autoBdo = found.bdo;
            break;
        }
    }

    // --- TYTUŁ: pierwsza linia tekstu (max 60 znaków) ---
    const pierwszaLinia = tekst.split('\n')[0].trim().substring(0, 60);
    if (pierwszaLinia.length > 5) wynik.title = pierwszaLinia;

    return wynik;
}

export default function DodajOferteKrok1() {
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [typOferty, setTypOferty] = useState<'sprzedam' | 'kupie'>('sprzedam');
    const [title, setTitle] = useState('');
    const [material, setMaterial] = useState('');
    const [waga, setWaga] = useState('');
    const [lokalizacja, setLokalizacja] = useState('');
    const [wojewodztwo, setWojewodztwo] = useState('');
    const [telefon, setTelefon] = useState('');
    const [autoBdo, setAutoBdo] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hp, setHp] = useState("");

    // Magic Box
    const [magicTekst, setMagicTekst] = useState('');
    const [magicOtwarte, setMagicOtwarte] = useState(false);
    const [podswietlone, setPodswietlone] = useState<Set<string>>(new Set());
    const [seoOpis, setSeoOpis] = useState('');
    const [seoSlug, setSeoSlug] = useState('');
    const [seoWygenerowane, setSeoWygenerowane] = useState(false);

    useEffect(() => { setIsCheckingAuth(false); }, []);

    const handleAnalizuj = () => {
        if (!magicTekst.trim()) return;

        const parsed = parsujTekst(magicTekst);
        const nowePodswietlone = new Set<string>();

        const zastap = (pole: string, nowaWartosc: string, obecnaWartosc: string, setter: (v: string) => void) => {
            if (!nowaWartosc) return;
            if (obecnaWartosc && obecnaWartosc !== nowaWartosc) {
                if (!confirm(`Pole "${pole}" zawiera już wartość "${obecnaWartosc}". Zastąpić wartością z tekstu: "${nowaWartosc}"?`)) return;
            }
            setter(nowaWartosc);
        };

        if (parsed.telefon) zastap('Telefon', parsed.telefon, telefon, setTelefon);
        else nowePodswietlone.add('telefon');

        if (parsed.waga) zastap('Waga', parsed.waga, waga, setWaga);
        else nowePodswietlone.add('waga');

        if (parsed.lokalizacja) zastap('Miejscowość', parsed.lokalizacja, lokalizacja, setLokalizacja);
        else nowePodswietlone.add('lokalizacja');

        if (parsed.wojewodztwo) zastap('Województwo', parsed.wojewodztwo, wojewodztwo, setWojewodztwo);
        else nowePodswietlone.add('wojewodztwo');

        if (parsed.material) {
            zastap('Kategoria', parsed.material, material, setMaterial);
            const found = KATEGORIE_Z_BDO.find(k => k.nazwa === parsed.material);
            if (found) setAutoBdo(found.bdo);
        } else {
            nowePodswietlone.add('material');
        }

        if (parsed.title) zastap('Tytuł', parsed.title, title, setTitle);
        else nowePodswietlone.add('title');

        setPodswietlone(nowePodswietlone);

        // Zapisz cenę do localStorage żeby parametry.tsx mogły ją odebrać
        if (parsed.cena) {
            localStorage.setItem('magic_cena', String(parsed.cena));
        }

        // --- GENERUJ SEO ---
        const nowyTytul = parsed.title || title;
        const nowyMaterial = parsed.material || material;
        const nowaLokalizacja = parsed.lokalizacja || lokalizacja;
        const noweWojewodztwo = parsed.wojewodztwo || wojewodztwo;

        const opis = generateSEODescription({
            typOferty,
            title: nowyTytul,
            material: nowyMaterial,
            waga: parsed.waga || waga,
            lokalizacja: nowaLokalizacja,
            wojewodztwo: noweWojewodztwo,
            telefon: parsed.telefon || telefon,
            cena: parsed.cena,
        });
        setSeoOpis(opis);
        localStorage.setItem('magic_opis', opis);

        const slugBase = [nowyTytul || nowyMaterial, nowaLokalizacja].filter(Boolean).join(' ');
        if (slugBase) {
            const wygenerowanySlug = slugify(slugBase);
            setSeoSlug(wygenerowanySlug);
            localStorage.setItem('magic_slug', wygenerowanySlug);
        }

        setSeoWygenerowane(true);
    };

    const getFieldClass = (pole: string, base = '') => {
        if (podswietlone.has(pole)) {
            return `${base} border-yellow-400 bg-yellow-50`;
        }
        return `${base} bg-slate-50 border-slate-200`;
    };

    const uploadImage = async (fileToUpload: File) => {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1080, useWebWorker: true };
        try {
            const compressedFile = await imageCompression(fileToUpload, options);
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.png`;
            await supabase.storage.from('oferty-zdjecia').upload(fileName, compressedFile);
            const { data } = supabase.storage.from('oferty-zdjecia').getPublicUrl(fileName);
            return data.publicUrl;
        } catch (error) { throw error; }
    };

    const handleDalej = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hp !== "") { router.push('/rynek'); return; }
        setLoading(true);
        try {
            let uploadedImageUrl = '';
            if (file) uploadedImageUrl = await uploadImage(file);
            const step1Data = {
                typ_oferty: typOferty,
                title: sanitizeText(title),
                material: sanitizeText(material),
                waga: parseFloat(waga) || 0,
                lokalizacja: sanitizeText(lokalizacja),
                wojewodztwo: sanitizeText(wojewodztwo),
                telefon: sanitizeText(telefon),
                zdjecie_url: uploadedImageUrl,
                bdo_code: autoBdo
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

                {/* Honeypot */}
                <div style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1 }}>
                    <input type="text" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" />
                </div>

                {/* NAGŁÓWEK */}
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

                {/* ===================== MAGIC BOX ===================== */}
                <div className="mb-8">
                    {!magicOtwarte ? (
                        <button
                            type="button"
                            onClick={() => setMagicOtwarte(true)}
                            className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-600 py-4 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all group"
                        >
                            <Sparkles size={18} className="group-hover:animate-spin" />
                            Wklej tekst z ogłoszenia — wypełnię pola automatycznie
                        </button>
                    ) : (
                        <div className="border-2 border-blue-400 rounded-[28px] overflow-hidden shadow-lg">
                            <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-white">
                                    <Sparkles size={16} />
                                    <span className="font-black text-xs uppercase tracking-widest">Magic Box — Wklej tekst ogłoszenia</span>
                                </div>
                                <button type="button" onClick={() => setMagicOtwarte(false)} className="text-blue-200 hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-4 bg-white">
                                <textarea
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-[20px] font-medium text-slate-700 min-h-[120px] resize-none outline-none focus:border-blue-400 transition-colors text-sm placeholder:text-slate-400"
                                    placeholder={"Wklej tutaj tekst z Facebooka, WhatsApp lub maila...\n\nNp: Sprzedam folię LDPE, ok. 5 ton, cena 800 zł/t, odbiór własny. Tel: 600 123 456. Lokalizacja: Radom."}
                                    value={magicTekst}
                                    onChange={(e) => setMagicTekst(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={handleAnalizuj}
                                    disabled={!magicTekst.trim()}
                                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-3 rounded-[18px] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Sparkles size={16} /> Analizuj i wypełnij pola
                                </button>

                                {/* WYNIKI SEO */}
                                {seoWygenerowane && (
                                    <div className="mt-4 space-y-3">
                                        {/* OPIS SEO */}
                                        <div className="border-2 border-emerald-400 rounded-[20px] overflow-hidden">
                                            <div className="bg-emerald-50 px-4 py-2 flex items-center gap-2 border-b border-emerald-200">
                                                <Sparkles size={14} className="text-emerald-600" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Wygenerowaliśmy opis zoptymalizowany pod Google</span>
                                            </div>
                                            <textarea
                                                className="w-full p-4 bg-white text-slate-700 font-medium text-sm min-h-[180px] resize-none outline-none focus:bg-emerald-50 transition-colors"
                                                value={seoOpis}
                                                onChange={(e) => setSeoOpis(e.target.value)}
                                            />
                                        </div>

                                        {/* Slug zapisany w tle do localStorage — pokazujemy po dodaniu */}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {/* =================== KONIEC MAGIC BOX =================== */}

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
                            {podswietlone.has('title') && <span className="flex items-center gap-1 text-yellow-600 text-[9px]"><Lightbulb size={11} />Uzupełnij, aby zwiększyć zasięg</span>}
                        </label>
                        <input required type="text" placeholder="np. Regranulat LDPE jasny"
                            className={`w-full p-5 border-2 rounded-[24px] font-bold focus:border-blue-500 outline-none transition-colors ${getFieldClass('title')}`}
                            value={title} onChange={(e) => { setTitle(e.target.value); setPodswietlone(p => { const n = new Set(p); n.delete('title'); return n; }); }}
                        />
                    </div>

                    {/* KATEGORIA */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 flex items-center gap-2">
                            Kategoria surowca <span className="text-red-500">*</span>
                            {podswietlone.has('material') && <span className="flex items-center gap-1 text-yellow-600 text-[9px]"><Lightbulb size={11} />Uzupełnij, aby zwiększyć zasięg</span>}
                        </label>
                        <select required
                            className={`w-full p-5 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors ${getFieldClass('material')}`}
                            value={material}
                            onChange={(e) => {
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
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 flex items-center gap-2">
                                Waga (tony)
                                {podswietlone.has('waga') && <span className="flex items-center gap-1 text-yellow-600 text-[9px]"><Lightbulb size={11} />Uzupełnij</span>}
                            </label>
                            <input type="number" placeholder="np. 24"
                                className={`w-full p-5 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors ${getFieldClass('waga')}`}
                                value={waga}
                                onChange={(e) => { setWaga(e.target.value); setPodswietlone(p => { const n = new Set(p); n.delete('waga'); return n; }); }}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 flex items-center gap-2">
                                Telefon <span className="text-red-500">*</span>
                                {podswietlone.has('telefon') && <span className="flex items-center gap-1 text-yellow-600 text-[9px]"><Lightbulb size={11} />Uzupełnij</span>}
                            </label>
                            <input required type="tel" placeholder="000 000 000"
                                className={`w-full p-5 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors ${getFieldClass('telefon')}`}
                                value={telefon}
                                onChange={(e) => { setTelefon(formatujTelefon(e.target.value)); setPodswietlone(p => { const n = new Set(p); n.delete('telefon'); return n; }); }}
                            />
                        </div>
                    </div>

                    {/* WOJEWÓDZTWO I LOKALIZACJA */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 flex items-center gap-2">
                                Województwo <span className="text-red-500">*</span>
                                {podswietlone.has('wojewodztwo') && <span className="flex items-center gap-1 text-yellow-600 text-[9px]"><Lightbulb size={11} />Uzupełnij</span>}
                            </label>
                            <select required
                                className={`w-full p-5 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors ${getFieldClass('wojewodztwo')}`}
                                value={wojewodztwo}
                                onChange={(e) => { setWojewodztwo(e.target.value); setPodswietlone(p => { const n = new Set(p); n.delete('wojewodztwo'); return n; }); }}>
                                <option value="">Wybierz...</option>
                                {WOJEWODZTWA.map(w => <option key={w} value={w}>{w}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 flex items-center gap-2">
                                Miejscowość
                                {podswietlone.has('lokalizacja') && <span className="flex items-center gap-1 text-yellow-600 text-[9px]"><Lightbulb size={11} />Uzupełnij</span>}
                            </label>
                            <input type="text" placeholder="np. Warszawa"
                                className={`w-full p-5 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors ${getFieldClass('lokalizacja')}`}
                                value={lokalizacja}
                                onChange={(e) => { setLokalizacja(e.target.value); setPodswietlone(p => { const n = new Set(p); n.delete('lokalizacja'); return n; }); }}
                            />
                        </div>
                    </div>

                    {/* ZDJĘCIE */}
                    <div onClick={() => document.getElementById('fileInput')?.click()}
                        className="border-4 border-dashed rounded-[40px] p-10 text-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors mt-4">
                        <input type="file" id="fileInput" className="hidden" accept="image/*" onChange={(e) => {
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

                    {/* PRZYCISK */}
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
