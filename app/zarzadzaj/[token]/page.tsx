'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Trash2, CheckCircle, ArrowLeft, Package, AlertTriangle,
    ShieldAlert, MapPin, Tag, Key, Link2, Copy, Star, Send
} from 'lucide-react';

export default function ZarzadzajOferta() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [oferta, setOferta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [baseUrl, setBaseUrl] = useState('');

    // Kopiowanie linków
    const [skopiowanoEdycja, setSkopiowanoEdycja] = useState(false);
    const [skopiowanoOferta, setSkopiowanoOferta] = useState(false);

    // Weryfikacja
    const [nip, setNip] = useState('');
    const [nazwaFirmy, setNazwaFirmy] = useState('');
    const [telefonWer, setTelefonWer] = useState('');
    const [wysylanie, setWysylanie] = useState(false);
    const [wyslanoPomyslnie, setWyslanoPomyslnie] = useState(false);
    const [bladWeryfikacji, setBladWeryfikacji] = useState('');
    const [chceCO2, setChceCO2] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
        if (token) pobierzOferte();
    }, [token]);

    async function pobierzOferte() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('oferty')
                .select('*')
                .eq('manage_token', token)
                .single();
            if (error) throw error;
            if (data) setOferta(data);
        } catch (err: any) {
            setError('Nie znaleziono ogłoszenia lub link jest nieprawidłowy.');
        } finally {
            setLoading(false);
        }
    }

    const kopiujLinkEdycja = () => {
        navigator.clipboard.writeText(`${baseUrl}/zarzadzaj/${token}`);
        setSkopiowanoEdycja(true);
        setTimeout(() => setSkopiowanoEdycja(false), 2500);
    };

    const kopiujLinkOferty = () => {
        if (!oferta) return;
        navigator.clipboard.writeText(`${baseUrl}/rynek/${oferta.id}`);
        setSkopiowanoOferta(true);
        setTimeout(() => setSkopiowanoOferta(false), 2500);
    };

    async function oznaczJakoSprzedane() {
        if (!confirm("Czy na pewno chcesz oznaczyć ten towar jako ZAKOŃCZONY/SPRZEDANY?")) return;
        const { data, error } = await supabase.rpc('update_oferta_status_with_token', {
            oferta_id: oferta.id, token, new_status: 'sprzedane'
        });
        if (error || !data) alert("Błąd lub nieprawidłowy token.");
        else setOferta({ ...oferta, status: 'sprzedane' });
    }

    async function usunOgłoszenie() {
        if (!confirm("UWAGA! Czy na pewno chcesz trwale usunąć to ogłoszenie? Tej akcji nie można cofnąć.")) return;
        const { data, error } = await supabase.rpc('delete_oferta_with_token', {
            oferta_id: oferta.id, token
        });
        if (error || !data) alert("Błąd lub nieprawidłowy token.");
        else router.push('/rynek');
    }

    async function wyslijWeryfikacje(e: React.FormEvent) {
        e.preventDefault();
        if (!nip.trim() || !nazwaFirmy.trim()) {
            setBladWeryfikacji('Wypełnij NIP i Nazwę Firmy.');
            return;
        }
        setWysylanie(true);
        setBladWeryfikacji('');

        const { error } = await supabase
            .from('oferty')
            .update({
                nip: nip.trim(),
                firma: nazwaFirmy.trim(),
                telefon: telefonWer.trim() || oferta.telefon,
                wants_co2_report: chceCO2,
            })
            .eq('manage_token', token);

        // Zapisz do tabeli weryfikacje
        await supabase.from('weryfikacje').insert([{
            oferta_id: oferta.id,
            firma: nazwaFirmy.trim(),
            nip: nip.trim(),
            telefon: telefonWer.trim() || oferta.telefon,
            wants_co2: chceCO2,
        }]);

        setWysylanie(false);
        if (error) {
            setBladWeryfikacji('Błąd zapisu. Spróbuj ponownie.');
        } else {
            setWyslanoPomyslnie(true);
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Weryfikacja tokena...</p>
        </div>
    );

    if (error || !oferta) return (
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

    const jestSprzedane = oferta.status === 'sprzedane';

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans pb-20">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* NAGŁÓWEK */}
                <div className="flex items-center justify-between">
                    <Link href="/rynek" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-black text-[10px] uppercase tracking-[0.2em]">
                        <ArrowLeft size={16} /> Wróć
                    </Link>
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-xl">
                        <ShieldAlert size={14} />
                        <span className="font-black text-[10px] uppercase tracking-widest">Prywatny Panel Zarządzania</span>
                    </div>
                </div>

                {/* INFO O OGŁOSZENIU */}
                <div className={`bg-white rounded-[32px] border-2 p-6 ${jestSprzedane ? 'border-slate-200' : 'border-white shadow-lg'}`}>
                    {jestSprzedane && (
                        <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-red-100 mb-4">
                            Zakończone / Sprzedane
                        </div>
                    )}
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${jestSprzedane ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                            <Package size={28} />
                        </div>
                        <div>
                            <h1 className={`text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none mb-1 ${jestSprzedane ? 'text-slate-400' : 'text-slate-900'}`}>
                                {oferta.title || oferta.material}
                            </h1>
                            <p className="text-slate-400 font-bold text-xs flex items-center gap-1.5">
                                <Tag size={12} /> ID: #{oferta.id}
                                {oferta.lokalizacja && <><MapPin size={12} className="ml-2" />{oferta.lokalizacja}</>}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cena</span>
                            <span className="block font-black text-slate-900">{oferta.cena > 0 ? `${oferta.cena} zł/t` : 'Negocjacja'}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ilość</span>
                            <span className="block font-black text-slate-900">{oferta.waga > 0 ? `${oferta.waga} t` : '—'}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status</span>
                            <span className={`block font-black ${jestSprzedane ? 'text-red-500' : 'text-emerald-600'}`}>
                                {jestSprzedane ? 'Zakończone' : 'Aktywne'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* PRZYCISKI LINKÓW */}
                <div className="bg-white rounded-[32px] border-2 border-white shadow-lg p-6 space-y-3">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Linki do ogłoszenia</h2>

                    <button
                        onClick={kopiujLinkEdycja}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-95 ${skopiowanoEdycja ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${skopiowanoEdycja ? 'bg-emerald-500' : 'bg-slate-900'}`}>
                            {skopiowanoEdycja ? <CheckCircle size={20} className="text-white" /> : <Key size={20} className="text-white" />}
                        </div>
                        <div className="text-left flex-1">
                            <p className="font-black text-slate-900 text-sm">
                                {skopiowanoEdycja ? '✓ Skopiowano!' : '🔑 Zapisz link do EDYCJI (dla Ciebie)'}
                            </p>
                            <p className="text-slate-400 text-[10px] font-bold truncate">{baseUrl}/zarzadzaj/{token.substring(0, 16)}...</p>
                        </div>
                        <Copy size={16} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                        onClick={kopiujLinkOferty}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-95 ${skopiowanoOferta ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-200 bg-slate-50 hover:bg-blue-50'}`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${skopiowanoOferta ? 'bg-blue-500' : 'bg-blue-600'}`}>
                            {skopiowanoOferta ? <CheckCircle size={20} className="text-white" /> : <Link2 size={20} className="text-white" />}
                        </div>
                        <div className="text-left flex-1">
                            <p className="font-black text-slate-900 text-sm">
                                {skopiowanoOferta ? '✓ Skopiowano!' : '🔗 Kopiuj link do OFERTY (dla klienta)'}
                            </p>
                            <p className="text-slate-400 text-[10px] font-bold">{baseUrl}/rynek/{oferta.id}</p>
                        </div>
                        <Copy size={16} className="text-slate-400 shrink-0" />
                    </button>

                    <p className="text-slate-400 text-[10px] font-bold text-center pt-1 leading-relaxed">
                        Link z kluczykiem zachowaj dla siebie. Link ze spinaczem wyślij kontrahentowi (np. na WhatsApp).
                    </p>
                </div>

                {/* ZARZĄDZAJ STATUSEM */}
                <div className="bg-white rounded-[32px] border-2 border-white shadow-lg p-6">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Zarządzaj statusem</h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {!jestSprzedane && (
                            <button
                                onClick={oznaczJakoSprzedane}
                                className="flex-1 flex items-center justify-center gap-3 bg-emerald-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all text-sm"
                            >
                                <CheckCircle size={20} /> Oznacz jako Sprzedane
                            </button>
                        )}
                        <button
                            onClick={usunOgłoszenie}
                            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 border-2 text-sm ${!jestSprzedane
                                ? 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                                : 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                                }`}
                        >
                            <Trash2 size={20} /> Usuń Ofertę Trwale
                        </button>
                    </div>
                </div>

                {/* STREFA WIARYGODNOŚCI */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[32px] border-2 border-amber-100 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-md shadow-amber-200">
                            <Star size={20} className="text-white fill-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900 text-base tracking-tight">
                                Zdobądź status Zweryfikowanego Podmiotu ⭐
                            </h2>
                        </div>
                    </div>

                    <p className="text-slate-600 text-sm font-medium leading-relaxed mb-5">
                        Firmy ze statusem weryfikacji sprzedają towar średnio <strong>3x szybciej</strong>. Podaj dane, abyśmy mogli potwierdzić Twój profil B2B.
                    </p>

                    {wyslanoPomyslnie ? (
                        <div className="bg-white rounded-2xl p-5 border border-emerald-200 text-center">
                            <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                            <p className="font-black text-slate-900 text-sm uppercase tracking-widest">Prośba wysłana!</p>
                            <p className="text-slate-500 text-xs font-bold mt-1">Skontaktujemy się z Tobą w ciągu 24h.</p>
                        </div>
                    ) : (
                        <form onSubmit={wyslijWeryfikacje} className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">NIP *</label>
                                <input
                                    type="text"
                                    placeholder="np. 1234567890"
                                    value={nip}
                                    onChange={e => setNip(e.target.value.replace(/\D/g, '').substring(0, 10))}
                                    className="w-full p-4 bg-white border-2 border-amber-100 focus:border-amber-400 rounded-2xl outline-none font-bold text-slate-900 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Nazwa Firmy *</label>
                                <input
                                    type="text"
                                    placeholder="np. Recykling Sp. z o.o."
                                    value={nazwaFirmy}
                                    onChange={e => setNazwaFirmy(e.target.value)}
                                    className="w-full p-4 bg-white border-2 border-amber-100 focus:border-amber-400 rounded-2xl outline-none font-bold text-slate-900 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Telefon kontaktowy</label>
                                <input
                                    type="tel"
                                    placeholder="np. 600 123 456"
                                    value={telefonWer}
                                    onChange={e => setTelefonWer(e.target.value)}
                                    className="w-full p-4 bg-white border-2 border-amber-100 focus:border-amber-400 rounded-2xl outline-none font-bold text-slate-900 transition-colors"
                                />
                            </div>
                            {bladWeryfikacji && (
                                <p className="text-red-500 text-xs font-bold pl-1">{bladWeryfikacji}</p>
                            )}

                            {/* CHECKBOX CO2 */}
                            <label className="flex items-start gap-3 p-4 bg-white/70 rounded-2xl border-2 border-amber-100 hover:border-amber-300 cursor-pointer transition-all group">
                                <div className="relative mt-0.5 shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={chceCO2}
                                        onChange={e => setChceCO2(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${chceCO2
                                        ? 'bg-amber-400 border-amber-400'
                                        : 'bg-white border-amber-300 group-hover:border-amber-400'
                                        }`}>
                                        {chceCO2 && (
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="font-black text-slate-800 text-sm leading-snug">
                                        Chcę otrzymać bezpłatny, szacunkowy raport oszczędności CO₂ dla tego ogłoszenia.
                                    </p>
                                    <p className="text-amber-700/70 text-[11px] font-bold mt-1 leading-relaxed">
                                        Nasz analityk przygotuje dla Ciebie dane o unikniętej emisji, które możesz wykorzystać w rozmowach z kontrahentami.
                                    </p>
                                </div>
                            </label>

                            <button
                                type="submit"
                                disabled={wysylanie}
                                className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white p-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-amber-100"
                            >
                                <Send size={16} />
                                {wysylanie ? 'Wysyłanie...' : 'Wyślij a my zweryfikujemy'}
                            </button>
                        </form>
                    )}
                </div>

            </div>
        </div>
    );
}
