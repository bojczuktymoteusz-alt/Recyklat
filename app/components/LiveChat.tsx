'use client';
import React, { useState } from 'react';
import { MessageCircle, X, PhoneCall, Mail } from 'lucide-react';

export default function LiveChat() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end font-sans">

            {/* OKIENKO "CZATU" (POJAWIA SIĘ PO KLIKNIĘCIU) */}
            {isOpen && (
                <div className="mb-4 w-72 sm:w-80 bg-white rounded-[32px] shadow-2xl border-4 border-white overflow-hidden transform origin-bottom-right transition-all animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="bg-blue-600 p-5 text-white flex justify-between items-center shadow-inner">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                            <span className="font-black tracking-widest uppercase text-xs">Kontakt B2B</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-blue-700 hover:rotate-90 p-1.5 rounded-full transition-all"
                        >
                            <X size={18} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="p-8 text-center bg-slate-50">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-4 shadow-inner">
                            <PhoneCall size={28} strokeWidth={2.5} />
                        </div>

                        <h3 className="text-slate-900 font-black text-xl uppercase tracking-tighter mb-2">
                            Porozmawiajmy!
                        </h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed mb-6">
                            I Załatwmy sprawę od ręki
                        </p>

                        <div className="space-y-3">
                            {/* PRZYCISK 1: TELEFON */}
                            <a
                                href="tel:667887562"
                                className="block w-full bg-slate-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm hover:bg-blue-600 active:scale-95 transition-all shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-2 group"
                            >
                                <PhoneCall size={18} className="group-hover:animate-bounce" />
                                667 887 562
                            </a>

                            {/* PRZYCISK 2: E-MAIL (WYŚWIETLA ADRES) */}
                            <a
                                href="mailto:kontakt@recyklat.pl?subject=Zapytanie z platformy Recyklat B2B"
                                className="w-full bg-white text-slate-700 border-2 border-slate-200 py-3 px-4 rounded-2xl hover:border-slate-300 hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center justify-start gap-4 group cursor-pointer"
                            >
                                <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-blue-100 transition-colors">
                                    <Mail size={18} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
                                </div>
                                <div className="flex flex-col items-start text-left">

                                    <span className="text-sm font-bold lowercase tracking-normal text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
                                        kontakt@recyklat.pl
                                    </span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* JEDEN SPRĘŻYSTY PRZYCISK (FAB) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`bg-blue-600 text-white pr-6 pl-5 py-5 rounded-[24px] shadow-2xl hover:shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-3 group ${!isOpen ? 'animate-bounce' : ''}`}
            >
                {isOpen ? (
                    <X size={32} strokeWidth={2.5} className="transition-transform duration-300 rotate-90 group-hover:rotate-0" />
                ) : (
                    <>
                        <div className="relative">
                            <MessageCircle size={32} strokeWidth={2.5} className="group-hover:-rotate-12 transition-transform duration-300" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600 animate-pulse"></div>
                        </div>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-0.5">To nie bot</span>
                            <span className="text-sm font-black uppercase tracking-tighter whitespace-nowrap">Żywy kons.</span>
                        </div>
                    </>
                )}
            </button>
        </div>
    );
}