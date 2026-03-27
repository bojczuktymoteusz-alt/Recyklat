'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Trash2, CheckCircle, ArrowLeft, Package, AlertTriangle,
    ShieldAlert, Calendar, MapPin, Tag
} from 'lucide-react';

export default function ZarzadzajOferta() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [oferta, setOferta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            pobierzOferte();
        }
    }, [token]);

    async function pobierzOferte() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('oferty')
                .select('*')
                .eq('manage_token', token)
                .single(); // Pobieramy tylko jeden rekord

            if (error) throw error;
            if (data) setOferta(data);
        } catch (err: any) {
            console.error('Błąd pobierania oferty:', err);
            setError('Nie znaleziono ogłoszenia lub link jest nieprawidłowy.');
        } finally {
            setLoading(false);
        }
    }

    async function oznaczJakoSprzedane() {
        const potwierdz = confirm("Czy na pewno chcesz oznaczyć ten towar jako ZAKOŃCZONY/SPRZEDANY? Otrzyma czerwoną etykietę na giełdzie.");
        if (!potwierdz) return;

        const { data, error } = await supabase.rpc('update_oferta_status_with_token', {
            oferta_id: oferta.id,
            token,
            new_status: 'sprzedane'
        });

        if (error || !data) {
            alert("Błąd lub nieprawidłowy token.");
        } else {
            setOferta({ ...oferta, status: 'sprzedane' });
        }
    }

    async function usunOgłoszenie() {
        const potwierdz = confirm("UWAGA! Czy na pewno chcesz trwale usunąć to ogłoszenie z bazy? Tej akcji nie można cofnąć.");
        if (!potwierdz) return;

        const { data, error } = await supabase.rpc('delete_oferta_with_token', {
            oferta_id: oferta.id,
            token
        });

        if (error || !data) {
            alert("Błąd lub nieprawidłowy token.");
        } else {
            router.push('/rynek');
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Weryfikacja tokena...</p>
            </div>
        );
    }

    if (error || !oferta) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-12 rounded-[32px] shadow-2xl max-w-lg text-center border-4 border-white">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Błąd dostępu</h1>
                    <p className="text-slate-500 font-bold mb-8 uppercase text-xs tracking-widest leading-relaxed">
                        {error} Link mógł stracić ważność lub ogłoszenie zostało już usunięte.
                    </p>
                    <Link href="/rynek" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95">
                        <ArrowLeft size={20} /> Wróć na giełdę
                    </Link>
                </div>
            </div>
        );
    }

    const jestSprzedane = oferta.status === 'sprzedane';

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans pb-32">
            <div className="max-w-3xl mx-auto">

                {/* NAGŁÓWEK */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/rynek" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-black text-[10px] uppercase tracking-[0.2em]">
                        <ArrowLeft size={16} /> Wróć
                    </Link>
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-xl">
                        <ShieldAlert size={16} />
                        <span className="font-black text-[10px] uppercase tracking-widest">Prywatny Panel Zarządzania</span>
                    </div>
                </div>

                {/* KARTA OGŁOSZENIA */}
                <div className={`bg-white rounded-[40px] shadow-2xl border-4 p-8 sm:p-12 mb-8 transition-all relative overflow-hidden ${jestSprzedane ? 'border-slate-200' : 'border-white'}`}>

                    {jestSprzedane && (
                        <div className="absolute top-8 right-8 bg-red-100 text-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 border-red-200 rotate-3">
                            Zakończone / Sprzedane
                        </div>
                    )}

                    <div className="flex items-center gap-4 mb-8">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${jestSprzedane ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                            <Package size={32} />
                        </div>
                        <div>
                            <h1 className={`text-2xl sm:text-4xl font-black uppercase tracking-tighter leading-none mb-2 ${jestSprzedane ? 'text-slate-400' : 'text-slate-900'}`}>
                                {oferta.title || oferta.material}
                            </h1>
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                                <Tag size={14} /> ID Ogłoszenia: #{oferta.id}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <div className="bg-slate-50 p-4 rounded-2xl">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cena</span>
                            <span className={`block text-lg font-black ${jestSprzedane ? 'text-slate-400' : 'text-slate-900'}`}>{oferta.cena} zł/t</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ilość</span>
                            <span className={`block text-lg font-black ${jestSprzedane ? 'text-slate-400' : 'text-slate-900'}`}>{oferta.waga} t</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl col-span-2">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lokalizacja</span>
                            <span className={`block text-lg font-black flex items-center gap-1 ${jestSprzedane ? 'text-slate-400' : 'text-slate-900'}`}>
                                <MapPin size={16} /> {oferta.lokalizacja} {oferta.wojewodztwo && `(${oferta.wojewodztwo})`}
                            </span>
                        </div>
                    </div>

                    {/* AKCJE B2B */}
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 border-b-2 border-slate-100 pb-4">Zarządzaj statusem</h2>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {!jestSprzedane && (
                            <button
                                onClick={oznaczJakoSprzedane}
                                className="flex-1 flex items-center justify-center gap-3 bg-green-500 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-200 hover:bg-green-600 active:scale-95 transition-all"
                            >
                                <CheckCircle size={24} /> Oznacz jako Sprzedane
                            </button>
                        )}

                        <button
                            onClick={usunOgłoszenie}
                            className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 border-2 ${!jestSprzedane
                                    ? 'bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                                    : 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-200 hover:bg-red-600'
                                }`}
                        >
                            <Trash2 size={24} /> Usuń Ofertę Trwale
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}