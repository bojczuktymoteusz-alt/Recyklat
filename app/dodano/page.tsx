'use client';
import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Search, PlusCircle } from 'lucide-react';

export default function UdałoSię() {
    return (
        <div className="min-h-screen bg-white flex justify-center items-center p-6">
            <div className="w-full max-w-md text-center flex flex-col items-center">

                {/* Ikona sukcesu z animacją */}
                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-green-100 rounded-full scale-150 blur-xl opacity-50 animate-pulse"></div>
                    <CheckCircle2 size={100} className="text-green-500 relative z-10" />
                </div>

                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">
                    Udało się!
                </h1>

                <p className="text-slate-500 font-bold mb-12 uppercase text-xs tracking-[0.2em]">
                    Twoja oferta jest już widoczna na giełdzie
                </p>

                {/* Przyciski akcji */}
                <div className="w-full space-y-4">
                    <Link
                        href="/rynek"
                        className="flex items-center justify-between w-full bg-slate-900 text-white p-6 rounded-[24px] font-black uppercase tracking-tight shadow-xl active:scale-95 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <Search size={20} />
                            <span>Zobacz na giełdzie</span>
                        </div>
                        <ArrowRight size={20} />
                    </Link>

                    <Link
                        href="/dodaj"
                        className="flex items-center justify-center w-full bg-blue-50 text-blue-600 p-6 rounded-[24px] font-black uppercase tracking-tight active:scale-95 transition-all gap-3"
                    >
                        <PlusCircle size={20} />
                        <span>Dodaj kolejną</span>
                    </Link>
                </div>

                {/* Opcjonalny powrót do panelu zarzadzania */}
                <Link
                    href="/moje-oferty"
                    className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] hover:text-slate-500 transition-colors"
                >
                    Zarządzaj swoimi ofertami
                </Link>

            </div>
        </div>
    );
}