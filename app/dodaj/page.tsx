'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { CheckCircle, ShoppingBag, ArrowDownToLine, ImagePlus, Sparkles, Lightbulb, X, Globe, ChevronDown } from 'lucide-react';
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

const MIASTA_WOJEWODZTWA: Record<string, string> = {
    warszawa: "mazowieckie", kraków: "małopolskie", łódź: "łódzkie", wrocław: "dolnośląskie",
    poznań: "wielkopolskie", gdańsk: "pomorskie", szczecin: "zachodniopomorskie", bydgoszcz: "kujawsko-pomorskie",
    lublin: "lubelskie", katowice: "śląskie", białystok: "podlaskie", gdynia: "pomorskie",
    częstochowa: "śląskie", radom: "mazowieckie", sosnowiec: "śląskie", toruń: "kujawsko-pomorskie",
    kielce: "świętokrzyskie", rzeszów: "podkarpackie", gliwice: "śląskie", zabrze: "śląskie",
    olsztyn: "warmińsko-mazurskie", rybnik: "śląskie", opole: "opolskie", tychy: "śląskie",
    gorzów: "lubuskie", płock: "mazowieckie", elbląg: "warmińsko-mazurskie", wałbrzych: "dolnośląskie",
    włocławek: "kujawsko-pomorskie", tarnów: "małopolskie", koszalin: "zachodniopomorskie",
    kalisz: "wielkopolskie", legnica: "dolnośląskie", grudziądz: "kujawsko-pomorskie",
    słupsk: "pomorskie", inowrocław: "kujawsko-pomorskie", lubin: "dolnośląskie", suwałki: "podlaskie",
    gniezno: "wielkopolskie", mielec: "podkarpackie", ełk: "warmińsko-mazurskie",
};

const SLOWA_KLUCZE: { slowa: string[], kategoria: string }[] = [
    { slowa: ["folia stretch", "stretch", "agrofolia", "folia bezbarwna", "folia ldpe", "ldpe"], kategoria: "Folia bezbarwna (LDPE / LLDPE)" },
    { slowa: ["folia kolorowa", "folia rolnicza", "folia czarna"], kategoria: "Folia kolorowa / rolnicza" },
    { slowa: ["opakowania pet", "butelka pet", "butelki pet", "płatki pet", "pet "], kategoria: "Opakowania PET" },
    { slowa: ["abs", "polistyren", "poliwęglan", "poliamid", "tworzywa techniczne"], kategoria: "Tworzywa techniczne (ABS, PC, PS, PA)" },
    { slowa: ["hdpe", "polietylen", "pp ", "polipropylen", "kanister", "bigbag", "regranulat", "przemiał", "aglomerat", "recyklat", "tworzywa twarde"], kategoria: "Tworzywa twarde (PP, PE, HDPE)" },
    { slowa: ["kabel", "kable", "elektroodpad", "weee", "elektronika"], kategoria: "Elektroodpady (WEEE) / Kable" },
    { slowa: ["karton", "kartony", "tektura", "makulatura"], kategoria: "Makulatura (Karton / Tektura)" },
    { slowa: ["gazeta", "gazety", "papier mix"], kategoria: "Makulatura (Gazety / Mix)" },
    { slowa: ["złom stalowy", "złom czarny", "żeliwo", "stal "], kategoria: "Złom stalowy i żeliwny" },
    { slowa: ["miedź", "aluminium", "alu ", "puszki", "złom kolorowy", "mosiądz"], kategoria: "Złom kolorowy (Al, Cu, inne)" },
    { slowa: ["drewno", "paleta", "palety", "europaleta"], kategoria: "Drewno i Palety" },
];

const SLOWA_SPRZEDAM = ["sprzedam", "oferuję", "oferuje", "oddam", "dostępne", "sprzedaż"];
const SLOWA_KUPIE = ["kupię", "kupie", "szukam", "potrzebuję", "przyjmę", "skupiamy"];

const formatujTelefon = (value: string) => {
    const tylkoCyfry = value.replace(/\D/g, '').substring(0, 9);
    const grupy = tylkoCyfry.match(/(\d{0,3})(\d{0,3})(\d{0,3})/);
    return !grupy ? "" : [grupy[1], grupy[2], grupy[3]].filter(Boolean).join(' ').trim();
};

function slugify(text: string): string {
    const mapa: Record<string, string> = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l', 'Ń': 'n', 'Ó': 'o', 'Ś': 's', 'Ź': 'z', 'Ż': 'z',
    };
    return text.split('').map(c => mapa[c] ?? c).join('').toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 80);
}

