'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
    Recycle, MapPin, Search, Package, ChevronDown, TrendingUp, Clock, Globe, Plane
} from 'lucide-react';
import { getFallbackTitle, formatCena } from '@/lib/ofertaUtils';

interface Oferta {
    id: number;
    title?: string;
    material: string;
    form?: string;
    waga: number;
    cena: number;
    lokalizacja: string;
    wojewodztwo?: string;
    zdjecie_url?: string;
    created_at: string;
    status?: string;
    typ_oferty?: string;
    wyswietlenia?: number;
}

const KATEGORIE = [
    { nazwa: "Wszystko", ikona: "🌐" },
    { nazwa: "Folia", ikona: "🧻" },
    { nazwa: "Tworzywa", ikona: "♻️" },
    { nazwa: "Makulatura", ikona: "📄" },
    { nazwa: "Złom", ikona: "🔩" },
    { nazwa: "Drewno", ikona: "🟫" },
    { nazwa: "Inne", ikona: "❓" }
];

const getIcon = (material: string) => {
    const m = material.toLowerCase();
    if (m.includes('folia')) return '🧻';
    if (m.includes('tworzywa') || m.includes('pet')) return '♻️';
    if (m.includes('makulatura') || m.includes('karton')) return '📄';
    if (m.includes('złom')) return '🔩';
    if (m.includes('drewno')) return '🪵';
    return '📦';
};

const WSZYSTKIE_WOJEWODZTWA = [
    "dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie",
    "łódzkie", "małopolskie", "mazowieckie", "opolskie",
    "podkarpackie", "podlaskie", "pomorskie", "śląskie",
    "świętokrzyskie", "warmińsko-mazurskie", "wielkopolskie", "zachodniopomorskie"
];

const getPlaceholder = (typ_oferty?: string) =>
    typ_oferty === 'kupie' ? '/placeholder-kupie.jpg' : '/placeholder-sprzedam.jpg';

const isOgolnopolska = (lok?: string) => {
    if (!lok) return false;
    const l = lok.toLowerCase();
    return l.includes('polska') || l.includes('cała');
};

const isZagranica = (lok?: string) => {
    if (!lok) return false;
    const l = lok.toLowerCase();
    return l.includes('europa') || l.includes('zagranica');
};

const normalizuj = (s: string): string =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const wykryjWojewodztwo = (fraza: string): string | null => {
    const f = normalizuj(fraza.trim());
    return WSZYSTKIE_WOJEWODZTWA.find(w => normalizuj(w) === f) || null;
};

const ITEMS_PER_PAGE = 12;

