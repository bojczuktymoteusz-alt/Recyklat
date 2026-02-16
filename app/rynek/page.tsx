'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    Archive, Mountain, ShoppingBag, Layers, Box,
    ArrowRight, User, Recycle, FileText, Wrench
} from 'lucide-react';

interface Oferta {
    id: number;
    material: string;
    waga: number;
    cena: number;
    lokalizacja: string;
    wojewodztwo?: string;
    telefon: string;
    zdjecie_url?: string;
    created_at: string;
    form?: string;
    pickup_hours?: string;
    extra_photo_docs?: boolean;
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
                o.material.toLowerCase().includes(fraza) ||
                o.lokalizacja.toLowerCase().includes(fraza) ||
                (o.wojewodztwo && o.wojewodztwo.toLowerCase().includes(fraza)) ||
                // 👇 DODANE: Przeszukiwanie całego opisu ogłoszenia
                (o.opis && o.opis.toLowerCase().includes(fraza)) ||
                // 👇 DODANE: Przeszukiwanie po kodzie BDO (np. jak ktoś wpisze "16 01 19")
                (o.bdo_code && o.bdo_code.toLowerCase().includes(fraza))
            );
        }

        setFiltrowaneOferty(wyniki);
    }, [aktywnyFiltr, szukanaFraza, wszystkieOferty]);

    async function fetchOferty() {
        setLoading(true);
        // Pobieramy wszystkie dane, w tym kolumnę status
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
                        placeholder="Szukaj po materiale, mieście lub województwie..."
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

                                        {/* Kontener obrazka z grayscale */}
                                        <div className={`w-full h-full flex items-center justify-center transition-all duration-500 ${o.status === 'sprzedane' ? 'grayscale opacity-30 scale-95' : ''}`}>
                                            {o.zdjecie_url ? (
                                                <img
                                                    src={o.zdjecie_url}
                                                    alt={o.material}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <span className="text-7xl opacity-20">{getIcon(o.material)}</span>
                                            )}
                                        </div>

                                        {/* BANER SPRZEDANE - musi być na samej górze (z-30) */}
                                        {o.status === 'sprzedane' && (
                                            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                                                <div className="bg-red-600 text-white font-black px-6 py-2 rounded-xl text-2xl uppercase tracking-tighter shadow-2xl -rotate-12 border-2 border-white animate-in zoom-in duration-300">
                                                    SPRZEDANE
                                                </div>
                                            </div>
                                        )}

                                        {/* Czas dodania */}
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-slate-700 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wide shadow-sm z-20">
                                            🕒 {formatDistanceToNow(new Date(o.created_at), { addSuffix: true, locale: pl })}
                                        </div>
                                    </div>

                                    {/* SEKCJA TREŚCI */}
                                    <div className={`p-8 flex-grow flex flex-col justify-between transition-colors duration-500 ${o.status === 'sprzedane' ? 'bg-slate-50/50' : 'bg-white'}`}>
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider">
                                                        📍 {o.lokalizacja}{o.wojewodztwo && `, ${o.wojewodztwo}`}
                                                    </span>
                                                    {o.status === 'sprzedane' && (
                                                        <span className="bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-wider">
                                                            Archiwum
                                                        </span>
                                                    )}
                                                </div>
                                                <h2 className={`text-2xl md:text-3xl font-black leading-tight mb-2 transition-colors ${o.status === 'sprzedane' ? 'text-slate-400' : 'text-slate-900 group-hover:text-blue-600'}`}>
                                                    {o.material}
                                                </h2>
                                            </div>

                                            {/* Pudełko ceny i wagi */}
                                            <div className={`text-right p-4 rounded-2xl border min-w-[120px] transition-all ${o.status === 'sprzedane' ? 'bg-white border-slate-100 opacity-40' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                                                <p className="text-2xl font-black text-slate-900 leading-none mb-1">{o.cena} zł</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cena / t</p>
                                                <div className="w-full h-px bg-slate-200 my-3"></div>
                                                <p className="text-xl font-black text-blue-600 leading-none mb-1">{o.waga} t</p>
                                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Ilość</p>
                                            </div>
                                        </div>

                                        {/* DOLNY PASEK KARTY */}
                                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-blue-600 font-black uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                                                Szczegóły <ArrowRight size={16} />
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">ID: #{o.id}</span>

                                                {o.status === 'sprzedane' ? (
                                                    <span className="text-red-500 font-black uppercase text-[10px] tracking-widest bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                                                        Oferta zakończona
                                                    </span>
                                                ) : (
                                                    <div className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-sm uppercase shadow-lg group-hover:bg-blue-600 transition-colors">
                                                        📞 Kontakt
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {/* Pusta giełda */}
                        {filtrowaneOferty.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold uppercase text-sm tracking-widest">Nie znaleziono ofert pasujących do filtrów.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}