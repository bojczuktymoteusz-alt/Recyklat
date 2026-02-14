'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Archive, Mountain, ShoppingBag, Layers, Box, ArrowRight } from 'lucide-react';

// Zaktualizowany interfejs zgodny z Twoją bazą
interface Oferta {
    id: number;
    material: string;
    waga: number;
    cena: number; // Nowe pole
    lokalizacja: string;
    wojewodztwo?: string; // NOWE POLE (opcjonalne dla starych ofert)
    telefon: string;
    zdjecie_url?: string;
    created_at: string;
    form?: string; // Forma (Belki, Luz)
    pickup_hours?: string; // Godziny
    extra_photo_docs?: boolean; // Dokumentacja zdjęciowa
}

const getFormIcon = (formName: string) => {
    const name = formName.toLowerCase();
    if (name.includes('luz')) return <Mountain size={14} />;
    if (name.includes('bela') || name.includes('bel')) return <Archive size={14} />;
    if (name.includes('bag') || name.includes('worek')) return <ShoppingBag size={14} />;
    if (name.includes('palet')) return <Layers size={14} />;
    return <Box size={14} />;
};

const KATEGORIE = [
    { nazwa: "Wszystko", ikona: "🌐" },
    { nazwa: "Folia", ikona: "🧻" },
    { nazwa: "Tworzywa", ikona: "♻️" },
    { nazwa: "Makulatura", ikona: "📄" },
    { nazwa: "Złom", ikona: "🔩" },
    { nazwa: "Drewno", ikona: "🪵" }
];

