'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Search, PlusCircle, Copy, ShieldAlert } from 'lucide-react';

export default function UdaloSie() {
    const [token, setToken] = useState('');
    const [skopiowano, setSkopiowano] = useState(false);
    const [skopiowanoSlug, setSkopiowanoSlug] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');
    const [slug, setSlug] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
        const savedToken = localStorage.getItem('ostatni_token');
        if (savedToken) setToken(savedToken);

        const savedSlug = localStorage.getItem('magic_slug');
        if (savedSlug) {
            setSlug(savedSlug);
            localStorage.removeItem('magic_slug');
        }
    }, []);

    const pelnyLink = `${baseUrl}/zarzadzaj/${token}`;

    const kopiujLink = () => {
        navigator.clipboard.writeText(pelnyLink);
        setSkopiowano(true);
        setTimeout(() => setSkopiowano(false), 3000); // Reset napisu po 3 sekundach
    };

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center items-center p-6 font-sans">
            <div className="w-full max-w-lg text-center flex flex-col items-center">

                {/* Ikona sukcesu z animacją */}
                <div className="mb-8 relative mt-10">
                    <div className="absolute inset-0 bg-green-200 rounded-full scale-[2] blur-2xl opacity-40 animate-pulse"></div>
                    <CheckCircle2 size={100} className="text-green-500 relative z-10 bg-white rounded-full shadow-lg" />
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">
                    Udało się!
                </h1>

                <p className="text-slate-500 font-bold mb-10 uppercase text-xs md:text-sm tracking-[0.2em]">
                    Twoja oferta jest już widoczna na giełdzie
                </p>

                {/* 👇 MIĘSISTY BOX Z PRYWATNYM LINKIEM */}
                {token && (
                    <div className="w-full bg-red-50 border-4 border-red-500 rounded-[32px] p-6 mb-10 text-left shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-3 mb-3">
                            <ShieldAlert className="text-red-600 shrink-0" size={28} />
                            <h2 className="text-xl font-black text-red-600 uppercase tracking-tighter">Zapisz ten link!</h2>
                        </div>
                        <p className="text-red-900 font-bold text-xs uppercase tracking-widest mb-4 leading-relaxed opacity-80">
                            Tylko za pomocą tego linku będziesz mógł usunąć lub zakończyć ofertę z innego urządzenia.
                        </p>

                        <div className="bg-white rounded-2xl p-2 pl-4 flex items-center justify-between border-2 border-red-200 gap-2">
                            <code className="text-slate-900 font-black text-[10px] md:text-xs truncate flex-1 select-all">
                                {pelnyLink.replace(/^https?:\/\//, '')} {/* Usuwamy http:// dla estetyki */}
                            </code>
                            <button
                                onClick={kopiujLink}
                                className={`shrink-0 px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 shadow-md active:scale-95 ${skopiowano ? 'bg-green-500 text-white shadow-green-200' : 'bg-slate-900 text-white hover:bg-red-600'
                                    }`}
                            >
                                {skopiowano ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                <span className="hidden sm:inline">{skopiowano ? 'Skopiowano' : 'Kopiuj'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* SLUG — pokazujemy jeśli był używany Magic Box */}
                {slug && (
                    <div className="w-full bg-slate-900 rounded-[24px] p-5 mb-6 text-left">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Przyjazny URL ogłoszenia (SEO)</p>
                        <div className="flex items-center gap-3">
                            <code className="text-emerald-400 text-xs font-bold flex-1 truncate">
                                recyklat.pl/oferta/{slug}
                            </code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${baseUrl}/oferta/${slug}`);
                                    setSkopiowanoSlug(true);
                                    setTimeout(() => setSkopiowanoSlug(false), 2000);
                                }}
                                className={`shrink-0 px-3 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 ${
                                    skopiowanoSlug ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                {skopiowanoSlug ? '✓ OK' : 'Kopiuj'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Przyciski akcji */}
                <div className="w-full space-y-4">
                    <Link
                        href="/rynek"
                        className="flex items-center justify-between w-full bg-slate-900 text-white p-6 rounded-[24px] font-black uppercase tracking-tight shadow-xl hover:bg-blue-600 active:scale-95 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <Search size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                            <span>Zobacz na giełdzie</span>
                        </div>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                        href="/dodaj"
                        className="flex items-center justify-center w-full bg-white border-2 border-slate-200 text-slate-600 p-6 rounded-[24px] font-black uppercase tracking-tight active:scale-95 hover:border-slate-300 hover:bg-slate-50 transition-all gap-3 shadow-sm"
                    >
                        <PlusCircle size={20} className="text-slate-400" />
                        <span>Dodaj kolejną</span>
                    </Link>
                </div>

                <Link
                    href="/moje"
                    className="mt-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-slate-900 transition-colors"
                >
                    Zarządzaj swoimi ofertami
                </Link>

            </div>
        </div>
    );
}