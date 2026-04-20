'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    BarChart3, TrendingUp, Eye, EyeOff, Shield, LogOut,
    RefreshCw, MapPin, Sparkles, ArrowUpRight, ArrowDownRight,
    Minus, Home, Phone, Zap, Package, Printer, Search, X
} from 'lucide-react';

interface Stats {
    ogloszenia: {
        wszystkie: number; ostatnie7dni: number; aktywne: number;
        dodaneDzisiaj: number; dodaneWczoraj: number; dodaneOstatnie30dni: number;
        sprzedam: number; kupie: number;
    };
    ruch: { wyswietleniaWszystkie: number; wyswietleniaOstatnie30dni: number; };
    klikniecia: {
        wszystkie: number; firmy: number; goscie: number;
        dzisiaj: number; wczoraj: number; ctr: number;
    };
    magicBox: { uzyte: number; procent: number; oszczednoscGodzin: number; oszczednoscMinut: number; };
    topWojewodztwa: [string, number][];
    topSurowce: [string, number][];
    filtr: { ofertaId: number; tytul: string } | null;
}

const SESSION_KEY = 'admin_auth_recyklat';

function Karta({ tytul, wartosc, podtytul, kolor = 'slate', ikona }: {
    tytul: string; wartosc: string | number; podtytul?: string;
    kolor?: 'slate' | 'emerald' | 'blue' | 'amber';
    ikona?: React.ReactNode;
}) {
    const kolorMap: Record<string, string> = {
        slate: 'text-white', emerald: 'text-emerald-400',
        blue: 'text-blue-400', amber: 'text-amber-400',
    };
    const borderMap: Record<string, string> = {
        slate: 'border-slate-800', emerald: 'border-emerald-800',
        blue: 'border-blue-900', amber: 'border-amber-800',
    };
    return (
        <div className={`bg-slate-900 border ${borderMap[kolor]} rounded-2xl p-5 print:border-slate-300 print:bg-white`}>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 print:text-slate-400">
                {ikona}{tytul}
            </p>
            <p className={`text-4xl font-black tracking-tighter ${kolorMap[kolor]} print:text-slate-900`}>{wartosc}</p>
            {podtytul && <p className="text-slate-500 text-[10px] font-bold mt-1 print:text-slate-400">{podtytul}</p>}
        </div>
    );
}

function PasekPostepu({ procent, kolor = 'blue' }: { procent: number; kolor?: 'blue' | 'emerald' }) {
    return (
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden print:bg-slate-200">
            <div
                className={`h-full rounded-full transition-all duration-700 ${kolor === 'emerald' ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${procent}%` }}
            />
        </div>
    );
}

