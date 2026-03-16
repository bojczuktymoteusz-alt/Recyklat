'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    Archive, Mountain, ShoppingBag, Layers, Box,
    ArrowRight, User, Recycle, FileText, Wrench,
    MapPin, Clock, Search, ArrowDownToLine, PackageSearch, ImageOff, Package
} from 'lucide-react';

interface Oferta {
    id: number;
    title?: string;
    material: string;
    waga: number;
    cena: number;
    lokalizacja: string;
    wojewodztwo?: string;
    telefon: string;
    zdjecie_url?: string;
    created_at: string;
    form?: string;
    status?: string;
    opis?: string;
    bdo_code?: string;
    impurity?: number;
    typ_oferty?: string;
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

export default function Rynek() {
    const [wszystkieOferty, setWszystkieOferty] = useState<Oferta[]>([]);
    const [filtrowaneOferty, setFiltrowaneOferty] = useState<Oferta[]>([]);
    const [aktywnyFiltr, setAktywnyFiltr] = useState("Wszystko");
    const [szukanaFraza, setSzukanaFraza] = useState("");
    const [typFiltr, setTypFiltr] = useState<'wszystkie' | 'sprzedam' | 'kupie'>('wszystkie');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOferty();
    }, []);

    const fetchOferty = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('oferty')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                setWszystkieOferty(data);
                setFiltrowaneOferty(data);
            }
        } catch (error) {
            console.error('Błąd pobierania ofert:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 1. Bierzemy wszystkie oferty (Sprzedane zostają jako "Social Proof" i reklama)
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

        if (szukanaFraza) {
            const fraza = szukanaFraza.toLowerCase();
            wynik = wynik.filter(o =>
                (o.title && o.title.toLowerCase().includes(fraza)) ||
                o.material.toLowerCase().includes(fraza) ||
                (o.opis && o.opis.toLowerCase().includes(fraza)) ||
                o.lokalizacja.toLowerCase().includes(fraza) ||
                (o.wojewodztwo && o.wojewodztwo.toLowerCase().includes(fraza))
            );
        }

        // 2. SORTOWANIE B2B: Aktywne na samej górze, Sprzedane spychamy na dół
        wynik.sort((a, b) => {
            const aSprzedane = a.status === 'sprzedane';
            const bSprzedane = b.status === 'sprzedane';

            if (aSprzedane && !bSprzedane) return 1;  // 'a' jest sprzedane, więc leci na dół
            if (!aSprzedane && bSprzedane) return -1; // 'b' jest sprzedane, więc 'a' wygrywa i leci do góry

            // Jeśli oba mają ten sam status (oba aktywne lub oba sprzedane), sortujemy klasycznie po dacie (najnowsze wyżej)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setFiltrowaneOferty(wynik);
    }, [aktywnyFiltr, szukanaFraza, typFiltr, wszystkieOferty]);
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

                        {/* ZMIENIONA SEKCJA PRZYCISKÓW W NAGŁÓWKU */}
                        <div className="flex items-center gap-3">
                            <Link
                                href="/moje"
                                className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border-2 border-transparent hover:border-slate-300"
                            >
                                <Package size={16} />
                                <span className="hidden sm:inline">Moje Ogłoszenia</span>
                            </Link>
                            <Link
                                href="/dodaj"
                                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95"
                            >
                                Dodaj Ofertę
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEARCH */}
            <div className="bg-slate-900 py-12 px-4 shadow-xl">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
                        Rynek Odpadów <span className="text-blue-500">Recyklingowych</span>
                    </h1>

                    {/* TOGGLE TYPU */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-slate-800 p-1 rounded-2xl flex gap-1">
                            {(['wszystkie', 'sprzedam', 'kupie'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTypFiltr(t)}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${typFiltr === t
                                        ? (t === 'kupie' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg')
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {t === 'wszystkie' ? 'Wszystkie' : t === 'sprzedam' ? 'Sprzedam' : 'Kupię'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative max-w-2xl mx-auto group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="np. folia, Toruń, cokolwiek..."
                            value={szukanaFraza}
                            onChange={(e) => setSzukanaFraza(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-800 border-2 border-slate-700 text-white rounded-2xl focus:border-blue-500 focus:ring-0 transition-all outline-none text-lg font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* KATEGORIE */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
                <div className="bg-white p-2 rounded-3xl shadow-xl border border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                    {KATEGORIE.map((kat) => (
                        <button
                            key={kat.nazwa}
                            onClick={() => setAktywnyFiltr(kat.nazwa)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all font-black text-xs uppercase tracking-widest ${aktywnyFiltr === kat.nazwa
                                ? 'bg-slate-900 text-white shadow-lg scale-105'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <span className="text-lg">{kat.ikona}</span>
                            {kat.nazwa}
                        </button>
                    ))}
                </div>
            </div>

            {/* LISTING */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="font-black text-slate-400 uppercase tracking-widest animate-pulse">Ładowanie ofert...</p>
                    </div>
                ) : filtrowaneOferty.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtrowaneOferty.map((o) => (
                            <Link
                                href={`/rynek/${o.id}`}
                                key={o.id}
                                className="group bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden"
                            >
                                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                                    {o.zdjecie_url ? (
                                        <img
                                            src={o.zdjecie_url}
                                            alt={o.title || o.material}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            {o.typ_oferty === 'kupie' ? <PackageSearch size={48} /> : <ImageOff size={48} />}
                                        </div>
                                    )}

                                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg ${o.typ_oferty === 'kupie' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                                            }`}>
                                            {o.typ_oferty === 'kupie' ? 'Kupię' : 'Sprzedam'}
                                        </div>
                                        <div className="bg-white/90 backdrop-blur px-2 py-1.5 rounded-xl flex items-center gap-1 shadow-md">
                                            <span className="text-lg">{getIcon(o.material)}</span>
                                        </div>
                                    </div>

                                    {o.status === 'sprzedane' && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                            <span className="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase -rotate-12 border-2 border-white shadow-xl">
                                                Zakończone
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-lg font-black text-slate-900 line-clamp-2 leading-tight mb-2 group-hover:text-blue-600 transition-colors uppercase">
                                        {o.title || o.material}
                                    </h3>

                                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                                        <MapPin size={12} className="text-blue-500" />
                                        {o.lokalizacja} {o.wojewodztwo ? `| ${o.wojewodztwo}` : ''}
                                    </div>

                                    <div className="mt-auto flex items-end justify-between border-t border-slate-50 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Cena ok.</span>
                                            <span className="text-xl font-black text-slate-900 tracking-tighter">
                                                {o.cena > 0 ? `${o.cena} zł/t` : 'Negocjacja'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Ilość</span>
                                            <span className="text-sm font-black text-blue-600 flex items-center h-5">
                                                {o.waga > 0 ? (
                                                    `${o.waga} t`
                                                ) : (
                                                    <span className="text-2xl -mb-2 translate-y-[1px]">∞</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-slate-100 rounded-[40px] flex items-center justify-center text-slate-300 mb-6">
                            <Search size={48} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Brak wyników</h2>
                        <p className="text-slate-500 font-medium">Spróbuj zmienić filtry lub wyszukiwaną frazę.</p>
                        <button
                            onClick={() => { setAktywnyFiltr("Wszystko"); setSzukanaFraza(""); setTypFiltr('wszystkie'); }}
                            className="mt-6 text-blue-600 font-black uppercase text-xs tracking-widest hover:underline"
                        >
                            Wyczyść wszystkie filtry
                        </button>
                    </div>
                )}
            </div>
            <footer className="py-12 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                        &copy; 2024 Recyklat.pl - System Obrotu Surowcami Wtórnymi
                    </p>
                </div>
            </footer>
        </div>
    );
}
