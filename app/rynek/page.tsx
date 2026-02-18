'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    Archive, Mountain, ShoppingBag, Layers, Box,
    ArrowRight, User, Recycle, FileText, Wrench,
    MapPin, Clock
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOferty();
    }, []);

    useEffect(() => {
        let wyniki = wszystkieOferty;
        if (aktywnyFiltr !== "Wszystko") {
            wyniki = wyniki.filter(o => o.material.toLowerCase().includes(aktywnyFiltr.toLowerCase()));
        }
        if (szukanaFraza) {
            const fraza = szukanaFraza.toLowerCase();
            wyniki = wyniki.filter(o =>
                (o.title && o.title.toLowerCase().includes(fraza)) ||
                o.material.toLowerCase().includes(fraza) ||
                o.lokalizacja.toLowerCase().includes(fraza) ||
                (o.wojewodztwo && o.wojewodztwo.toLowerCase().includes(fraza))
            );
        }
        setFiltrowaneOferty(wyniki);
    }, [aktywnyFiltr, szukanaFraza, wszystkieOferty]);

    async function fetchOferty() {
        setLoading(true);
        const { data, error } = await supabase
            .from('oferty')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setWszystkieOferty(data);
            setFiltrowaneOferty(data);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
            <div className="max-w-5xl mx-auto">

                {/* NAGŁÓWEK */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 gap-6">
                    <div>
                        <Link href="/" className="inline-block hover:scale-[1.02] active:scale-95 transition-transform">
                            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-slate-900 cursor-pointer">
                                Giełda <span className="text-blue-600">Surowców</span>
                            </h1>
                        </Link>
                        <p className="text-slate-400 font-bold mt-2 uppercase text-xs tracking-widest">
                            Rynek hurtowy B2B • {wszystkieOferty.length} ofert
                        </p>
                    </div>

                    <div className="flex w-full md:w-auto gap-3">
                        <Link href="/moje" className="flex-1 md:flex-none bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all text-center uppercase text-sm flex items-center justify-center gap-2">
                            <User size={18} />
                            Moje
                        </Link>
                        <Link href="/dodaj" className="flex-[2] md:flex-none bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-xl text-center uppercase tracking-tight flex items-center justify-center gap-2">
                            <span>+</span> Wystaw towar
                        </Link>
                    </div>
                </div>

                {/* WYSZUKIWARKA */}
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Szukaj po tytule, materiale, mieście..."
                        className="w-full p-6 bg-white rounded-3xl shadow-sm border border-slate-100 focus:ring-4 focus:ring-blue-50 transition-all font-bold text-lg outline-none"
                        value={szukanaFraza}
                        onChange={(e) => setSzukanaFraza(e.target.value)}
                    />
                </div>

                {/* FILTRY */}
                <div className="flex gap-3 overflow-x-auto pb-6 mb-4 no-scrollbar">
                    {KATEGORIE.map((kat) => (
                        <button
                            key={kat.nazwa}
                            onClick={() => setAktywnyFiltr(kat.nazwa)}
                            className={`px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap border-2 ${aktywnyFiltr === kat.nazwa
                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100"
                                : "bg-white border-transparent text-slate-500 hover:border-slate-200 shadow-sm"
                                }`}
                        >
                            <span className="mr-2">{kat.ikona}</span>{kat.nazwa}
                        </button>
                    ))}
                </div>

                {/* LISTA OFERT */}
                {loading ? (
                    <div className="text-center py-20 font-black text-slate-300 uppercase tracking-widest animate-pulse">
                        Ładowanie giełdy...
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filtrowaneOferty.map((o) => (
                            <Link
                                href={`/rynek/${o.id}`}
                                key={o.id}
                                className="block bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 hover:border-blue-100 transition-all duration-300 group no-underline text-inherit"
                            >
                                <div className="flex flex-col md:flex-row h-full">

                                    {/* SEKCJA ZDJĘCIA */}
                                    <div className="w-full md:w-72 h-64 md:h-auto bg-slate-50 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                                        <div className={`w-full h-full flex items-center justify-center transition-all duration-500 ${o.status === 'sprzedane' ? 'grayscale opacity-30 scale-95' : ''}`}>
                                            {o.zdjecie_url ? (
                                                <img
                                                    src={o.zdjecie_url}
                                                    alt={o.title || o.material}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <span className="text-7xl opacity-20">{getIcon(o.material)}</span>
                                            )}
                                        </div>

                                        {o.status === 'sprzedane' && (
                                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/50 backdrop-blur-sm">
                                                <span className="bg-red-500 text-white px-4 py-2 font-black uppercase tracking-widest -rotate-12 shadow-xl border-2 border-white">
                                                    Sprzedane
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* TREŚĆ */}
                                    <div className="flex-1 p-6 flex flex-col justify-between relative">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h2 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight line-clamp-2">
                                                        {o.title || o.material}
                                                    </h2>
                                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                                                        {o.material}
                                                    </p>
                                                </div>
                                                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-black text-lg whitespace-nowrap">
                                                    {o.cena} zł/t
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-slate-600 font-medium">
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                        <Box size={16} />
                                                    </div>
                                                    <span className="text-slate-900 font-bold">{o.waga} ton</span>
                                                </div>

                                                <div className="flex items-center gap-3 text-slate-600 font-medium">
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <span className="truncate">{o.lokalizacja} {o.wojewodztwo ? `(${o.wojewodztwo})` : ''}</span>
                                                </div>

                                                <div className="flex items-center gap-3 text-slate-600 font-medium">
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                        <Clock size={16} />
                                                    </div>
                                                    <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                                                        {formatDistanceToNow(new Date(o.created_at), { addSuffix: true, locale: pl })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-blue-600 font-black uppercase text-xl md:text-Xl tracking-tighter group-hover:gap-8 group-hover:text-blue-500 transition-all duration-300">
                                            ZOBACZ SZCZEGÓŁY
                                            <ArrowRight size={40} className="group-hover:scale-150 transition-transform duration-300 fill-blue-600" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* FLOATING BUTTON DLA MOBILE */}
            <div className="md:hidden fixed bottom-6 right-6 z-50">
                <Link href="/dodaj" className="bg-blue-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all">
                    <span className="text-2xl font-black">+</span>
                </Link>
            </div>
        </div>
    );
}