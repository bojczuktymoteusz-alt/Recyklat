'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft, MapPin, Phone, Info, Truck, Building2,
    Clock, Mail, CheckCircle, FileText, Eye, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { wyglądaJakUrl, fixUrl, urlDoWyswietlenia } from '@/lib/ofertaUtils';

export default function SzczegolyOferty() {
    const { id } = useParams();
    const router = useRouter();
    const [oferta, setOferta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [czyToMoje, setCzyToMoje] = useState(false);

    useEffect(() => {
        const handleViews = async () => {
            if (!id) return;
            const sessionKey = `viewed_${id}`;
            if (!sessionStorage.getItem(sessionKey)) {
                try {
                    const { error } = await supabase.rpc('increment_views', { row_id: Number(id) });
                    if (!error) sessionStorage.setItem(sessionKey, 'true');
                } catch (e) { console.error('Błąd licznika:', e); }
            }
        };
        handleViews();
    }, [id]);

    useEffect(() => {
        async function fetchOferta() {
            if (!id) return;
            const { data, error } = await supabase
                .from('oferty')
                .select('id, title, material, waga, cena, lokalizacja, wojewodztwo, telefon, email, zdjecie_url, created_at, status, typ_oferty, bdo_code, impurity, form, certificates, logistics, pickup_hours, opis, extra_photo_docs, firma, website_url, wyswietlenia, category, material_type, color, param_mfi')
                .eq('id', id)
                .single();

            if (error) { router.push('/rynek'); return; }
            if (data) {
                setOferta(data);
                const mojeIds = JSON.parse(localStorage.getItem('moje_oferty') || '[]');
                if (mojeIds.includes(Number(id))) setCzyToMoje(true);
            }
            setLoading(false);
        }
        fetchOferta();
    }, [id, router]);

    const getImpurityLabel = (val: any) => {
        if (val === null || val === undefined) return 'Brak danych';
        const v = Number(val);
        if (v === 0) return '0% (Idealny)';
        if (v === 2) return 'Do 2% (Bardzo czysty)';
        if (v === 5) return 'Do 5% (Czysty)';
        if (v === 10) return 'Do 10% (Lekko zabrudzony)';
        if (v === 20) return 'Powyżej 10% (Zabrudzony)';
        if (v === 99) return 'Nie potrafię ocenić';
        return v + '%';
    };

    const getToken = (id: number) => {
        try { return JSON.parse(localStorage.getItem('oferty_tokeny') || '{}')[id] || null; }
        catch { return null; }
    };

    const usunOferte = async () => {
        const token = getToken(Number(id));
        if (!token) { alert('Brak tokenu.'); return; }
        if (!confirm('Czy na pewno chcesz TRWALE usunąć tę ofertę?')) return;
        const { data, error } = await supabase.rpc('delete_oferta_with_token', { oferta_id: Number(id), token });
        if (error || !data) { alert('Błąd lub nieprawidłowy token.'); return; }
        try {
            const tm = JSON.parse(localStorage.getItem('oferty_tokeny') || '{}');
            delete tm[Number(id)];
            localStorage.setItem('oferty_tokeny', JSON.stringify(tm));
            const ids = JSON.parse(localStorage.getItem('moje_oferty') || '[]');
            localStorage.setItem('moje_oferty', JSON.stringify(ids.filter((x: number) => x !== Number(id))));
        } catch { }
        router.push('/rynek');
    };

    const oznaczJakoZakonczone = async () => {
        const token = getToken(Number(id));
        if (!token) { alert('Brak tokenu.'); return; }
        if (!confirm('Oznaczyć jako sprzedane?')) return;
        const { data, error } = await supabase.rpc('update_oferta_status_with_token', { oferta_id: Number(id), token, new_status: 'sprzedane' });
        if (error || !data) { alert('Błąd lub nieprawidłowy token.'); return; }
        setOferta({ ...oferta, status: 'sprzedane' });
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-spin text-4xl">♻️</div>
        </div>
    );
    if (!oferta) return <div className="p-10 text-center font-black uppercase">Nie znaleziono oferty.</div>;

    const jestSprzedane = oferta.status === 'sprzedane';
    const wyswietlanyTytul = oferta.title || oferta.material;
    const jestZapotrzebowanie = oferta.typ_oferty === 'kupie';

    const extractBdoFromMaterial = (mat: string) => mat.match(/\b(\d{2}\s?\d{2}\s?\d{2})\b/)?.[1]?.trim() || null;
    const materialBez = (mat: string) => mat.replace(/\s*\(\d{2}\s?\d{2}\s?\d{2}\)\s*/g, '').trim();
    const wyswietlaneBdo = oferta.bdo_code || extractBdoFromMaterial(oferta.material || '');
    const czystyMaterial = materialBez(oferta.material || '');
    const normaliz = (s: string) => (s || '').toLowerCase().trim();
    const pokazForm = oferta.form && oferta.form !== 'Inne' &&
        normaliz(oferta.form) !== normaliz(czystyMaterial) &&
        normaliz(oferta.form) !== normaliz(oferta.material);
    const pokazCategory = oferta.category && oferta.category !== 'Inne' &&
        normaliz(oferta.category) !== normaliz(czystyMaterial) &&
        normaliz(oferta.category) !== normaliz(oferta.material) &&
        normaliz(oferta.category) !== normaliz(oferta.form);

    // ── LOGIKA WYSTAWCY ────────────────────────────────────────────────
    // maStrone = true jeśli website_url wygląda jak poprawna domena
    const maStrone = wyglądaJakUrl(oferta.website_url);
    const pelnyUrl = maStrone ? fixUrl(oferta.website_url) : '';
    const urlSkrocony = maStrone ? urlDoWyswietlenia(oferta.website_url) : '';

    // Firma: jest jeśli podano nazwę LUB poprawną domenę
    const maFirme = !!oferta.firma || maStrone;
    // Wyświetlana nazwa: albo wpisana firma, albo domena bez www/protokołu
    const nazwaWyswietlana = oferta.firma || urlSkrocony.split('/')[0];
    // ──────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">

            {/* NAVBAR */}
            <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/rynek" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-bold uppercase text-xs tracking-widest">
                        <ArrowLeft size={18} /><span>Powrót</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {czyToMoje && (
                            <>
                                {!jestSprzedane && (
                                    <button onClick={oznaczJakoZakonczone} className="text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">
                                        Zakończ ofertę
                                    </button>
                                )}
                                <button onClick={usunOferte} className="text-red-500 border border-red-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">
                                    Usuń
                                </button>
                            </>
                        )}
                        <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded">
                            <span className="text-[10px] text-gray-400 font-black uppercase">ID: #{oferta.id}</span>
                            {czyToMoje && (
                                <span className="text-[10px] text-blue-600 font-black flex items-center gap-1 border-l pl-2 border-gray-200 uppercase">
                                    <Eye size={12} /> {oferta.wyswietlenia || 0}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 w-full pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEWA KOLUMNA */}
                    <div className="space-y-6">

                        {/* ZDJĘCIE */}
                        <div className="aspect-square bg-white rounded-[40px] overflow-hidden border shadow-sm">
                            <img
                                src={oferta.zdjecie_url || (jestZapotrzebowanie ? '/placeholder-kupie.jpg' : '/placeholder-sprzedam.jpg')}
                                alt={wyswietlanyTytul || 'Oferta'}
                                onError={e => {
                                    const img = e.currentTarget;
                                    if (!img.src.includes('/placeholder-'))
                                        img.src = jestZapotrzebowanie ? '/placeholder-kupie.jpg' : '/placeholder-sprzedam.jpg';
                                }}
                                className={`w-full h-full object-contain p-8 ${jestSprzedane ? 'grayscale opacity-40' : ''}`}
                            />
                        </div>

                        {/* ── WYSTAWCA ─────────────────────────────────── */}
                        <div className="bg-white p-8 rounded-[40px] border shadow-sm border-l-8 border-l-blue-600">
                            <h3 className="font-black text-gray-500 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
                                <Building2 size={14} /> Wystawca
                            </h3>
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white font-black text-xl ${maFirme ? 'bg-blue-600' : 'bg-slate-700'}`}>
                                    {maFirme
                                        ? (oferta.firma ? oferta.firma[0].toUpperCase() : <Building2 size={24} />)
                                        : '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    {/* Nazwa — link jeśli jest strona, tekst jeśli nie */}
                                    {maFirme ? (
                                        maStrone ? (
                                            <a href={pelnyUrl} target="_blank" rel="noopener noreferrer"
                                                className="text-xl font-black text-blue-600 uppercase tracking-tighter hover:underline inline-flex items-center gap-1.5 leading-tight">
                                                {nazwaWyswietlana}
                                                <ExternalLink size={14} className="shrink-0" />
                                            </a>
                                        ) : (
                                            <p className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                                                {nazwaWyswietlana}
                                            </p>
                                        )
                                    ) : (
                                        <p className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                                            Ogłoszenie prywatne
                                        </p>
                                    )}

                                    {/* Podtytuł */}
                                    <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${maFirme ? 'text-blue-600' : 'text-slate-400'}`}>
                                        {maFirme ? 'Firma' : 'Użytkownik indywidualny'}
                                    </p>

                                    {/* URL pod nazwą (klikalny, nie przykryty) */}
                                    {maStrone && (
                                        <a href={pelnyUrl} target="_blank" rel="noopener noreferrer"
                                            className="text-[11px] text-slate-400 hover:text-blue-500 font-bold mt-0.5 truncate block transition-colors">
                                            {urlSkrocony}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* ─────────────────────────────────────────────── */}

                        {/* TYTUŁ I CENA */}
                        <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-6">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 leading-none">
                                {wyswietlanyTytul}
                            </h1>
                            <div className="flex flex-wrap gap-3 items-center pt-2">
                                <span className={`px-5 py-3 rounded-2xl text-2xl font-black ${jestZapotrzebowanie ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                    {oferta.cena > 0 ? `${oferta.cena} zł / t` : 'Cena do negocjacji'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 pt-4 border-t">
                                <MapPin size={24} className="text-blue-500 shrink-0" />
                                <div>
                                    <span className="font-black text-xl uppercase text-slate-900">{oferta.lokalizacja || 'Polska'}</span>
                                    {oferta.wojewodztwo && (
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Woj. {oferta.wojewodztwo}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PRAWA KOLUMNA */}
                    <div className="space-y-6">

                        {/* SZCZEGÓŁY TECHNICZNE */}
                        <div className="bg-white p-8 rounded-[40px] border shadow-sm">
                            <h3 className="font-black text-gray-500 mb-6 flex items-center gap-2 text-xs uppercase tracking-widest">
                                <Info size={14} /> Szczegóły techniczne
                            </h3>
                            <div className="mb-4 p-5 bg-blue-50 rounded-[24px] border border-blue-100">
                                <p className="text-[10px] uppercase font-black text-blue-500 mb-1">Rodzaj materiału</p>
                                <p className="font-black text-blue-700 text-lg uppercase">{czystyMaterial || oferta.material || 'Nieokreślony'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 rounded-[24px]">
                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Kod BDO</p>
                                    <p className="font-black text-slate-700 text-lg tracking-widest">{wyswietlaneBdo || '---'}</p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-[24px]">
                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Zanieczyszczenie</p>
                                    <p className="font-black text-slate-700 text-lg">{getImpurityLabel(oferta.impurity)}</p>
                                </div>
                            </div>
                            {pokazForm && (
                                <div className="mt-4 p-5 bg-slate-50 rounded-[24px]">
                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Postać surowca</p>
                                    <p className="font-black text-slate-700 text-lg uppercase">{oferta.form}</p>
                                </div>
                            )}
                            {(oferta.param_mfi || oferta.color || oferta.material_type || pokazCategory) && (
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    {oferta.param_mfi && (
                                        <div className="p-5 bg-emerald-50 rounded-[24px] border border-emerald-100">
                                            <p className="text-[10px] uppercase font-black text-emerald-500 mb-1">MFI (g/10min)</p>
                                            <p className="font-black text-emerald-700 text-lg">{oferta.param_mfi}</p>
                                        </div>
                                    )}
                                    {oferta.color && (
                                        <div className="p-5 bg-slate-50 rounded-[24px]">
                                            <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Kolor</p>
                                            <p className="font-black text-slate-700 text-lg uppercase">{oferta.color}</p>
                                        </div>
                                    )}
                                    {oferta.material_type && (
                                        <div className="p-5 bg-slate-50 rounded-[24px]">
                                            <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Typ materiału</p>
                                            <p className="font-black text-slate-700 text-lg uppercase">{oferta.material_type}</p>
                                        </div>
                                    )}
                                    {pokazCategory && (
                                        <div className="p-5 bg-slate-50 rounded-[24px]">
                                            <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Kategoria</p>
                                            <p className="font-black text-slate-700 text-lg uppercase">{oferta.category}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* LOGISTYKA */}
                        <div className="bg-white p-8 rounded-[40px] border shadow-sm">
                            <h3 className="font-black text-gray-500 mb-6 flex items-center gap-2 text-xs uppercase tracking-widest">
                                <Truck size={14} /> Logistyka
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[24px]">
                                    <Truck size={20} className="text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Transport</p>
                                        <p className="text-sm font-black text-slate-700">{oferta.logistics || 'Do ustalenia'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[24px]">
                                    <Clock size={20} className="text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Dostępność</p>
                                        <p className="text-sm font-black text-slate-700">{oferta.pickup_hours || 'Całodobowo'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DODATKOWE INFORMACJE */}
                        {oferta.opis && (
                            <div className="bg-white p-8 rounded-[40px] border shadow-sm border-l-8 border-l-emerald-500">
                                <h3 className="font-black text-gray-500 mb-6 flex items-center gap-2 text-xs uppercase tracking-widest">
                                    <FileText size={14} className="text-emerald-500" /> Dodatkowe informacje
                                </h3>
                                <div className="text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                                    {oferta.opis}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* DOLNY PASEK KONTAKTOWY */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 z-50">
                <div className="max-w-4xl mx-auto">
                    {jestSprzedane ? (
                        <div className="h-16 w-full bg-red-50 border-2 border-red-100 rounded-2xl flex items-center justify-center gap-3">
                            <CheckCircle size={24} className="text-red-600" />
                            <span className="text-red-600 font-black uppercase tracking-tighter text-xl">Ogłoszenie archiwalne</span>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <a href={`tel:${oferta.telefon}`}
                                className={`flex-1 rounded-[24px] h-16 flex items-center justify-center gap-3 font-black text-xl shadow-2xl active:scale-95 transition-all uppercase tracking-tight text-white ${jestZapotrzebowanie ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                                <Phone size={24} fill="currentColor" />
                                Zadzwoń: {oferta.telefon}
                            </a>
                            {oferta.email && (
                                <a href={`mailto:${oferta.email}?subject=Zapytanie o: ${wyswietlanyTytul}`}
                                    className={`px-8 font-black uppercase tracking-widest rounded-[24px] flex items-center justify-center gap-2 border-2 active:scale-95 transition-all ${jestZapotrzebowanie ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                    <Mail size={24} /><span>Napisz</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
