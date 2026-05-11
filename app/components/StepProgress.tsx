'use client';

interface Props {
    krok: 1 | 2;
}

const KROKI = [
    { nr: 1, label: 'Podstawowe info', opis: 'Typ, kategoria, lokalizacja' },
    { nr: 2, label: 'Szczegóły',       opis: 'Cena, parametry, opis'       },
];

export default function StepProgress({ krok }: Props) {
    const procent = krok === 1 ? 50 : 100;

    return (
        <div className="mb-8">
            <div className="flex items-start justify-between mb-3">
                {KROKI.map((k, i) => {
                    const ukonczony = k.nr < krok;
                    const aktywny   = k.nr === krok;
                    return (
                        <div key={k.nr} className={`flex gap-2 ${i === 1 ? 'flex-col items-end' : 'flex-col items-start'}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all shrink-0 ${
                                ukonczony
                                    ? 'bg-emerald-500 text-white'
                                    : aktywny
                                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                        : 'bg-slate-200 text-slate-400'
                            }`}>
                                {ukonczony ? (
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : k.nr}
                            </div>
                            <div>
                                <p className={`text-[11px] font-black uppercase tracking-widest leading-none ${aktywny ? 'text-slate-900' : ukonczony ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {k.label}
                                </p>
                                <p className={`text-[10px] font-medium mt-0.5 ${aktywny ? 'text-slate-500' : 'text-slate-300'}`}>
                                    {k.opis}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${krok === 2 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                    style={{ width: `${procent}%` }}
                />
            </div>

            <p className={`text-[10px] font-black uppercase tracking-widest mt-2 text-right ${krok === 2 ? 'text-emerald-600' : 'text-blue-600'}`}>
                {krok === 1 ? 'Krok 1 z 2 — jeszcze jeden krok!' : 'Krok 2 z 2 — ostatni krok!'}
            </p>
        </div>
    );
}
