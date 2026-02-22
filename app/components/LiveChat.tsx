'use client';
import React, { useState } from 'react';
import { MessageCircle, X, PhoneCall } from 'lucide-react';

export default function LiveChat() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end font-sans">

            {/* OKIENKO "CZATU" */}
            {isOpen && (
                <div className="mb-4 w-72 sm:w-80 bg-white rounded-[32px] shadow-2xl border-4 border-white overflow-hidden transform origin-bottom-right transition-all animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="bg-blue-600 p-5 text-white flex justify-between items-center shadow-inner">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                            <span className="font-black tracking-widest uppercase text-xs">Czat Żywy</span>
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
                            Wiemy, że nikt nie lubi rozmawiać z botami. Po prostu zadzwoń, załatwmy to od ręki!
                        </p>

                        <a
                            href="tel:667887562"
                            className="block w-full bg-slate-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm hover:bg-blue-600 active:scale-95 transition-all shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-2 group"
                        >
                            <PhoneCall size={18} className="group-hover:animate-bounce" />
                            667 887 562
                        </a>
                    </div>
                </div>
            )}

            {/* SPRĘŻYSTY PRZYCISK (FAB) */}
            {/* SPRĘŻYSTY PRZYCISK (FAB) */}
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
                            {/* Mała pulsująca kropka na ikonie */}
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