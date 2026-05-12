import React from 'react';

interface TelefonFragmentProps {
    telefon: string;
    setTelefon: (val: string) => void;
    podswietlone: Set<string>;
    setPodswietlone: React.Dispatch<React.SetStateAction<Set<string>>>;
    formatujTelefon: (val: string) => string;
}

const TelefonFragment = ({
    telefon,
    setTelefon,
    podswietlone,
    setPodswietlone,
    formatujTelefon
}: TelefonFragmentProps) => {

    const getFieldClass = (fieldName: string) => {
        return podswietlone?.has(fieldName)
            ? 'border-red-500 bg-red-50'
            : 'border-slate-100 focus:border-blue-500';
    };

    return (
        <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 block">
                Telefon <span className="text-red-500">*</span>
            </label>
            <input
                required
                type="tel"
                inputMode="tel"
                placeholder="600 700 800 lub +44 20 1234 5678"
                autoComplete="tel"
                className={`w-full p-5 border-2 rounded-[24px] font-bold outline-none transition-colors tracking-wider ${getFieldClass('telefon')}`}
                value={telefon}
                onChange={e => {
                    setTelefon(formatujTelefon(e.target.value));
                    if (podswietlone?.has('telefon')) {
                        setPodswietlone(p => {
                            const n = new Set(p);
                            n.delete('telefon');
                            return n;
                        });
                    }
                }}
            />
            <p className="text-[10px] text-slate-400 font-bold ml-5 mt-1">
                Polski: 600 700 800 &nbsp;·&nbsp; Zagraniczny: +44 700 900 123
            </p>
        </div>
    );
};

export default TelefonFragment;