interface ParsedData {
    telefon?: string; waga?: string; cena?: string;
    lokalizacja?: string; wojewodztwo?: string; material?: string;
    autoBdo?: string; title?: string; typOferty?: 'sprzedam' | 'kupie';
}

function parsujTekst(tekst: string): ParsedData {
    const wynik: ParsedData = {};
    const t = tekst.toLowerCase();
    const telMatch = tekst.match(/(\+48\s?)?(\d[\s\-]?){8}\d/);
    if (telMatch) {
        const cyfry = telMatch[0].replace(/\D/g, '').slice(-9);
        if (cyfry.length === 9) wynik.telefon = cyfry.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    const wagaMatch = tekst.match(/(\d+[\.,]?\d*)\s*(t\b|ton\b|tony\b|kg\b)/i);
    if (wagaMatch) {
        let val = parseFloat(wagaMatch[1].replace(',', '.'));
        if (wagaMatch[2].toLowerCase() === 'kg') val = val / 1000;
        wynik.waga = val.toString();
    }
    const cenaMatch = tekst.match(/(\d+[\.,]?\d*)\s*(zł|pln|zl)/i);
    if (cenaMatch) wynik['cena' as keyof ParsedData] = parseFloat(cenaMatch[1].replace(',', '.')) as any;

    if (t.includes('cała polska') || t.includes('caly kraj') || t.includes('ogólnopolski') || t.includes('cały kraj')) {
        wynik.lokalizacja = 'Cała Polska';
        wynik.wojewodztwo = '';
    } else {
        // 1. NAJPIERW szukaj polskich województw — mają NAJWYżSZY priorytet
        for (const woj of WOJEWODZTWA) {
            if (t.includes(woj)) { wynik.wojewodztwo = woj; break; }
        }
        // 2. Szukaj miast polskich
        for (const [miasto, woj] of Object.entries(MIASTA_WOJEWODZTWA)) {
            if (t.includes(miasto)) {
                wynik.lokalizacja = miasto.charAt(0).toUpperCase() + miasto.slice(1);
                if (!wynik.wojewodztwo) wynik.wojewodztwo = woj;
                break;
            }
        }
        // 3. Zagranicy szukamy TYLKO jeśli nie znaleziono żadnego polskiego województwa/miasta
        if (!wynik.wojewodztwo && !wynik.lokalizacja) {
            if (t.includes('europa') || t.includes('zagranica') || t.includes('eksport')) {
                wynik.lokalizacja = 'Europa / Zagranica';
                wynik.wojewodztwo = '';
            }
        }
    }

    for (const { slowa, kategoria } of SLOWA_KLUCZE) {
        if (slowa.some(s => t.includes(s))) {
            wynik.material = kategoria;
            const found = KATEGORIE_Z_BDO.find(k => k.nazwa === kategoria);
            if (found && !wynik.autoBdo) wynik.autoBdo = found.bdo;
            break;
        }
    }
    if (SLOWA_KUPIE.some(s => t.includes(s))) wynik.typOferty = 'kupie';
    else if (SLOWA_SPRZEDAM.some(s => t.includes(s))) wynik.typOferty = 'sprzedam';
    const pierwszaLinia = tekst.split('\n')[0].trim().substring(0, 60);
    if (pierwszaLinia.length > 5) wynik.title = pierwszaLinia;
    return wynik;
}

// Specjalne opcje zasięgu (nie-województwa)
const SPECIAL_OPTIONS = [
    { value: 'Cała Polska', label: '🌐 Cała Polska' },
    { value: 'Europa / Zagranica', label: '✈️ Europa / Zagranica' },
];

// Oblicz etykietę przycisku dropdownu
function getLokalizacjaLabel(lokalizacja: string, wybrane: string[]): string {
    if (lokalizacja === 'Cała Polska') return '🌐 Cała Polska';
    if (lokalizacja === 'Europa / Zagranica') return '✈️ Europa / Zagranica';
    if (wybrane.length === 1) return wybrane[0];
    if (wybrane.length > 1) return `${wybrane.length} województw`;
    return 'Wybierz lokalizację...';
}

export default function DodajOferteKrok1() {
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [typOferty, setTypOferty] = useState<'sprzedam' | 'kupie'>('sprzedam');
    const [title, setTitle] = useState('');
    const [material, setMaterial] = useState('');
    const [waga, setWaga] = useState('');
    const [lokalizacja, setLokalizacja] = useState('');
    // wybrane = lista zaznaczonych województw (może być wiele)
    const [wybrane, setWybrane] = useState<string[]>([]);
    const [telefon, setTelefon] = useState('');
    const [autoBdo, setAutoBdo] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hp, setHp] = useState("");
    const [magicTekst, setMagicTekst] = useState('');
    const [magicOtwarte, setMagicOtwarte] = useState(false);
    const [podswietlone, setPodswietlone] = useState<Set<string>>(new Set());
    const [seoOpis, setSeoOpis] = useState('');
    const [seoWygenerowane, setSeoWygenerowane] = useState(false);
    const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const zdjęcieRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setIsCheckingAuth(false); }, []);

    // Zamknij dropdown po kliknięciu poza
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Oblicz efektywną lokalizację do zapisu
    const getEfektywnaLokalizacja = () => {
        if (lokalizacja === 'Cała Polska' || lokalizacja === 'Europa / Zagranica') return lokalizacja;
        return wybrane.length > 0 ? wybrane[0] : '';
    };

    const getEfektywneWojewodztwo = () => {
        if (lokalizacja === 'Cała Polska' || lokalizacja === 'Europa / Zagranica') return '';
        return wybrane.join(', ');
    };

    const handleSpecjalny = (val: string) => {
        setLokalizacja(val);
        setWybrane([]);
        setDropdownOpen(false);
    };

    const handleToggleWojewodztwo = (woj: string) => {
        setLokalizacja('');
        setWybrane(prev =>
            prev.includes(woj) ? prev.filter(w => w !== woj) : [...prev, woj]
        );
    };

    const handleAnalizuj = () => {
        if (!magicTekst.trim()) return;
        const parsed = parsujTekst(magicTekst);
        const nowePodswietlone = new Set<string>();

        const zastap = (pole: string, nowaWartosc: string, obecnaWartosc: string, setter: (v: string) => void) => {
            if (!nowaWartosc) return;
            if (obecnaWartosc && obecnaWartosc !== nowaWartosc) {
                if (!confirm(`Pole "${pole}" zawiera już wartość "${obecnaWartosc}". Zastąpić?`)) return;
            }
            setter(nowaWartosc);
        };

        if (parsed.telefon) zastap('Telefon', parsed.telefon, telefon, setTelefon);
        else nowePodswietlone.add('telefon');
        if (parsed.waga) zastap('Waga', parsed.waga, waga, setWaga);
        else nowePodswietlone.add('waga');

        if (parsed.lokalizacja === 'Cała Polska' || parsed.lokalizacja === 'Europa / Zagranica') {
            setLokalizacja(parsed.lokalizacja);
            setWybrane([]);
        } else {
            if (parsed.wojewodztwo) {
                setWybrane([parsed.wojewodztwo]);
                setLokalizacja('');
            } else nowePodswietlone.add('lokalizacja');
        }

        if (parsed.material) {
            zastap('Kategoria', parsed.material, material, setMaterial);
            const found = KATEGORIE_Z_BDO.find(k => k.nazwa === parsed.material);
            if (found) setAutoBdo(found.bdo);
        } else nowePodswietlone.add('material');
        if (parsed.title) zastap('Tytuł', parsed.title, title, setTitle);
        else nowePodswietlone.add('title');
        if (parsed.typOferty) setTypOferty(parsed.typOferty);
        if (parsed.cena) localStorage.setItem('magic_cena', String(parsed.cena));
        setPodswietlone(nowePodswietlone);

        const nowyTytul = parsed.title || title;
        const nowyMaterial = parsed.material || material;
        const nowaLok = parsed.lokalizacja || getEfektywnaLokalizacja();
        const opis = `${typOferty === 'kupie' ? 'Kupię' : 'Sprzedam'}: ${nowyTytul || nowyMaterial}${nowaLok ? ` — ${nowaLok}` : ''}\n\nKategoria: ${nowyMaterial}\nWaga: ${parsed.waga || waga} ton\nLokalizacja: ${nowaLok}`;
        setSeoOpis(opis);
        localStorage.setItem('magic_opis', opis);
        const slugBase = [nowyTytul || nowyMaterial, nowaLok].filter(Boolean).join(' ');
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
                lokalizacja: sanitizeText(getEfektywnaLokalizacja()),
                wojewodztwo: sanitizeText(getEfektywneWojewodztwo()),
                telefon: sanitizeText(telefon),
                zdjecie_url: uploadedImageUrl,
                bdo_code: autoBdo,
                magic_box_used: seoWygenerowane,
            };
            localStorage.setItem('temp_offer', JSON.stringify(step1Data));
            router.push('/dodaj/parametry');
        } catch (err: any) {
            alert(err.message);
            setLoading(false);
        }
    };

    if (isCheckingAuth) return null;

    const lokalizacjaLabel = getLokalizacjaLabel(lokalizacja, wybrane);
    const maWybor = lokalizacja !== '' || wybrane.length > 0;

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

                {/* MAGIC BOX */}
                <div className="mb-8">
                    {!magicOtwarte ? (
                        <button type="button" onClick={() => setMagicOtwarte(true)}
                            className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-600 py-4 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all group">
                            <Sparkles size={18} className="group-hover:animate-spin" />
                            Wklej tekst z ogłoszenia — wypełnię pola automatycznie
                        </button>
                    ) : (
                        <div className="border-2 border-blue-400 rounded-[28px] overflow-hidden shadow-lg">
                            <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-white">
                                    <Sparkles size={16} />
                                    <span className="font-black text-xs uppercase tracking-widest">Magic Box</span>
                                </div>
                                <button type="button" onClick={() => setMagicOtwarte(false)} className="text-blue-200 hover:text-white"><X size={18} /></button>
                            </div>
                            <div className="p-4 bg-white">
                                <textarea
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-[20px] font-medium text-slate-700 min-h-[120px] resize-none outline-none focus:border-blue-400 transition-colors text-sm placeholder:text-slate-400"
                                    placeholder="Wklej tutaj tekst z Facebooka, WhatsApp lub maila..."
                                    value={magicTekst} onChange={e => setMagicTekst(e.target.value)} />
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
                                        <textarea className="w-full p-4 bg-white text-slate-700 font-medium text-sm min-h-[120px] resize-none outline-none"
                                            value={seoOpis} onChange={e => setSeoOpis(e.target.value)} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

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
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 block">
                            Kategoria surowca <span className="text-red-500">*</span>
                        </label>
                        <select required
                            className={`w-full p-5 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors ${getFieldClass('material')}`}
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
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 block">
                                Telefon <span className="text-red-500">*</span>
                            </label>
                            <input required type="tel" placeholder="000 000 000"
                                className={`w-full p-5 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors ${getFieldClass('telefon')}`}
                                value={telefon} onChange={e => { setTelefon(formatujTelefon(e.target.value)); setPodswietlone(p => { const n = new Set(p); n.delete('telefon'); return n; }); }} />
                        </div>
                    </div>

                    {/* ============ LOKALIZACJA — jedna wysuwajka ============ */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-2 block">
                            Lokalizacja <span className="text-red-500">*</span>
                        </label>

                        <div ref={dropdownRef} className="relative">
                            {/* Przycisk otwierający */}
                            <button
                                type="button"
                                onClick={() => setDropdownOpen(o => !o)}
                                className={`w-full flex items-center justify-between p-5 border-2 rounded-[24px] font-bold outline-none transition-colors text-left ${
                                    maWybor
                                        ? 'border-blue-500 bg-blue-50 text-slate-900'
                                        : 'border-slate-200 bg-slate-50 text-slate-400'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Globe size={18} className={maWybor ? 'text-blue-600' : 'text-slate-300'} />
                                    {lokalizacjaLabel}
                                </span>
                                <ChevronDown size={18} className={`transition-transform text-slate-400 ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown */}
                            {dropdownOpen && (
                                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-[24px] shadow-2xl border border-slate-100 z-50 overflow-hidden">
                                    <div className="p-3 max-h-80 overflow-y-auto">

                                        {/* Opcje specjalne */}
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Zasięg ogólny</p>
                                        {SPECIAL_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleSpecjalny(opt.value)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-black text-sm transition-all mb-1 ${
                                                    lokalizacja === opt.value
                                                        ? 'bg-slate-900 text-white'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}

                                        <div className="border-t border-slate-100 my-3" />

                                        {/* Województwa */}
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Województwa (możesz wybrać kilka)</p>
                                        {WOJEWODZTWA.map(woj => {
                                            const zaznaczone = wybrane.includes(woj);
                                            return (
                                                <button
                                                    key={woj}
                                                    type="button"
                                                    onClick={() => handleToggleWojewodztwo(woj)}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left font-bold text-sm capitalize transition-all ${
                                                        zaznaczone ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                                        zaznaczone ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                                                    }`}>
                                                        {zaznaczone && (
                                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                                <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    {woj}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Stopka dropdownu — zamknij */}
                                    <div className="border-t border-slate-100 p-3">
                                        <button
                                            type="button"
                                            onClick={() => setDropdownOpen(false)}
                                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all"
                                        >
                                            Zatwierdź
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tagi zaznaczonych województw */}
                        {wybrane.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {wybrane.map(woj => (
                                    <span
                                        key={woj}
                                        className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-black px-3 py-1.5 rounded-xl"
                                    >
                                        {woj}
                                        <button
                                            type="button"
                                            onClick={() => setWybrane(prev => prev.filter(w => w !== woj))}
                                            className="hover:text-red-500 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ZDJĘCIE */}
                    <div ref={zdjęcieRef} onClick={() => document.getElementById('fileInput')?.click()}
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