export default function Rynek() {
    const [wszystkieOferty, setWszystkieOferty] = useState<Oferta[]>([]);
    const [filtrowaneOferty, setFiltrowaneOferty] = useState<Oferta[]>([]);
    const [aktywnyFiltr, setAktywnyFiltr] = useState("Wszystko");
    const [szukanaFraza, setSzukanaFraza] = useState("");
    const [typFiltr, setTypFiltr] = useState<'wszystkie' | 'sprzedam' | 'kupie'>('wszystkie');
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [sortowanie, setSortowanie] = useState<'popularne' | 'najnowsze'>('popularne');
    const kategorieRef = React.useRef<HTMLDivElement>(null);
    const [wybrane, setWybrane] = useState<string[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchOferty = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('oferty')
                .select('id, title, material, form, waga, cena, lokalizacja, wojewodztwo, zdjecie_url, created_at, status, typ_oferty, wyswietlenia')
                .eq('status', 'aktywna')
                .order('wyswietlenia', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWszystkieOferty(data || []);
        } catch (error: any) {
            console.error("Błąd pobierania:", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOferty(); }, []);

    useEffect(() => {
        let wynik = [...wszystkieOferty];
        const fraza = szukanaFraza.toLowerCase().trim();

        if (typFiltr !== 'wszystkie') {
            wynik = wynik.filter(o =>
                o.typ_oferty === typFiltr || (!o.typ_oferty && typFiltr === 'sprzedam')
            );
        }

        if (aktywnyFiltr !== "Wszystko") {
            wynik = wynik.filter(o => {
                const mat = (o.material || '').toLowerCase();
                const kat = aktywnyFiltr.toLowerCase();
                return mat.includes(kat) || (o.title && o.title.toLowerCase().includes(kat));
            });
        }

        if (wybrane.length > 0) {
            wynik = wynik.filter(o => {
                if (isOgolnopolska(o.lokalizacja) || isZagranica(o.lokalizacja)) return true;
                const woj = (o.wojewodztwo || '').toLowerCase();
                const lok = (o.lokalizacja || '').toLowerCase();
                return wybrane.some(w => {
                    if (w === 'Europa / Zagranica') return isZagranica(o.lokalizacja);
                    const wLower = w.toLowerCase();
                    return woj === wLower ||
                        woj.split(',').map(s => s.trim()).includes(wLower) ||
                        lok === wLower;
                });
            });
        }

        if (fraza) {
            const frazaNorm = normalizuj(fraza);
            const wykryteWoj = wykryjWojewodztwo(fraza);

            if (wykryteWoj) {
                wynik = wynik.filter(o => {
                    if (isOgolnopolska(o.lokalizacja) || isZagranica(o.lokalizacja)) return true;
                    const woj = normalizuj(o.wojewodztwo || '');
                    const lok = normalizuj(o.lokalizacja || '');
                    const wykryteNorm = normalizuj(wykryteWoj);
                    return woj === wykryteNorm || lok === wykryteNorm;
                });
            } else {
                wynik = wynik.filter(o =>
                    normalizuj(o.material || '').includes(frazaNorm) ||
                    normalizuj(o.title || '').includes(frazaNorm) ||
                    normalizuj(o.lokalizacja || '').includes(frazaNorm) ||
                    normalizuj(o.wojewodztwo || '').includes(frazaNorm)
                );
            }
        }

        wynik.sort((a, b) => {
            if (sortowanie === 'popularne') {
                const diff = (b.wyswietlenia ?? 0) - (a.wyswietlenia ?? 0);
                if (diff !== 0) return diff;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setFiltrowaneOferty(wynik);
        setVisibleCount(ITEMS_PER_PAGE);
    }, [aktywnyFiltr, typFiltr, wszystkieOferty, sortowanie, szukanaFraza, wybrane]);

    const wyswietlaneOferty = filtrowaneOferty.slice(0, visibleCount);

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <div className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                <Recycle className="text-white w-6 h-6" />
                            </div>
                            <span className="text-2xl font-black text-slate-900 tracking-tighter hidden sm:block">
                                RECYKLAT<span className="text-blue-600">.PL</span>
                            </span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Link href="/moje" className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                                <Package size={16} /><span className="hidden sm:inline">Moje Ogłoszenia</span>
                            </Link>
                            <Link href="/dodaj" className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">
                                Dodaj Ofertę
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 py-12 px-4 shadow-xl">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
                        Rynek Odpadów <span className="text-blue-500">Recyklingowych</span>
                    </h1>
                    <div className="flex justify-center mb-8">
                        <div className="bg-slate-800 p-1 rounded-2xl flex gap-1">
                            {(['wszystkie', 'sprzedam', 'kupie'] as const).map(t => (
                                <button key={t} onClick={() => setTypFiltr(t)}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${typFiltr === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                                    {t === 'wszystkie' ? 'Wszystkie' : t === 'sprzedam' ? 'Sprzedam' : 'Kupię'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative max-w-2xl mx-auto flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Wyszukaj materiał, surowiec..."
                                value={szukanaFraza}
                                onChange={e => setSzukanaFraza(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 bg-slate-800 border-2 border-slate-700 text-white rounded-2xl focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div ref={dropdownRef} className="relative shrink-0">
                            <button
                                type="button"
                                onClick={() => setDropdownOpen(o => !o)}
                                className={`h-full flex items-center gap-2 px-4 py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                                    wybrane.length > 0
                                        ? 'bg-blue-600 border-blue-500 text-white'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500'
                                }`}
                            >
                                <Globe size={15} />
                                <span className="hidden sm:inline">
                                    {wybrane.length === 0 ? 'Cała Polska' : wybrane.length === 1 ? wybrane[0] : `${wybrane.length} woj.`}
                                </span>
                                <ChevronDown size={13} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                                    <div className="p-2 max-h-96 overflow-y-auto">
                                        <button
                                            onClick={() => { setWybrane([]); setDropdownOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-black text-xs uppercase tracking-widest transition-all ${
                                                wybrane.length === 0 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <Globe size={14} /> Cała Polska
                                        </button>
                                        <button
                                            onClick={() => {
                                                const val = 'Europa / Zagranica';
                                                setWybrane(prev =>
                                                    prev.includes(val) ? prev.filter(w => w !== val) : [val]
                                                );
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-black text-xs uppercase tracking-widest transition-all ${
                                                wybrane.includes('Europa / Zagranica') ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <Plane size={14} /> Europa / Zagranica
                                        </button>
                                        <div className="border-t border-slate-100 my-2" />
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 mb-1">Województwa</p>
                                        {WSZYSTKIE_WOJEWODZTWA.map(woj => {
                                            const zaznaczone = wybrane.includes(woj);
                                            return (
                                                <button
                                                    key={woj}
                                                    onClick={() => setWybrane(prev =>
                                                        zaznaczone ? prev.filter(w => w !== woj) : [...prev.filter(w => w !== 'Europa / Zagranica'), woj]
                                                    )}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left font-bold text-xs capitalize transition-all ${
                                                        zaznaczone ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                                        zaznaczone ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                                                    }`}>
                                                        {zaznaczone && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                                    </div>
                                                    {woj}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {wybrane.length > 0 && (
                                        <div className="border-t border-slate-100 p-2">
                                            <button
                                                onClick={() => { setWybrane([]); setDropdownOpen(false); }}
                                                className="w-full text-center text-xs font-black text-slate-400 hover:text-red-500 py-2 transition-colors uppercase tracking-widest"
                                            >
                                                Wyczyść filtry geograficzne
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
                <div className="relative">
                    <div ref={kategorieRef} className="bg-white p-2 rounded-3xl shadow-xl border border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                        {KATEGORIE.map(kat => (
                            <button key={kat.nazwa} onClick={() => setAktywnyFiltr(kat.nazwa)}
                                className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${aktywnyFiltr === kat.nazwa ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <span>{kat.ikona}</span>{kat.nazwa}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">
                        {filtrowaneOferty.length} ofert
                    </p>
                    <div className="bg-white border border-slate-200 p-1 rounded-2xl flex gap-1 shadow-sm">
                        {(['popularne', 'najnowsze'] as const).map(s => (
                            <button key={s} onClick={() => setSortowanie(s)}
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${sortowanie === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-700'}`}>
                                {s === 'popularne' ? <><TrendingUp size={13} /> Popularne</> : <><Clock size={13} /> Najnowsze</>}
                            </button>
                        ))}
                    </div>
                </div>

                {loading && wszystkieOferty.length === 0 ? (
                    <div className="flex flex-col items-center py-20 animate-pulse">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Pobieranie danych...</p>
                    </div>
                ) : wyswietlaneOferty.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {wyswietlaneOferty.map(o => {
                                const displayTitle = getFallbackTitle({ title: o.title, material: o.material, form: o.form, lokalizacja: o.lokalizacja });
                                const ogolnopolska = isOgolnopolska(o.lokalizacja);
                                const zagranica = isZagranica(o.lokalizacja);

                                return (
                                    <Link href={`/rynek/${o.id}`} key={o.id}
                                        className="group bg-white rounded-[32px] ring-1 ring-slate-100 shadow-sm hover:shadow-2xl hover:ring-blue-100 transition-all duration-300 flex flex-col overflow-hidden isolate active:scale-[0.98]">
                                        <div className="aspect-[4/3] relative overflow-hidden bg-slate-50 isolate">
                                            <img
                                                src={o.zdjecie_url || getPlaceholder(o.typ_oferty)}
                                                alt={displayTitle}
                                                loading="lazy"
                                                onError={e => {
                                                    const img = e.currentTarget;
                                                    if (!img.src.includes('/placeholder-')) img.src = getPlaceholder(o.typ_oferty);
                                                }}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                            />
                                            <div className="absolute top-4 left-4 right-4 flex justify-between">
                                                <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg ${o.typ_oferty === 'kupie' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                                    {o.typ_oferty === 'kupie' ? 'Kupię' : 'Sprzedam'}
                                                </div>
                                                <div className="bg-white/90 backdrop-blur px-2 py-1.5 rounded-xl text-lg shadow-md">
                                                    {getIcon(o.material)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 flex flex-col flex-1">
                                            <h3 className="text-lg font-black text-slate-900 line-clamp-2 uppercase mb-2 group-hover:text-blue-600 transition-colors">
                                                {displayTitle}
                                            </h3>
                                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-4">
                                                {zagranica ? (
                                                    <><Plane size={12} className="text-emerald-500" /><span className="text-emerald-500 font-black">Europa / Zagranica</span></>
                                                ) : ogolnopolska ? (
                                                    <><Globe size={12} className="text-blue-500" /><span className="text-blue-500 font-black">Cały Kraj</span></>
                                                ) : (
                                                    <><MapPin size={12} className="text-blue-500" />{o.lokalizacja} {o.wojewodztwo ? `| ${o.wojewodztwo}` : ''}</>
                                                )}
                                            </div>
                                            <div className="mt-auto flex items-end justify-between border-t border-slate-50 pt-4">
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Cena ok.</span>
                                                    {/* STAŁY STYL — identyczny niezależnie od wartości ceny */}
                                                    <div className="text-xl font-black text-slate-900 tracking-tighter">
                                                        {formatCena(o.cena)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Ilość</span>
                                                    <div className="text-sm font-black text-blue-600">
                                                        {o.waga > 0 ? `${o.waga} t` : '∞'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {filtrowaneOferty.length > visibleCount && (
                            <div className="mt-12 flex justify-center">
                                <button onClick={() => setVisibleCount(prev => prev + 12)}
                                    className="flex items-center gap-2 bg-white border-2 border-slate-200 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95">
                                    Pokaż więcej ogłoszeń <ChevronDown size={16} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Search size={40} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase">Brak wyników</h2>
                        <button
                            onClick={() => { setAktywnyFiltr("Wszystko"); setSzukanaFraza(""); setWybrane([]); }}
                            className="mt-4 text-blue-600 font-bold text-xs uppercase hover:underline"
                        >
                            Wyczyść wszystkie filtry
                        </button>
                    </div>
                )}
            </div>

            <footer className="py-12 border-t border-slate-100 text-center">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">
                    &copy; 2026 Recyklat.pl - System Obrotu Surowcami Wtórnymi
                </p>
            </footer>
        </div>
    );
}
