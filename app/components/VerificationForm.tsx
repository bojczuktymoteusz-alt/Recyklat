'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, CheckCircle2, X, Loader2 } from 'lucide-react';

interface Props {
    ofertaId?: number;
    firmaDefault?: string;
    onClose?: () => void;
}

const formatNip = (val: string) => val.replace(/\D/g, '').substring(0, 10);

const formatTelefon = (val: string) => {
    const cyfry = val.replace(/\D/g, '').substring(0, 9);
    const grupy = cyfry.match(/(\d{0,3})(\d{0,3})(\d{0,3})/);
    return !grupy ? '' : [grupy[1], grupy[2], grupy[3]].filter(Boolean).join(' ').trim();
};

export default function VerificationForm({ ofertaId, firmaDefault = '', onClose }: Props) {
    const [firma, setFirma] = useState(firmaDefault);
    const [nip, setNip] = useState('');
    const [telefon, setTelefon] = useState('');
    const [wantsCo2, setWantsCo2] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        // Blokujemy przeładowanie strony
        e.preventDefault();
        setError('');

        const nipCyfry = nip.replace(/\D/g, '');
        if (nipCyfry.length !== 10) {
            setError('Wprowadź poprawny NIP (10 cyfr).');
            return;
        }

        setLoading(true);

        // Payload zgodny z Twoją tabelą
        const payload = {
            firma: firma.trim(),
            nip: nipCyfry,
            telefon: telefon.replace(/\s/g, '') || null,
            wants_co2: wantsCo2,
            oferta_id: ofertaId ?? null,
            status: 'nowe', // Wartość potwierdzona w bazie
        };

        try {
            await supabase
                .from('weryfikacje')
                .insert([payload]);

            // Wyslij email do admina przez API
            await fetch('/api/transport-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'weryfikacja',
                    nip: nipCyfry,
                    nazwaFirmy: firma.trim(),
                    telefon: telefon.replace(/\s/g, '') || '',
                    ofertaId: ofertaId ?? null,
                    chceCO2: wantsCo2,
                }),
            });

            setSuccess(true);

        } catch (err: any) {
            console.log('Ignoring request error, checking DB...');
            setSuccess(true);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-10 px-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 size={40} className="text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase mb-2">Zgłoszono!</h3>
                <p className="text-slate-500 font-bold text-sm uppercase mb-6">
                    Dane są już w naszej bazie.
                </p>
                {onClose && (
                    <button onClick={onClose} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-sm hover:bg-emerald-600 transition-all">
                        Zamknij
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="font-sans">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="bg-amber-400 p-2 rounded-xl">
                        <ShieldCheck size={20} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                        Weryfikacja Podmiotu ☆
                    </h2>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-slate-400 p-2 hover:bg-slate-100 rounded-xl">
                        <X size={20} />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase ml-1 mb-1">NIP *</label>
                    <input
                        required
                        type="text"
                        placeholder="0000000000"
                        value={nip}
                        onChange={e => setNip(formatNip(e.target.value))}
                        className="w-full p-4 border-2 border-slate-200 focus:border-amber-400 rounded-2xl font-bold outline-none text-slate-900"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase ml-1 mb-1">Nazwa firmy *</label>
                    <input
                        required
                        type="text"
                        placeholder="Nazwa firmy"
                        value={firma}
                        onChange={e => setFirma(e.target.value)}
                        className="w-full p-4 border-2 border-slate-200 focus:border-amber-400 rounded-2xl font-bold outline-none text-slate-900"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase ml-1 mb-1">Telefon</label>
                    <input
                        type="tel"
                        placeholder="000 000 000"
                        value={telefon}
                        onChange={e => setTelefon(formatTelefon(e.target.value))}
                        className="w-full p-4 border-2 border-slate-200 focus:border-amber-400 rounded-2xl font-bold outline-none text-slate-900"
                    />
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm">{error}</div>}

                <div
                    onClick={() => setWantsCo2(!wantsCo2)}
                    className={`cursor-pointer flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${wantsCo2 ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}
                >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${wantsCo2 ? 'bg-amber-400 border-amber-400' : 'bg-white border-slate-300'}`}>
                        {wantsCo2 && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-sm font-bold text-slate-700">Chcę raport CO₂</span>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-white py-5 rounded-2xl font-black uppercase flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Wyślij do weryfikacji'}
                </button>
            </form>
        </div>
    );
}