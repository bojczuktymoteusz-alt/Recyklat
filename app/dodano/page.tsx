'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

export default function UdaloSie() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(3);
    const tokenRef = useRef('');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Pobierz token i zapisz w ref (nie w state)
        const savedToken = localStorage.getItem('ostatni_token') || '';
        tokenRef.current = savedToken;

        // Posprzątaj magic_slug
        localStorage.removeItem('magic_slug');

        // Tick co sekundę
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Przekierowanie po 3s — osobny timer, poza setState
        const redirectTimer = setTimeout(() => {
            const dest = tokenRef.current
                ? `/zarzadzaj/${tokenRef.current}`
                : '/rynek';
            router.push(dest);
        }, 3000);

        return () => {
            clearInterval(interval);
            clearTimeout(redirectTimer);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center items-center p-6 font-sans">
            <div className="w-full max-w-md text-center flex flex-col items-center">

                {/* Ikona sukcesu */}
                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-green-200 rounded-full scale-[2] blur-2xl opacity-40 animate-pulse" />
                    <CheckCircle2 size={100} className="text-green-500 relative z-10 bg-white rounded-full shadow-lg" />
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">
                    Udało się!
                </h1>

                <p className="text-slate-500 font-bold mb-10 uppercase text-xs md:text-sm tracking-[0.2em]">
                    Twoja oferta jest już widoczna na giełdzie
                </p>

                {/* Countdown */}
                <div className="w-full bg-white border-2 border-slate-100 rounded-[28px] p-8 shadow-lg">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                        <span className="text-white font-black text-2xl">{countdown}</span>
                    </div>
                    <p className="text-slate-700 font-black text-sm uppercase tracking-widest mb-1">
                        Przekierowanie do panelu zarządzania...
                    </p>
                    <p className="text-slate-400 text-xs font-bold">
                        Znajdziesz tam link do oferty i opcje zarządzania
                    </p>
                </div>

            </div>
        </div>
    );
}
