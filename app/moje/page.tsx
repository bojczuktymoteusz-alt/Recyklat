'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Trash2, ArrowLeft, Package, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

interface Oferta {
    id: number;
    material: string;
    waga: number;
    lokalizacja: string;
    wojewodztwo?: string;
    created_at: string;
    status?: string;
}

export default function MojeOgłoszenia() {
    const [mojeOferty, setMojeOferty] = useState<Oferta[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        pobierzMojeOferty();
    }, []);

    async function pobierzMojeOferty() {
        setLoading(true);
        const zapisaneIds = JSON.parse(localStorage.getItem('moje_oferty') || '[]');

        if (zapisaneIds.length === 0) {
            setMojeOferty([]);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('oferty')
            .select('id, material, waga, lokalizacja, wojewodztwo, created_at, status')
            .in('id', zapisaneIds)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setMojeOferty(data);
        }
        setLoading(false);
    }

    // INTEGRACJA: Poprawiona funkcja oznaczania statusu
    async function oznaczJakoSprzedane(id: number) {
        const potwierdź = confirm("Czy na pewno chcesz oznaczyć ten towar jako SPRZEDANY? Oferta nie zniknie, ale zyska czerwony baner na giełdzie.");
        if (!potwierdź) return;

        const { error } = await supabase
            .from('oferty')
            .update({ status: 'sprzedane' }) // Kluczowy UPDATE w bazie
            .eq('id', id);

        if (error) {
            alert("Błąd bazy danych: " + error.message);
        } else {
            // Aktualizacja lokalnego stanu, aby UI zareagowało natychmiast
            setMojeOferty(prev => prev.map(o => o.id === id ? { ...o, status: 'sprzedane' } : o));
        }
    }

    async function usunOgłoszenie(id: number) {
        const potwierdź = confirm("Czy na pewno chcesz trwale usunąć to ogłoszenie z giełdy?");
        if (!potwierdź) return;

        const { error } = await supabase
            .from('oferty')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Błąd podczas usuwania: " + error.message);
        } else {
            setMojeOferty(mojeOferty.filter(o => o.id !== id));
            const zapisaneIds = JSON.parse(localStorage.getItem('moje_oferty') || '[]');
            const nowaLista = zapisaneIds.filter((oldId: number) => oldId !== id);
            localStorage.setItem('moje_oferty', JSON.stringify(nowaLista));
            alert("Ogłoszenie zostało usunięte.");
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/rynek" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm uppercase tracking-tight">
                        <ArrowLeft size={18} /> Powrót na rynek
                    </Link>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Moje Ogłoszenia</h1>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin inline-block mb-4 text-2xl">♻️</div>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Wczytuję Twoje oferty...</p>
                    </div>
                ) : mojeOferty.length > 0 ? (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 items-start mb-6">
                            <AlertCircle className="text-blue-500 shrink-0" size={20} />
                            <p className="text-blue-700 text-xs font-medium leading-relaxed">
                                To są ogłoszenia dodane z tego urządzenia. Możesz je usunąć lub oznaczyć jako sprzedane, aby nie otrzymywać więcej zapytań.
                            </p>
                        </div>

                        {mojeOferty.map((o) => (
                            <div key={o.id} className={`bg-white p-5 rounded-3xl border shadow-sm flex items-center justify-between group transition-all ${o.status === 'sprzedane' ? 'opacity-60 border-gray-200' : 'border-slate-100 hover:border-blue-200'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${o.status === 'sprzedane' ? 'bg-gray-100 text-gray-400' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-slate-900 leading-none uppercase tracking-tight">{o.material}</h3>
                                            {o.status === 'sprzedane' && (
                                                <span className="bg-gray-200 text-gray-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">Sprzedane</span>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 mt-1">
                                            {o.waga} t • {o.lokalizacja}{o.wojewodztwo ? `, ${o.wojewodztwo}` : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* PRZYCISK SPRZEDANE - Pojawia się tylko jeśli oferta jest aktywna */}
                                    {o.status !== 'sprzedane' && (
                                        <button
                                            onClick={() => oznaczJakoSprzedane(o.id)}
                                            className="p-3 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                            title="Oznacz jako sprzedane"
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                    )}
                                    <Link
                                        href={`/rynek/${o.id}`}
                                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        title="Zobacz na giełdzie"
                                    >
                                        <ExternalLink size={20} />
                                    </Link>
                                    <button
                                        onClick={() => usunOgłoszenie(o.id)}
                                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Usuń ogłoszenie"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                        <div className="text-5xl mb-4 opacity-20 grayscale">📦</div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Brak aktywnych ofert</h2>
                        <p className="text-slate-400 text-sm font-medium mt-2 mb-6">Nie dodałeś jeszcze żadnego towaru z tej przeglądarki.</p>
                        <Link href="/dodaj" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-sm shadow-lg hover:bg-blue-600 transition-all">
                            Dodaj pierwsze ogłoszenie
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}