const getIcon = (material: string) => {
    const m = material.toLowerCase();
    if (m.includes('folia')) return '🧻';
    if (m.includes('tworzywa') || m.includes('pet') || m.includes('hdpe')) return '♻️';
    if (m.includes('makulatura') || m.includes('karton') || m.includes('gazeta')) return '📄';
    if (m.includes('złom') || m.includes('stal') || m.includes('miedź')) return '🔩';
    if (m.includes('drewno') || m.includes('palety')) return '🪵';
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

        // 1. Filtruj po kategorii
        if (aktywnyFiltr !== "Wszystko") {
            wyniki = wyniki.filter(o => o.material.toLowerCase().includes(aktywnyFiltr.toLowerCase()));
        }

        // 2. Filtruj po tekście (Zaktualizowane o wyszukiwanie po województwie!)
        if (szukanaFraza) {
            const fraza = szukanaFraza.toLowerCase();
            wyniki = wyniki.filter(o =>
                o.material.toLowerCase().includes(fraza) ||
                o.lokalizacja.toLowerCase().includes(fraza) ||
                (o.wojewodztwo && o.wojewodztwo.toLowerCase().includes(fraza))
            );
        }

        setFiltrowaneOferty(wyniki);
    }, [aktywnyFiltr, szukanaFraza, wszystkieOferty]);

    async function fetchOferty() {
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
                        {/* INTERAKTYWNY NAGŁÓWEK */}
                        <Link href="/" className="inline-block hover:scale-[1.02] active:scale-95 transition-transform">
                            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-slate-900 cursor-pointer">
                                Giełda <span className="text-blue-600">Surowców</span>
                            </h1>
                        </Link>
                        <p className="text-slate-400 font-bold mt-2 uppercase text-xs tracking-widest">
                            Rynek hurtowy B2B • {wszystkieOferty.length} aktywnych ofert
                        </p>
                    </div>
                    <Link href="/dodaj" className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 text-center uppercase tracking-tight flex items-center justify-center gap-2">
                        <span>+</span> Wystaw towar
                    </Link>
                </div>

                {/* WYSZUKIWARKA */}
                <div className="mb-6 relative group">
                    <input
                        type="text"
                        placeholder="Czego szukasz? (np. Karton, Warszawa...)"
                        className="w-full p-6 pl-16 bg-white rounded-3xl shadow-sm border border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-bold text-slate-700 outline-none text-lg placeholder:text-slate-300"
                        value={szukanaFraza}
                        onChange={(e) => setSzukanaFraza(e.target.value)}
                    />
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl opacity-50 group-focus-within:opacity-100 transition-opacity">🔍</span>
                </div>

                {/* FILTRY KATEGORII */}
                <div className="flex gap-3 overflow-x-auto pb-6 mb-2 no-scrollbar">
                    {KATEGORIE.map((kat) => (
                        <button
                            key={kat.nazwa}
                            onClick={() => setAktywnyFiltr(kat.nazwa)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap border-2 active:scale-95 ${aktywnyFiltr === kat.nazwa
                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                                : "bg-white border-transparent text-slate-500 hover:bg-white hover:border-slate-200 hover:text-slate-700 shadow-sm"
                                }`}
                        >
                            <span className="text-lg">{kat.ikona}</span>
                            <span className="text-sm tracking-tight">{kat.nazwa}</span>
                        </button>
                    ))}
                </div>

                {/* LISTA OFERT */}
                {loading ? (
                    <div className="text-center py-32">
                        <div className="inline-block animate-spin text-4xl mb-4">♻️</div>
                        <div className="font-black text-slate-300 text-xl uppercase tracking-widest">Ładowanie giełdy...</div>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filtrowaneOferty.map((o) => (
                            <Link href={`/rynek/${o.id}`} key={o.id} className="block bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 hover:border-blue-100 transition-all duration-300 group no-underline text-inherit">
                                <div className="flex flex-col md:flex-row h-full">

                                    {/* SEKCJA ZDJĘCIA */}
                                    <div className="w-full md:w-72 h-64 md:h-auto bg-slate-50 flex-shrink-0 relative overflow-hidden">
                                        {o.zdjecie_url ? (
                                            <img src={o.zdjecie_url} alt={o.material} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-8xl opacity-20 grayscale">
                                                {getIcon(o.material)}
                                            </div>
                                        )}

                                        {/* Badge Czasu */}
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-slate-700 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wide shadow-sm">
                                            🕒 {formatDistanceToNow(new Date(o.created_at), { addSuffix: true, locale: pl })}
                                        </div>

                                        {/* Badge Dokumentacji (jeśli jest) */}
                                        {o.extra_photo_docs && (
                                            <div className="absolute bottom-4 left-4 bg-green-500 text-white text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wide shadow-lg flex items-center gap-1">
                                                📸 Dokumentacja
                                            </div>
                                        )}
                                    </div>

                                    {/* SEKCJA TREŚCI */}
                                    <div className="p-6 md:p-8 flex-grow flex flex-col justify-between relative">

                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider">
                                                        📍 {o.lokalizacja}{o.wojewodztwo && `, ${o.wojewodztwo}`}
                                                    </span>
                                                    {o.form && (
                                                        <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider border border-blue-100 flex items-center gap-1.5">
                                                            {getFormIcon(o.form)}
                                                            {o.form}
                                                        </span>
                                                    )}
                                                </div>
                                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                                                    {o.material}
                                                </h2>
                                                {o.pickup_hours && (
                                                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                        🕒 Odbiór: {o.pickup_hours === '24h' ? 'Całodobowo' : o.pickup_hours}
                                                    </p>
                                                )}
                                            </div>

                                            {/* CENA I WAGA */}
                                            <div className="text-right bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[120px]">
                                                {o.cena > 0 ? (
                                                    <>
                                                        <p className="text-2xl font-black text-slate-900 leading-none mb-1">{o.cena} <span className="text-sm text-slate-400 font-bold">zł</span></p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cena za tonę</p>
                                                    </>
                                                ) : (
                                                    <p className="text-sm font-black text-slate-400 uppercase">Do negocjacji</p>
                                                )}

                                                <div className="w-full h-px bg-slate-200 my-3"></div>

                                                <p className="text-xl font-black text-blue-600 leading-none mb-1">{o.waga} <span className="text-sm text-blue-400">t</span></p>
                                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Ilość</p>
                                            </div>
                                        </div>

                                        {/* Przycisk zachęcający do kliknięcia */}
                                        <div className="mt-4 mb-2 flex justify-center">
                                            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-4 py-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center gap-2 shadow-sm">
                                                Zobacz szczegóły <ArrowRight size={14} />
                                            </span>
                                        </div>

                                        {/* STOPKA Z PRZYCISKIEM */}
                                        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                            <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">ID: #{o.id}</span>

                                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `tel:${o.telefon}`; }} className="bg-slate-900 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 active:scale-95 uppercase tracking-tight text-sm">
                                                <span>📞</span> Zadzwoń: {o.telefon}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {filtrowaneOferty.length === 0 && (
                            <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-200">
                                <p className="text-6xl mb-6 grayscale opacity-50">🏜️</p>
                                <p className="text-slate-900 font-black text-2xl uppercase tracking-tighter">Brak ofert</p>
                                <p className="text-slate-500 mt-2 font-medium">Zmień filtry lub bądź pierwszy i wystaw towar!</p>
                                <Link href="/dodaj" className="inline-block mt-6 text-blue-600 font-bold hover:underline">
                                    + Dodaj ogłoszenie
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}