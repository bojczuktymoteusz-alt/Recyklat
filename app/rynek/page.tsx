'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
    Recycle, MapPin, Search, Package, ChevronDown, TrendingUp, Clock
} from 'lucide-react';

// --- TYPY ---
interface Oferta {
    id: number;
    title?: string;
    material: string;
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

const getPlaceholder = (typ_oferty?: string) =>
    typ_oferty === 'kupie'
        ? '/placeholder-kupie.jpg'
        : '/placeholder-sprzedam.jpg';

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

    const fetchOferty = async (query = "") => {
        try {
            setLoading(true);
            let result;

            if (query.trim() !== "") {
                result = await supabase.rpc('szukaj_ogloszen', { search_query: query });
            } else {
                result = await supabase
                    .from('oferty')
                    .select('id, title, material, waga, cena, lokalizacja, wojewodztwo, zdjecie_url, created_at, status, typ_oferty, wyswietlenia')
                    .order('wyswietlenia', { ascending: false, nullsFirst: false })
                    .order('created_at', { ascending: false });
            }

            if (result.error) throw result.error;
            if (result.data) setWszystkieOferty(result.data);

        } catch (error: any) {
            console.error("Błąd pobierania:", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchOferty(szukanaFraza);
            setVisibleCount(ITEMS_PER_PAGE);
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [szukanaFraza]);

    useEffect(() => {
        let wynik = [...wszystkieOferty];

        if (typFiltr !== 'wszystkie') {
            wynik = wynik.filter(o => o.typ_oferty === typFiltr || (!o.typ_oferty && typFiltr === 'sprzedam'));
        }

        if (aktywnyFiltr !== "Wszystko") {
            wynik = wynik.filter(o => {
                const mat = o.material.toLowerCase();
                const kat = aktywnyFiltr.toLowerCase();
                return mat.includes(kat) || (o.title && o.title.toLowerCase().includes(kat));
            });
        }

        if (szukanaFraza.trim() !== "") {
            const fraza = szukanaFraza.toLowerCase().trim();
            wynik = wynik.filter(o =>
                (o.material && o.material.toLowerCase().includes(fraza)) ||
                (o.title && o.title.toLowerCase().includes(fraza)) ||
                (o.lokalizacja && o.lokalizacja.toLowerCase().includes(fraza)) ||
                (o.wojewodztwo && o.wojewodztwo.toLowerCase().includes(fraza))
            );
        }

        wynik.sort((a, b) => {
            const aSprzedane = a.status === 'sprzedane';
            const bSprzedane = b.status === 'sprzedane';
            if (aSprzedane && !bSprzedane) return 1;
            if (!aSprzedane && bSprzedane) return -1;

            if (sortowanie === 'popularne') {
                const aViews = a.wyswietlenia ?? 0;
                const bViews = b.wyswietlenia ?? 0;
                if (bViews !== aViews) return bViews - aViews;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setFiltrowaneOferty(wynik);
    }, [aktywnyFiltr, typFiltr, wszystkieOferty, sortowanie]);

    const wyswietlaneOferty = filtrowaneOferty.slice(0, visibleCount);

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* NAVBAR */}
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

            {/* NAGŁÓWEK I WYSZUKIWARKA */}
            <div className="bg-slate-900 py-12 px-4 shadow-xl">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
                        Rynek Odpadów <span className="text-blue-500">Recyklingowych</span>
                    </h1>

                    <div className="flex justify-center mb-8">
                        <div className="bg-slate-800 p-1 rounded-2xl flex gap-1">
                            {(['wszystkie', 'sprzedam', 'kupie'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTypFiltr(t)}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${typFiltr === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {t === 'wszystkie' ? 'Wszystkie' : t === 'sprzedam' ? 'Sprzedam' : 'Kupię'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative max-w-2xl mx-auto group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Wyszukaj materiał lub lokalizację..."
                            value={szukanaFraza}
                            onChange={(e) => setSzukanaFraza(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-800 border-2 border-slate-700 text-white rounded-2xl focus:border-blue-500 outline-none text-lg"
                        />
                    </div>
                </div>
            </div>

            {/* KATEGORIE */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
                <div className="relative">
                    <div ref={kategorieRef} className="bg-white p-2 rounded-3xl shadow-xl border border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                        {KATEGORIE.map((kat) => (
                            <button
                                key={kat.nazwa}
                                onClick={() => setAktywnyFiltr(kat.nazwa)}
                                className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${aktywnyFiltr === kat.nazwa ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <span>{kat.ikona}</span>{kat.nazwa}
                            </button>
                        ))}
                        <div className="flex-shrink-0 w-8" />
                    </div>
                    <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent rounded-r-3xl sm:hidden" />
                    <button
                        onClick={() => kategorieRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                        aria-label="Przewiń kategorie"
                        className="sm:hidden absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-slate-400 active:scale-90 transition-transform z-10 p-2"
                    >
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 ml-0.5">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
            </div>

            {/* LISTING */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">
                        {filtrowaneOferty.length} ofert
                    </p>
                    <div className="bg-white border border-slate-200 p-1 rounded-2xl flex gap-1 shadow-sm">
                        <button
                            onClick={() => { setSortowanie('popularne'); setVisibleCount(ITEMS_PER_PAGE); }}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${sortowanie === 'popularne' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-700'}`}
                        >
                            <TrendingUp size={13} /> Popularne
                        </button>
                        <button
                            onClick={() => { setSortowanie('najnowsze'); setVisibleCount(ITEMS_PER_PAGE); }}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${sortowanie === 'najnowsze' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-700'}`}
                        >
                            <Clock size={13} /> Najnowsze
                        </button>
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
                            {wyswietlaneOferty.map((o) => (
                                <Link
                                    href={`/rynek/${o.id}`}
                                    key={o.id}
                                    className="group bg-white rounded-[32px] ring-1 ring-slate-100 shadow-sm hover:shadow-2xl hover:ring-blue-100 transition-all duration-300 flex flex-col overflow-hidden isolate active:scale-[0.98]"
                                >
                                    <div className="aspect-[4/3] relative overflow-hidden bg-slate-50 isolate">
                                        <img
                                            src={o.zdjecie_url || getPlaceholder(o.typ_oferty)}
                                            alt={o.title || o.material}
                                            loading="lazy"
                                            onError={(e) => {
                                                const img = e.currentTarget;
                                                if (!img.src.includes('/placeholder-')) {
                                                    img.src = getPlaceholder(o.typ_oferty);
                                                }
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
                                        {o.status === 'sprzedane' && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center isolate">
                                                <span className="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase -rotate-12 border-2 border-white">Zakończone</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-lg font-black text-slate-900 line-clamp-2 uppercase mb-2 group-hover:text-blue-600 transition-colors">
                                            {o.title || o.material}
                                        </h3>
                                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-4">
                                            <MapPin size={12} className="text-blue-500" />
                                            {o.lokalizacja} {o.wojewodztwo ? `| ${o.wojewodztwo}` : ''}
                                        </div>
                                        <div className="mt-auto flex items-end justify-between border-t border-slate-50 pt-4">
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase">Cena ok.</span>
                                                <div className="text-xl font-black text-slate-900 tracking-tighter">
                                                    {o.cena > 0 ? `${o.cena} zł/t` : 'Negocjacja'}
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
                            ))}
                        </div>

                        {filtrowaneOferty.length > visibleCount && (
                            <div className="mt-12 flex justify-center">
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 12)}
                                    className="flex items-center gap-2 bg-white border-2 border-slate-200 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95"
                                >
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
                        <button onClick={() => { setAktywnyFiltr("Wszystko"); setSzukanaFraza(""); }} className="mt-4 text-blue-600 font-bold text-xs uppercase hover:underline">Wyczyść filtry</button>
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