'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    BarChart3, TrendingUp, Eye, Shield, LogOut,
    RefreshCw, MapPin, Sparkles, ArrowUpRight, ArrowDownRight, Minus, Home
} from 'lucide-react';

interface Stats {
    ogloszenia: {
        wszystkie: number;
        ostatnie7dni: number;
        aktywne: number;
        dodaneDzisiaj: number;
        dodaneWczoraj: number;
        dodaneOstatnie30dni: number;
        sprzedam: number;
        kupie: number;
    };
    ruch: {
        wyswietleniaWszystkie: number;
        wyswietleniaOstatnie30dni: number;
    };
    magicBox: {
        uzyte: number;
        procent: number;
    };
    topWojewodztwa: [string, number][];
}

const SESSION_KEY = 'admin_auth_recyklat';

export default function AdminDashboard() {
    const [haslo, setHaslo] = useState('');
    const [zalogowany, setZalogowany] = useState(false);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);
    const [blad, setBlad] = useState('');
    const [ostatnieOdswiezenie, setOstatnieOdswiezenie] = useState<Date | null>(null);

    // Sprawdź sesję przy załadowaniu
    useEffect(() => {
        const sesja = sessionStorage.getItem(SESSION_KEY);
        if (sesja === 'true') {
            setZalogowany(true);
        }
    }, []);

    const pobierzStatystyki = useCallback(async (pwd?: string) => {
        setLoading(true);
        setBlad('');
        try {
            const res = await fetch('/api/admin-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd || haslo }),
            });

            if (res.status === 401) {
                setBlad('Nieprawidłowe hasło.');
                setLoading(false);
                return false;
            }

            const data = await res.json();
            setStats(data);
            setOstatnieOdswiezenie(new Date());
            setLoading(false);
            return true;
        } catch {
            setBlad('Błąd połączenia z serwerem.');
            setLoading(false);
            return false;
        }
    }, [haslo]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await pobierzStatystyki(haslo);
        if (ok) {
            setZalogowany(true);
            sessionStorage.setItem(SESSION_KEY, 'true');
        }
    };

    const handleLogout = () => {
        setZalogowany(false);
        setStats(null);
        setHaslo('');
        sessionStorage.removeItem(SESSION_KEY);
    };

    const trend = (dzisiaj: number, wczoraj: number) => {
        if (wczoraj === 0 && dzisiaj === 0) return null;
        if (wczoraj === 0) return 'up';
        if (dzisiaj > wczoraj) return 'up';
        if (dzisiaj < wczoraj) return 'down';
        return 'same';
    };

    // Ekran logowania
    if (!zalogowany) {
        return (
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
                        <input
                            type="password"
                            placeholder="Hasło administratora"
                            value={haslo}
                            onChange={e => setHaslo(e.target.value)}
                            className="w-full bg-slate-800 border-2 border-slate-700 text-white p-4 rounded-2xl outline-none focus:border-blue-500 transition-colors font-bold placeholder:text-slate-500"
                            autoFocus
                        />
                        {blad && <p className="text-red-400 text-xs font-bold text-center">{blad}</p>}
                        <button
                            type="submit"
                            disabled={loading || !haslo}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            {loading ? 'Weryfikacja...' : 'Zaloguj'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Panel główny
    return (
        <div className="min-h-screen bg-slate-950 font-sans p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">

                {/* HEADER */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <BarChart3 size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-black text-xl tracking-tight">Panel Statystyk</h1>
                            {ostatnieOdswiezenie && (
                                <p className="text-slate-500 text-[10px] font-bold">
                                    Odświeżono: {ostatnieOdswiezenie.toLocaleTimeString('pl-PL')}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => pobierzStatystyki()}
                            disabled={loading}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Odśwież
                        </button>
                        <Link
                            href="/"
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            <Home size={14} />
                            Strona główna
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-red-300 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            <LogOut size={14} />
                            Wyloguj
                        </button>
                    </div>
                </div>

                {loading && !stats && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {stats && (
                    <div className="space-y-6">

                        {/* SEKCJA 1: DYNAMIKA OGŁOSZEŃ */}
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                <TrendingUp size={12} /> Dynamika ogłoszeń
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Wszystkie</p>
                                    <p className="text-white text-4xl font-black tracking-tighter">{stats.ogloszenia.wszystkie}</p>
                                    <p className="text-blue-400 text-[10px] font-bold mt-1">i rośnie 📈</p>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Ostatnie 7 dni</p>
                                    <p className="text-white text-4xl font-black tracking-tighter">{stats.ogloszenia.ostatnie7dni}</p>
                                    <p className="text-slate-500 text-[10px] font-bold mt-1">nowych ogłoszeń</p>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Dodane dziś</p>
                                    <div className="flex items-end gap-2">
                                        <p className="text-white text-4xl font-black tracking-tighter">{stats.ogloszenia.dodaneDzisiaj}</p>
                                        {trend(stats.ogloszenia.dodaneDzisiaj, stats.ogloszenia.dodaneWczoraj) === 'up' && <ArrowUpRight size={20} className="text-emerald-400 mb-1" />}
                                        {trend(stats.ogloszenia.dodaneDzisiaj, stats.ogloszenia.dodaneWczoraj) === 'down' && <ArrowDownRight size={20} className="text-red-400 mb-1" />}
                                        {trend(stats.ogloszenia.dodaneDzisiaj, stats.ogloszenia.dodaneWczoraj) === 'same' && <Minus size={20} className="text-slate-500 mb-1" />}
                                    </div>
                                    <p className="text-slate-500 text-[10px] font-bold mt-1">wczoraj: {stats.ogloszenia.dodaneWczoraj}</p>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Aktywne</p>
                                    <p className="text-emerald-400 text-4xl font-black tracking-tighter">{stats.ogloszenia.aktywne}</p>
                                    <p className="text-slate-500 text-[10px] font-bold mt-1">z {stats.ogloszenia.wszystkie} łącznie</p>
                                </div>
                            </div>
                        </div>

                        {/* SEKCJA 2: SPRZEDAM vs KUPIĘ + 30 DNI */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">Typ ogłoszeń</p>
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-emerald-400 text-2xl font-black">{stats.ogloszenia.sprzedam}</p>
                                        <p className="text-slate-500 text-[9px] font-black uppercase">Sprzedam</p>
                                    </div>
                                    <div className="w-px h-10 bg-slate-700" />
                                    <div>
                                        <p className="text-blue-400 text-2xl font-black">{stats.ogloszenia.kupie}</p>
                                        <p className="text-slate-500 text-[9px] font-black uppercase">Kupię</p>
                                    </div>
                                </div>
                                {/* Pasek proporcji */}
                                <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all"
                                        style={{ width: `${stats.ogloszenia.wszystkie ? (stats.ogloszenia.sprzedam / stats.ogloszenia.wszystkie) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Ostatnie 30 dni</p>
                                <p className="text-white text-4xl font-black tracking-tighter">{stats.ogloszenia.dodaneOstatnie30dni}</p>
                                <p className="text-slate-500 text-[10px] font-bold mt-1">nowych ogłoszeń</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Sparkles size={10} /> Magic Box
                                </p>
                                <p className="text-blue-400 text-4xl font-black tracking-tighter">{stats.magicBox.uzyte}</p>
                                <p className="text-slate-500 text-[10px] font-bold mt-1">{stats.magicBox.procent}% ogłoszeń używało</p>
                            </div>
                        </div>

                        {/* SEKCJA 3: RUCH */}
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Eye size={12} /> Ruch na stronie (wyświetlenia ogłoszeń)
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Łącznie wszystkich wyświetleń</p>
                                    <p className="text-white text-4xl font-black tracking-tighter">{stats.ruch.wyswietleniaWszystkie.toLocaleString('pl-PL')}</p>
                                    <p className="text-slate-500 text-[10px] font-bold mt-1">suma po wszystkich ogłoszeniach</p>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Wyświetlenia (ostatnie 30 dni)</p>
                                    <p className="text-white text-4xl font-black tracking-tighter">{stats.ruch.wyswietleniaOstatnie30dni.toLocaleString('pl-PL')}</p>
                                    <p className="text-slate-500 text-[10px] font-bold mt-1">nowych ogłoszeń z tego okresu</p>
                                </div>
                            </div>
                        </div>

                        {/* SEKCJA 4: TOP WOJEWÓDZTWA */}
                        {stats.topWojewodztwa.length > 0 && (
                            <div>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <MapPin size={12} /> Top 5 województw
                                </p>
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                                    {stats.topWojewodztwa.map(([woj, count], i) => {
                                        const max = stats.topWojewodztwa[0][1];
                                        const procent = Math.round((count / max) * 100);
                                        return (
                                            <div key={woj}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-slate-300 text-xs font-black uppercase flex items-center gap-2">
                                                        <span className="text-slate-600 font-black">{i + 1}.</span>
                                                        {woj}
                                                    </span>
                                                    <span className="text-white font-black text-sm">{count}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-600 rounded-full transition-all duration-700"
                                                        style={{ width: `${procent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* FOOTER */}
                        <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Shield size={10} /> Dane widoczne tylko dla administratora
                            </p>
                            <p className="text-slate-600 text-[10px] font-bold">
                                {new Date().toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