export default function AdminDashboard() {
    const [haslo, setHaslo] = useState('');
    const [pokazHaslo, setPokazHaslo] = useState(false);
    const [zalogowany, setZalogowany] = useState(false);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);
    const [blad, setBlad] = useState('');
    const [ostatnieOdswiezenie, setOstatnieOdswiezenie] = useState<Date | null>(null);
    const [zapisaneHaslo, setZapisaneHaslo] = useState('');
    const [aktywnaZakladka, setAktywnaZakladka] = useState<'leady' | 'rynek'>('leady');

    // Filtr raportu
    const [filterId, setFilterId] = useState('');
    const [filterIdRoboczy, setFilterIdRoboczy] = useState(''); // to co user wpisuje

    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sesja = sessionStorage.getItem(SESSION_KEY);
        const pwd = sessionStorage.getItem(SESSION_KEY + '_pwd');
        if (sesja === 'true' && pwd) { setZalogowany(true); setZapisaneHaslo(pwd); }
    }, []);

    useEffect(() => {
        if (zalogowany && zapisaneHaslo && !stats) pobierzStatystyki(zapisaneHaslo, null);
    }, [zalogowany, zapisaneHaslo]);

    const pobierzStatystyki = useCallback(async (pwd?: string, ofertaIdFilter?: string | null) => {
        setLoading(true); setBlad('');
        try {
            const res = await fetch('/api/admin-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: pwd || zapisaneHaslo,
                    ofertaIdFilter: ofertaIdFilter || null,
                }),
            });
            if (res.status === 401) { setBlad('Nieprawidłowe hasło.'); setLoading(false); return false; }
            const data = await res.json();
            setStats(data);
            setOstatnieOdswiezenie(new Date());
            setLoading(false);
            return true;
        } catch { setBlad('Błąd połączenia z serwerem.'); setLoading(false); return false; }
    }, [zapisaneHaslo]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await pobierzStatystyki(haslo, null);
        if (ok) {
            setZalogowany(true); setZapisaneHaslo(haslo);
            sessionStorage.setItem(SESSION_KEY, 'true');
            sessionStorage.setItem(SESSION_KEY + '_pwd', haslo);
        }
    };

    const handleLogout = () => {
        setZalogowany(false); setStats(null); setHaslo(''); setZapisaneHaslo('');
        setFilterId(''); setFilterIdRoboczy('');
        sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY + '_pwd');
    };

    // Generuj raport — z filtrem lub bez
    const handleGenerujRaport = async () => {
        const id = filterIdRoboczy.trim();
        setFilterId(id);
        await pobierzStatystyki(zapisaneHaslo, id || null);
        // Krótkie opóźnienie na render, potem drukuj
        setTimeout(() => window.print(), 600);
    };

    // Wyczyść filtr
    const handleClearFilter = () => {
        setFilterId('');
        setFilterIdRoboczy('');
        pobierzStatystyki(zapisaneHaslo, null);
    };

    const trend = (a: number, b: number) => {
        if (a === 0 && b === 0) return null;
        if (b === 0) return 'up';
        if (a > b) return 'up'; if (a < b) return 'down'; return 'same';
    };

    // Ekran logowania
    if (!zalogowany) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-sm">
                <div className="flex items-center gap-3 mb-10 justify-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Shield size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="text-white font-black text-lg tracking-tight">Recyklat Admin</p>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Panel statystyk</p>
                    </div>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <input
                            type={pokazHaslo ? 'text' : 'password'}
                            placeholder="Hasło administratora"
                            value={haslo}
                            onChange={e => { setHaslo(e.target.value); setBlad(''); }}
                            className="w-full bg-slate-800 border-2 border-slate-700 text-white p-4 pr-12 rounded-2xl outline-none focus:border-blue-500 font-bold placeholder:text-slate-500"
                            autoFocus
                        />
                        <button type="button" onClick={() => setPokazHaslo(p => !p)} tabIndex={-1}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                            {pokazHaslo ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {blad && (
                        <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-center">
                            <p className="text-red-400 text-xs font-bold">{blad}</p>
                            <p className="text-red-600 text-[10px] mt-1">Sprawdź zmienne środowiskowe Vercel</p>
                        </div>
                    )}
                    <button type="submit" disabled={loading || !haslo}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95">
                        {loading ? 'Weryfikacja...' : 'Zaloguj'}
                    </button>
                </form>
            </div>
        </div>
    );

    const dataRaportu = new Date().toLocaleDateString('pl-PL', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Tytuł raportu — zbiorczy lub dedykowany
    const tytulRaportu = stats?.filtr
        ? `Raport Skuteczności Oferty: ${stats.filtr.tytul} (ID: ${stats.filtr.ofertaId})`
        : 'Raport Analityczny Giełdy — Recyklat.pl';

    return (
        <div className="min-h-screen bg-slate-950 font-sans p-4 sm:p-8 print:bg-white print:p-6">
            <div className="max-w-5xl mx-auto" ref={panelRef}>

                {/* ── HEADER (ekran) ─────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <BarChart3 size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-black text-xl tracking-tight">Panel Statystyk — Recyklat.pl</h1>
                            {ostatnieOdswiezenie && (
                                <p className="text-slate-500 text-[10px] font-bold">
                                    Odświeżono: {ostatnieOdswiezenie.toLocaleTimeString('pl-PL')}
                                    {filterId && <span className="ml-2 text-blue-400">· Filtr: ID #{filterId}</span>}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => pobierzStatystyki(zapisaneHaslo, filterId || null)} disabled={loading}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Odśwież
                        </button>
                        <Link href="/" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                            <Home size={14} /> Strona
                        </Link>
                        <button onClick={handleLogout}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-red-300 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                            <LogOut size={14} /> Wyloguj
                        </button>
                    </div>
                </div>

                {/* ── PANEL GENEROWANIA RAPORTU (tylko admin, ekran) ── */}
                <div className="print:hidden mb-6 bg-slate-900 border border-slate-700 rounded-2xl p-5">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Printer size={12} className="text-blue-400" />
                        Generuj Raport Skuteczności — tylko dla administratora
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Input ID */}
                        <div className="relative flex-1">
                            <input
                                type="number"
                                placeholder="ID ogłoszenia (puste = raport zbiorczy całej giełdy)"
                                value={filterIdRoboczy}
                                onChange={e => setFilterIdRoboczy(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleGenerujRaport()}
                                className="w-full bg-slate-800 border-2 border-slate-600 focus:border-blue-500 text-white placeholder:text-slate-500 font-bold text-sm px-4 py-3 rounded-xl outline-none pr-10"
                            />
                            {filterIdRoboczy && (
                                <button onClick={() => setFilterIdRoboczy('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Przycisk generuj */}
                        <button
                            onClick={handleGenerujRaport}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap active:scale-95"
                        >
                            <Printer size={14} />
                            {filterIdRoboczy.trim()
                                ? `Raport dla ID #${filterIdRoboczy}`
                                : 'Raport zbiorczy'}
                        </button>

                        {/* Wyczyść filtr (jeśli aktywny) */}
                        {filterId && (
                            <button onClick={handleClearFilter}
                                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap">
                                <X size={14} /> Wyczyść filtr
                            </button>
                        )}
                    </div>

                    {/* Podpowiedź co będzie w raporcie */}
                    <p className="text-slate-600 text-[10px] font-bold mt-2">
                        {filterIdRoboczy.trim()
                            ? `Raport dedykowany: dane o kliknięciach tylko dla ogłoszenia #${filterIdRoboczy}. Statystyki rynku pozostają jako tło.`
                            : 'Raport zbiorczy: pełne dane giełdy — dynamika, województwa, leady łącznie.'}
                    </p>
                </div>

                {/* ── AKTYWNY FILTR — baner informacyjny (ekran) ─── */}
                {filterId && stats?.filtr && (
                    <div className="print:hidden mb-4 flex items-center gap-3 bg-blue-950 border border-blue-800 rounded-xl px-4 py-3">
                        <Search size={14} className="text-blue-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-blue-300 text-xs font-black uppercase tracking-widest">Filtr aktywny — Oferta #{stats.filtr.ofertaId}</p>
                            <p className="text-blue-400 text-[11px] font-bold truncate">{stats.filtr.tytul}</p>
                        </div>
                        <button onClick={handleClearFilter} className="text-blue-500 hover:text-blue-300 shrink-0">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* ── HEADER DRUKU ───────────────────────────────── */}
                <div className="hidden print:block mb-8 pb-4 border-b-2 border-slate-300">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                        {tytulRaportu}
                    </h1>
                    <p className="text-slate-500 text-sm font-bold mt-1">Data wygenerowania: {dataRaportu}</p>
                    {stats?.filtr && (
                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 inline-block">
                            <p className="text-blue-700 text-xs font-black uppercase tracking-widest">
                                Raport dedykowany — dane kliknięć tylko dla tej oferty
                            </p>
                        </div>
                    )}
                </div>

                {loading && !stats && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {stats && (
                    <div className="space-y-8">

                        {/* ZAKŁADKI (ekran) */}
                        <div className="flex gap-2 bg-slate-900 p-1 rounded-2xl print:hidden">
                            <button onClick={() => setAktywnaZakladka('leady')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                                    aktywnaZakladka === 'leady' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                }`}>
                                <Phone size={13} />
                                {stats.filtr ? `Leady — Oferta #${stats.filtr.ofertaId}` : 'Leady i Kontakty'}
                            </button>
                            <button onClick={() => setAktywnaZakladka('rynek')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                                    aktywnaZakladka === 'rynek' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                }`}>
                                <TrendingUp size={13} /> Rynek i giełda
                            </button>
                        </div>

                        {/* ══════════════════════════════════════════
                            SEKCJA: LEADY I KONTAKTY
                            Przy filtrze — tylko dla danej oferty
                        ══════════════════════════════════════════ */}
                        <div className={aktywnaZakladka !== 'leady' ? 'hidden print:block' : ''}>

                            {/* Nagłówek sekcji — różny dla raportu zbiorczego i dedykowanego */}
                            <div className="mb-3">
                                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 print:text-slate-700">
                                    <Phone size={12} />
                                    {stats.filtr
                                        ? `Zainteresowanie Telefonem — Oferta: ${stats.filtr.tytul}`
                                        : 'Zainteresowanie Telefonem — cała giełda'}
                                </p>
                                {stats.filtr && (
                                    <p className="text-slate-500 text-[10px] font-bold mt-0.5">
                                        ID: #{stats.filtr.ofertaId} · Dane kliknięć tylko dla tej oferty
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {/* Główny licznik */}
                                <div className="bg-slate-900 border border-emerald-800 rounded-2xl p-5 sm:col-span-2 print:border-slate-300 print:bg-white">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 print:text-slate-400">
                                        <Phone size={10} /> Zainteresowanie Telefonem
                                    </p>
                                    <p className="text-emerald-400 text-5xl font-black tracking-tighter print:text-slate-900">
                                        {stats.klikniecia.wszystkie}
                                    </p>
                                    <div className="mt-3 flex items-center gap-6">
                                        <div>
                                            <p className="text-slate-400 text-[9px] uppercase font-black">Firmy (zalogowani)</p>
                                            <p className="text-blue-400 text-xl font-black print:text-blue-700">{stats.klikniecia.firmy}</p>
                                        </div>
                                        <div className="w-px h-8 bg-slate-700" />
                                        <div>
                                            <p className="text-slate-400 text-[9px] uppercase font-black">Goście (zewnętrzni)</p>
                                            <p className="text-emerald-400 text-xl font-black print:text-emerald-700">{stats.klikniecia.goscie}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dziś */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 print:border-slate-300 print:bg-white">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 print:text-slate-400">Dziś</p>
                                    <div className="flex items-end gap-2">
                                        <p className="text-white text-4xl font-black tracking-tighter print:text-slate-900">{stats.klikniecia.dzisiaj}</p>
                                        {trend(stats.klikniecia.dzisiaj, stats.klikniecia.wczoraj) === 'up' && <ArrowUpRight size={20} className="text-emerald-400 mb-1" />}
                                        {trend(stats.klikniecia.dzisiaj, stats.klikniecia.wczoraj) === 'down' && <ArrowDownRight size={20} className="text-red-400 mb-1" />}
                                        {trend(stats.klikniecia.dzisiaj, stats.klikniecia.wczoraj) === 'same' && <Minus size={20} className="text-slate-500 mb-1" />}
                                    </div>
                                    <p className="text-slate-500 text-[10px] font-bold mt-1">wczoraj: {stats.klikniecia.wczoraj}</p>
                                </div>

                                {/* CTR */}
                                <div className="bg-slate-900 border border-blue-900 rounded-2xl p-5 print:border-slate-300 print:bg-white">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 print:text-slate-400">CTR Kontaktu</p>
                                    <p className="text-blue-400 text-4xl font-black tracking-tighter print:text-blue-700">{stats.klikniecia.ctr}%</p>
                                    <p className="text-slate-500 text-[10px] font-bold mt-1">
                                        {stats.filtr ? 'odsłon → kliknięcia tel.' : 'osób oglądających dzwoni'}
                                    </p>
                                </div>
                            </div>

                            {/* TOP SUROWCE wg kliknięć */}
                            {stats.topSurowce.length > 0 && (
                                <div className="mt-6">
                                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 print:text-slate-700">
                                        <Package size={12} />
                                        {stats.filtr ? 'Zainteresowanie tą ofertą — kliknięcia' : 'Czego szukają klienci — top surowce wg kliknięć'}
                                    </p>
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 print:border-slate-300 print:bg-white">
                                        {stats.topSurowce.map(([surowiec, count], i) => (
                                            <div key={surowiec}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-slate-300 text-xs font-black flex items-center gap-2 print:text-slate-700">
                                                        <span className="text-emerald-500 w-4">{i + 1}.</span>
                                                        <span className="truncate max-w-[200px]">{surowiec}</span>
                                                    </span>
                                                    <span className="text-emerald-400 font-black text-sm print:text-slate-900">{count} klik.</span>
                                                </div>
                                                <PasekPostepu procent={Math.round((count / stats.topSurowce[0][1]) * 100)} kolor="emerald" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ══════════════════════════════════════════
                            SEKCJA: RYNEK I GIEŁDA
                            Zawsze dane zbiorcze — tło rynkowe
                        ══════════════════════════════════════════ */}
                        <div className={aktywnaZakladka !== 'rynek' ? 'hidden print:block' : ''}>

                            {/* Baner "tło rynku" przy raporcie dedykowanym */}
                            {stats.filtr && (
                                <div className="mb-4 hidden print:block bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                    <p className="text-slate-600 text-xs font-black uppercase tracking-widest">
                                        Twoja oferta na tle rynku — dane zbiorcze całej giełdy
                                    </p>
                                    <p className="text-slate-400 text-[10px] font-bold mt-0.5">
                                        Poniższe statystyki dotyczą wszystkich ogłoszeń — stanowią kontekst rynkowy dla Twojej oferty.
                                    </p>
                                </div>
                            )}

                            {/* DYNAMIKA OGŁOSZEŃ */}
                            <div className="mb-6">
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 print:text-slate-700">
                                    <TrendingUp size={12} /> Dynamika ogłoszeń
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <Karta tytul="Wszystkie" wartosc={stats.ogloszenia.wszystkie} podtytul="i rośnie 📈" kolor="blue" ikona={<BarChart3 size={10} />} />
                                    <Karta tytul="Ostatnie 7 dni" wartosc={stats.ogloszenia.ostatnie7dni} podtytul="nowych ogłoszeń" />
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 print:border-slate-300 print:bg-white">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 print:text-slate-400">Dodane dziś</p>
                                        <div className="flex items-end gap-2">
                                            <p className="text-white text-4xl font-black tracking-tighter print:text-slate-900">{stats.ogloszenia.dodaneDzisiaj}</p>
                                            {trend(stats.ogloszenia.dodaneDzisiaj, stats.ogloszenia.dodaneWczoraj) === 'up' && <ArrowUpRight size={20} className="text-emerald-400 mb-1" />}
                                            {trend(stats.ogloszenia.dodaneDzisiaj, stats.ogloszenia.dodaneWczoraj) === 'down' && <ArrowDownRight size={20} className="text-red-400 mb-1" />}
                                            {trend(stats.ogloszenia.dodaneDzisiaj, stats.ogloszenia.dodaneWczoraj) === 'same' && <Minus size={20} className="text-slate-500 mb-1" />}
                                        </div>
                                        <p className="text-slate-500 text-[10px] font-bold mt-1 print:text-slate-400">wczoraj: {stats.ogloszenia.dodaneWczoraj}</p>
                                    </div>
                                    <Karta tytul="Aktywne" wartosc={stats.ogloszenia.aktywne} podtytul={`z ${stats.ogloszenia.wszystkie} łącznie`} kolor="emerald" />
                                </div>
                            </div>

                            {/* MAGIC BOX */}
                            <div className="mb-6">
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 print:text-slate-700">
                                    <Sparkles size={12} /> Magic Box AI — oszczędność czasu
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <Karta tytul="Użycia Magic Box" wartosc={stats.magicBox.uzyte} podtytul={`${stats.magicBox.procent}% ogłoszeń używało AI`} kolor="blue" ikona={<Sparkles size={10} />} />
                                    <div className="bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-800 rounded-2xl p-5 print:border-slate-300 print:bg-white">
                                        <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1 print:text-slate-500">
                                            <Zap size={10} /> Oszczędność czasu użytkowników
                                        </p>
                                        <p className="text-white text-4xl font-black tracking-tighter print:text-slate-900">
                                            {stats.magicBox.oszczednoscGodzin < 1
                                                ? `${stats.magicBox.oszczednoscMinut} min`
                                                : `${stats.magicBox.oszczednoscGodzin} h`}
                                        </p>
                                        <p className="text-blue-400 text-[10px] font-bold mt-1 print:text-slate-400">
                                            AI zaoszczędziło ({stats.magicBox.uzyte} × 3 min)
                                        </p>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 print:border-slate-300 print:bg-white">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 print:text-slate-400">Typ ogłoszeń</p>
                                        <div className="flex items-center gap-4">
                                            <div><p className="text-emerald-400 text-2xl font-black">{stats.ogloszenia.sprzedam}</p><p className="text-slate-500 text-[9px] font-black uppercase">Sprzedam</p></div>
                                            <div className="w-px h-10 bg-slate-700" />
                                            <div><p className="text-blue-400 text-2xl font-black">{stats.ogloszenia.kupie}</p><p className="text-slate-500 text-[9px] font-black uppercase">Kupię</p></div>
                                        </div>
                                        <div className="mt-3">
                                            <PasekPostepu procent={stats.ogloszenia.wszystkie ? Math.round((stats.ogloszenia.sprzedam / stats.ogloszenia.wszystkie) * 100) : 0} kolor="emerald" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TOP WOJEWÓDZTWA */}
                            {stats.topWojewodztwa.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 print:text-slate-700">
                                        <MapPin size={12} /> Top 5 województw
                                    </p>
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 print:border-slate-300 print:bg-white">
                                        {stats.topWojewodztwa.map(([woj, count], i) => {
                                            const max = stats.topWojewodztwa[0][1];
                                            const procent = Math.round((count / max) * 100);
                                            return (
                                                <div key={woj}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-slate-300 text-xs font-black flex items-center gap-2 print:text-slate-700">
                                                            <span className="text-slate-500 w-5 font-black">{i + 1}.</span>
                                                            {woj}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-400 text-[10px] font-bold">{procent}%</span>
                                                            <span className="text-white font-black text-sm print:text-slate-900">{count}</span>
                                                        </div>
                                                    </div>
                                                    <PasekPostepu procent={procent} kolor="blue" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* RUCH OGÓLNY */}
                            <div>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 print:text-slate-700">
                                    <Eye size={12} /> Ruch ogólny (wyświetlenia ogłoszeń)
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <Karta tytul="Łącznie wyświetleń" wartosc={stats.ruch.wyswietleniaWszystkie.toLocaleString('pl-PL')} podtytul="suma po wszystkich ogłoszeniach" kolor="blue" ikona={<Eye size={10} />} />
                                    <Karta tytul="Ostatnie 30 dni" wartosc={stats.ruch.wyswietleniaOstatnie30dni.toLocaleString('pl-PL')} podtytul="ogłoszeń z tego okresu" />
                                    <Karta tytul="Nowe (30 dni)" wartosc={stats.ogloszenia.dodaneOstatnie30dni} podtytul="dodanych ogłoszeń" kolor="emerald" />
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="border-t border-slate-800 pt-4 flex items-center justify-between print:border-slate-300 print:mt-8">
                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 print:text-slate-400">
                                <Shield size={10} /> Dane poufne — tylko dla administratora
                            </p>
                            <p className="text-slate-600 text-[10px] font-bold print:text-slate-400">{dataRaportu}</p>
                        </div>
                        <div className="hidden print:block text-center pt-4 border-t border-slate-200">
                            <p className="text-slate-400 text-xs font-bold">
                                Wygenerowano automatycznie przez System AI Giełdy Recyklat.pl
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
