'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    Archive, Mountain, ShoppingBag, Layers, Box,
    ArrowRight, User, Recycle, FileText, Wrench,
    MapPin, Clock, Search, ArrowDownToLine, PackageSearch, ImageOff
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
        let wynik = wszystkieOferty;

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
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="/dodaj" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-slate-100 px-4 py-2 rounded-lg">Dodaj Ofertę</Link>
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
                            placeholder="Czego szukasz?"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-800 border-2 border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all font-semibold"
                            value={szukanaFraza}
                            onChange={(e) => setSzukanaFraza(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* CATEGORIES */}
            <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
                <div className="bg-white rounded-2xl shadow-lg p-4 flex gap-4 overflow-x-auto no-scrollbar border border-gray-100 items-center justify-start md:justify-center">
                    {KATEGORIE.map((kategoria) => (
                        <button
                            key={kategoria.nazwa}
                            onClick={() => setAktywnyFiltr(kategoria.nazwa)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${aktywnyFiltr === kategoria.nazwa
                                ? 'bg-slate-900 text-white shadow-md scale-105'
                                : 'bg-gray-50 text-slate-600 hover:bg-gray-100 hover:text-slate-900'
                                }`}
                        >
                            <span className="text-xl">{kategoria.ikona}</span>
                            {kategoria.nazwa}
                        </button>
                    ))}
                </div>
            </div>

            {/* GRID */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                        Dostępne oferty
                        <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg ml-2">{filtrowaneOferty.length}</span>
                    </h2>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtrowaneOferty.map((oferta) => {
                            const jestKupno = oferta.typ_oferty === 'kupie';
                            const jestSprzedane = oferta.status === 'sprzedane';

                            return (
                                <Link key={oferta.id} href={`/rynek/${oferta.id}`} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1 block h-full flex flex-col">
                                    {/* CARD IMAGE */}
                                    <div className={`h-48 relative overflow-hidden ${jestKupno && !oferta.zdjecie_url ? 'bg-blue-50/50' : 'bg-slate-100'}`}>
                                        {oferta.zdjecie_url ? (
                                            <img src={oferta.zdjecie_url} alt={oferta.title} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${jestSprzedane ? 'grayscale opacity-50' : ''}`} />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center">
                                                {jestKupno ? (
                                                    <div className="flex flex-col items-center text-blue-300">
                                                        <PackageSearch size={48} strokeWidth={1.5} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest mt-2">Szuka surowca</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center text-slate-300">
                                                        <span className="text-5xl mb-1 grayscale opacity-50">{getIcon(oferta.material)}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Brak zdjęcia</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* KATEGORIA */}
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-slate-900 uppercase tracking-wide shadow-sm flex items-center gap-1">
                                            {getIcon(oferta.material)} {oferta.material}
                                        </div>

                                        {/* STATUS BADGE */}
                                        <div className={`absolute top-4 right-4 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 uppercase tracking-wider ${jestKupno ? 'bg-emerald-600/90' : 'bg-blue-600/90'}`}>
                                            {jestKupno ? <ArrowDownToLine size={12} /> : <ShoppingBag size={12} />}
                                            {jestKupno ? 'Kupię' : 'Sprzedam'}
                                        </div>

                                        {jestSprzedane && (
                                            <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[1px] flex items-center justify-center">
                                                <span className="bg-white text-red-600 px-4 py-1 rounded-lg font-black text-sm uppercase -rotate-12 border-2 border-red-600">Zakończone</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* CARD BODY */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="mb-4">
                                            <h3 className={`text-lg font-black leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 uppercase ${jestSprzedane ? 'text-slate-400' : 'text-slate-900'}`}>
                                                {oferta.title || oferta.material}
                                            </h3>
                                            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                                <MapPin className="w-4 h-4 text-slate-300" />
                                                {oferta.lokalizacja} {oferta.wojewodztwo && `(${oferta.wojewodztwo})`}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cena</span>
                                                <span className={`block text-lg font-black ${jestSprzedane ? 'text-slate-400' : 'text-slate-900'}`}>
                                                    {oferta.cena > 0 ? `${oferta.cena} zł / t` : 'Zapytaj o cenę'}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{jestKupno ? 'Szukam' : 'Ilość'}</span>
                                                <span className={`block text-lg font-black ${jestSprzedane ? 'text-slate-400' : 'text-slate-900'}`}>
                                                    {oferta.waga > 0 ? `${oferta.waga} t` : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                                                <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                {formatDistanceToNow(new Date(oferta.created_at), { addSuffix: true, locale: pl })}
                                            </span>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${jestSprzedane ? 'bg-slate-50' : 'bg-slate-100 group-hover:bg-blue-600'}`}>
                                                <ArrowRight className={`w-4 h-4 transition-colors ${jestSprzedane ? 'text-slate-200' : 'text-slate-400 group-hover:text-white'}`} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}