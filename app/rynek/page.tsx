'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { MapPin, Search, ArrowRight, X, Ghost, Filter } from 'lucide-react';

const KATEGORIE = [
    "Wszystkie",
    "Folia LDPE (stretch)",
    "Folia kolorowa",
    "Tworzywa sztuczne (mix)",
    "Makulatura (karton)",
    "Makulatura (gazeta)",
    "Złom stalowy",
    "Złom kolorowy",
    "Drewno / Palety",
    "Inne"
];

export default function GieldaPage() {
    const [oferty, setOferty] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [szukaj, setSzukaj] = useState('');
    const [kategoria, setKategoria] = useState('Wszystkie');

    useEffect(() => {
        pobierzOferty();
    }, []);

    const pobierzOferty = async () => {
        const { data, error } = await supabase
            .from('oferty')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setOferty(data || []);
        setLoading(false);
    };

    const przefiltrowaneOferty = oferty.filter((o) => {
        const pasujeK = kategoria === 'Wszystkie' || o.material === kategoria;
        const tekst = szukaj.toLowerCase();
        const pasujeT = o.material.toLowerCase().includes(tekst) || o.lokalizacja.toLowerCase().includes(tekst);
        return pasujeK && pasujeT;
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* NOWY JASNY NAGŁÓWEK Z RECYKLAT */}
            <header className="bg-white border-b border-gray-100 p-6 sticky top-0 z-10 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-slate-900">
                            Recyklat <span className="text-blue-600">B2B</span>
                        </h1>
                        <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-widest">
                            Giełda Surowców • Rynek Hurtowy
                        </p>
                    </div>
                    <button onClick={() => { setLoading(true); pobierzOferty(); }} className="bg-gray-50 p-3 rounded-xl text-slate-400">
                        <Filter size={20} />
                    </button>
                </div>

                {/* WYSZUKIWARKA */}
                <div className="relative mb-4">
                    <input
                        type="text" placeholder="Szukaj (np. folia, Katowice)..."
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        value={szukaj} onChange={(e) => setSzukaj(e.target.value)}
                    />
                    <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                </div>

                {/* FILTRY */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {KATEGORIE.map((kat) => (
                        <button
                            key={kat} onClick={() => setKategoria(kat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all ${kategoria === kat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-gray-200'
                                }`}
                        >
                            {kat}
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-6 max-w-2xl mx-auto">
                {loading ? (
                    <div className="text-center py-20 animate-pulse text-slate-400 font-bold uppercase text-xs">Ładowanie...</div>
                ) : (
                    <div className="space-y-6">
                        {przefiltrowaneOferty.map((o) => (
                            <div key={o.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                <Link href={`/gielda/${o.id}`} className="absolute inset-0 z-10"></Link>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
                                        {o.zdjecie_url && <img src={o.zdjecie_url} className="w-full h-full object-cover" />}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{o.material}</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{o.lokalizacja}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                                    <div className="bg-blue-50 p-3 rounded-2xl"><p className="text-blue-700 font-black text-lg">{o.waga} t</p></div>
                                    <div className="bg-green-50 p-3 rounded-2xl"><p className="text-green-700 font-black text-lg">{o.cena || 'Nego'}</p></div>
                                </div>
                                <div className="flex justify-center">
                                    <span className="text-xs font-black uppercase text-blue-600 flex items-center gap-2">Szczegóły <ArrowRight size={14} /></span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Link href="/dodaj" className="fixed bottom-6 right-6 bg-slate-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-20 border-4 border-white text-2xl font-bold">+</Link>
        </div>
    );
}