'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    BarChart3, TrendingUp, Eye, EyeOff, Shield, LogOut,
    RefreshCw, MapPin, Sparkles, ArrowUpRight, ArrowDownRight,
    Minus, Home, Phone, Zap, Package, Printer
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
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sesja = sessionStorage.getItem(SESSION_KEY);
        const pwd = sessionStorage.getItem(SESSION_KEY + '_pwd');
        if (sesja === 'true' && pwd) { setZalogowany(true); setZapisaneHaslo(pwd); }
    }, []);

    useEffect(() => {
        if (zalogowany && zapisaneHaslo && !stats) pobierzStatystyki(zapisaneHaslo);
    }, [zalogowany, zapisaneHaslo]);

    const pobierzStatystyki = useCallback(async (pwd?: string) => {
        setLoading(true); setBlad('');
        try {
            const res = await fetch('/api/admin-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd || haslo }),
            });
            if (res.status === 401) { setBlad('Nieprawidłowe hasło.'); setLoading(false); return false; }
            const data = await res.json();
            setStats(data);
            setOstatnieOdswiezenie(new Date());
            setLoading(false);
            return true;
        } catch { setBlad('Błąd połączenia z serwerem.'); setLoading(false); return false; }
    }, [haslo]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await pobierzStatystyki(haslo);
        if (ok) {
            setZalogowany(true); setZapisaneHaslo(haslo);
            sessionStorage.setItem(SESSION_KEY, 'true');
            sessionStorage.setItem(SESSION_KEY + '_pwd', haslo);
        }
    };

    const handleLogout = () => {
        setZalogowany(false); setStats(null); setHaslo(''); setZapisaneHaslo('');
        sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY + '_pwd');
    };

    const handleDrukuj = () => window.print();

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

    return (
        <div className="min-h-screen bg-slate-950 font-sans p-4 sm:p-8 print:bg-white print:p-6">
            <div className="max-w-5xl mx-auto" ref={panelRef}>

                {/* HEADER — ekran */}
                <div className="flex items-center justify-between mb-8 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <BarChart3 size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-black text-xl tracking-tight">Panel Statystyk — Recyklat.pl</h1>
                            {ostatnieOdswiezenie && (
                                <p className="text-slate-500 text-[10px] font-bold">
                                    Odświeżono: {ostatnieOdswiezenie.toLocaleTimeString('pl-PL')}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => pobierzStatystyki()} disabled={loading}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Odśwież
                        </button>
                        <button onClick={handleDrukuj}
                            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                            <Printer size={14} /> Generuj raport skuteczności
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

                {/* HEADER — druk */}
                <div className="hidden print:block mb-8 pb-4 border-b-2 border-slate-300">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Raport Analityczny Giełdy
                    </h1>
                    <p className="text-slate-500 text-sm font-bold mt-1">Data: {dataRaportu}</p>
                </div>

                {loading && !stats && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {stats && (
                    <div className="space-y-8">

                        {/* ZAKŁADKI — tylko na ekranie */}
                        <div className="flex gap-2 bg-slate-900 p-1 rounded-2xl print:hidden">
                            <button
                                onClick={() => setAktywnaZakladka('leady')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                                    aktywnaZakladka === 'leady'
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Phone size={13} /> Moje ogłoszenia i leady
                            </button>
                            <button
                                onClick={() => setAktywnaZakladka('rynek')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                                    aktywnaZakladka === 'rynek'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <TrendingUp size={13} /> Rynek i giełda
                            </button>
                        </div>

                        {/* ══════════════════════════════════════════
                            ZAKŁADKA: LEADY I KONTAKTY
                        ══════════════════════════════════════════ */}
                        {(aktywnaZakladka === 'leady' || typeof window === 'undefined') && (
                            <div className={aktywnaZakladka !== 'leady' ? 'print:block hidden' : ''}>

                                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 print:text-slate-700">
                                    <Phone size={12} /> Leady i Kontakty — Pobrania numeru telefonu
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                                    {/* GLOWNY LICZNIK */}
                                    <div className="bg-slate-900 border border-emerald-800 rounded-2xl p-5 sm:col-span-2 print:border-slate-300 print:bg-white">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 print:text-slate-400">
                                            <Phone size={10} /> Łącznie kliknięć &quot;Pokaż numer&quot;
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

                                    {/* DZIS */}
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
                                        <p className="text-slate-500 text-[10px] font-bold mt-1">osób oglądających dzwoni</p>
                                    </div>
                                </div>

                                {/* TOP SUROWCE */}
                                {stats.topSurowce.length > 0 && (
                                    <div className="mt-6">
                                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 print:text-slate-700">
                                            <Package size={12} /> Czego szukają klienci — top surowce wg kliknięć
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
                        )}

                        {/* ══════════════════════════════════════════
                            ZAKŁADKA: RYNEK I GIEŁDA
                        ══════════════════════════════════════════ */}
                        {(aktywnaZakladka === 'rynek' || typeof window === 'undefined') && (
                            <div className={aktywnaZakladka !== 'rynek' ? 'print:block hidden' : ''}>

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

                                {/* TOP WOJEWÓDZTWA — z paskami postępu */}
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
                        )}

                        {/* FOOTER — ekran i druk */}
                        <div className="border-t border-slate-800 pt-4 flex items-center justify-between print:border-slate-300 print:mt-8">
                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 print:text-slate-400">
                                <Shield size={10} /> Dane poufne — tylko dla administratora
                            </p>
                            <p className="text-slate-600 text-[10px] font-bold print:text-slate-400">{dataRaportu}</p>
                        </div>

                        {/* STOPKA RAPORTU — tylko przy druku */}
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
