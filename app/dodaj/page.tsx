'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { CheckCircle, ShoppingBag, ArrowDownToLine, ImagePlus } from 'lucide-react';
import { sanitizeText } from '@/lib/security';

const KATEGORIE_Z_BDO = [
    { nazwa: "Folia bezbarwna (LDPE / LLDPE)", bdo: "15 01 02" },
    { nazwa: "Folia kolorowa / rolnicza", bdo: "15 01 02" },
    { nazwa: "Opakowania PET", bdo: "15 01 02" },
    { nazwa: "Tworzywa twarde (PP, PE, HDPE)", bdo: "19 12 04" },
    { nazwa: "Tworzywa techniczne (ABS, PC, PS, PA)", bdo: "19 12 04" },
    { nazwa: "Elektroodpady (WEEE) / Kable", bdo: "16 02 14" },
    { nazwa: "Makulatura (Karton / Tektura)", bdo: "15 01 01" },
    { nazwa: "Makulatura (Gazety / Mix)", bdo: "20 01 01" },
    { nazwa: "Złom stalowy i żeliwny", bdo: "19 12 02" },
    { nazwa: "Złom kolorowy (Al, Cu, inne)", bdo: "19 12 03" },
    { nazwa: "Drewno i Palety", bdo: "15 01 03" },
    { nazwa: "Inne", bdo: "" }
];

const WOJEWODZTWA = [
    "dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie",
    "łódzkie", "małopolskie", "mazowieckie", "opolskie",
    "podkarpackie", "podlaskie", "pomorskie", "śląskie",
    "świętokrzyskie", "warmińsko-mazurskie", "wielkopolskie", "zachodniopomorskie"
];

// FUNKCJA FORMATUJĄCA TELEFON
const formatujTelefon = (value: string) => {
    const tylkoCyfry = value.replace(/\D/g, '').substring(0, 9);
    const grupy = tylkoCyfry.match(/(\d{0,3})(\d{0,3})(\d{0,3})/);
    return !grupy ? "" : [grupy[1], grupy[2], grupy[3]].filter(Boolean).join(' ').trim();
};

export default function DodajOferteKrok1() {
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [typOferty, setTypOferty] = useState<'sprzedam' | 'kupie'>('sprzedam');
    const [title, setTitle] = useState('');
    const [material, setMaterial] = useState('');
    const [waga, setWaga] = useState('');
    const [lokalizacja, setLokalizacja] = useState('');
    const [wojewodztwo, setWojewodztwo] = useState('');
    const [telefon, setTelefon] = useState('');
    const [autoBdo, setAutoBdo] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hp, setHp] = useState("");

    useEffect(() => { setIsCheckingAuth(false); }, []);

    const uploadImage = async (fileToUpload: File) => {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1080, useWebWorker: true };
        try {
            const compressedFile = await imageCompression(fileToUpload, options);
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.png`;
            await supabase.storage.from('oferty-zdjecia').upload(fileName, compressedFile);
            const { data } = supabase.storage.from('oferty-zdjecia').getPublicUrl(fileName);
            return data.publicUrl;
        } catch (error) { throw error; }
    };

    const handleDalej = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hp !== "") {
            router.push('/rynek');
            return;
        }
        setLoading(true);
        try {
            let uploadedImageUrl = '';
            if (file) uploadedImageUrl = await uploadImage(file);

            const step1Data = {
                typ_oferty: typOferty,
                title: sanitizeText(title),
                material: sanitizeText(material),
                waga: parseFloat(waga) || 0,
                lokalizacja: sanitizeText(lokalizacja),
                wojewodztwo: sanitizeText(wojewodztwo),
                telefon: sanitizeText(telefon),
                zdjecie_url: uploadedImageUrl,
                bdo_code: autoBdo
            };
            localStorage.setItem('temp_offer', JSON.stringify(step1Data));
            router.push('/dodaj/parametry');
        } catch (err: any) {
            alert(err.message);
            setLoading(false);
        }
    };

    if (isCheckingAuth) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
            <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border-4 border-white">

                {/* Honeypot */}
                <div style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1 }}>
                    <input type="text" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" />
                </div>

                {/* NAGŁÓWEK */}
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">Dodaj Ofertę</h1>
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">Krok 1</span>
                            <p className="text-sm font-extrabold text-slate-500 uppercase tracking-tight">Informacje podstawowe</p>
                        </div>
                    </div>
                    <Link href="/rynek" className="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 p-3 rounded-2xl transition-all font-black text-[10px] uppercase">Anuluj</Link>
                </div>

                <form onSubmit={handleDalej} className="space-y-6">
                    {/* TYP OFERTY */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-100 p-2 rounded-[28px]">
                        <button
                            type="button"
                            onClick={() => setTypOferty('sprzedam')}
                            className={`py-4 rounded-[20px] text-sm font-black uppercase flex items-center justify-center gap-3 transition-all ${typOferty === 'sprzedam' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ShoppingBag size={20} /> Sprzedam
                        </button>
                        <button
                            type="button"
                            onClick={() => setTypOferty('kupie')}
                            className={`py-4 rounded-[20px] text-sm font-black uppercase flex items-center justify-center gap-3 transition-all ${typOferty === 'kupie' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ArrowDownToLine size={20} /> Kupię
                        </button>
                    </div>

                    {/* TYTUŁ */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 block">
                            Tytuł ogłoszenia <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="np. Regranulat LDPE jasny"
                            className="w-full p-5 bg-slate-50 border-2 rounded-[24px] font-bold focus:border-blue-500 outline-none transition-colors"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* KATEGORIA / MATERIAŁ */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 block">
                            Kategoria surowca <span className="text-red-500">*</span>
                        </label>
                        <select required className="w-full p-5 bg-slate-50 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors" value={material} onChange={(e) => {
                            setMaterial(e.target.value);
                            const found = KATEGORIE_Z_BDO.find(k => k.nazwa === e.target.value);
                            if (found) setAutoBdo(found.bdo);
                        }}>
                            <option value="">Wybierz kategorię...</option>
                            {KATEGORIE_Z_BDO.map(k => <option key={k.nazwa} value={k.nazwa}>{k.nazwa}</option>)}
                        </select>
                    </div>

                    {/* WAGA I TELEFON */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 block">
                                Waga (tony)
                            </label>
                            <input type="number" placeholder="np. 24" className="w-full p-5 bg-slate-50 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors" value={waga} onChange={(e) => setWaga(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 block">
                                Telefon <span className="text-red-500">*</span>
                            </label>
                            {/* PODPIĘTA FUNKCJA FORMATUJĄCA */}
                            <input required type="tel" placeholder="000 000 000" className="w-full p-5 bg-slate-50 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors" value={telefon} onChange={(e) => setTelefon(formatujTelefon(e.target.value))} />
                        </div>
                    </div>

                    {/* WOJEWÓDZTWO I LOKALIZACJA */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 block">
                                Województwo <span className="text-red-500">*</span>
                            </label>
                            <select required className="w-full p-5 bg-slate-50 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors" value={wojewodztwo} onChange={(e) => setWojewodztwo(e.target.value)}>
                                <option value="">Wybierz...</option>
                                {WOJEWODZTWA.map(w => <option key={w} value={w}>{w}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 mb-1 block">
                                Miejscowość
                            </label>
                            <input type="text" placeholder="np. Warszawa" className="w-full p-5 bg-slate-50 border-2 rounded-[24px] font-bold outline-none focus:border-blue-500 transition-colors" value={lokalizacja} onChange={(e) => setLokalizacja(e.target.value)} />
                        </div>
                    </div>

                    {/* ZDJĘCIE */}
                    <div onClick={() => document.getElementById('fileInput')?.click()} className="border-4 border-dashed rounded-[40px] p-10 text-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors mt-4">
                        <input type="file" id="fileInput" className="hidden" accept="image/*" onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
                        }} />
                        {preview ? (
                            <div className="relative inline-block">
                                <img src={preview} className="h-40 mx-auto rounded-2xl shadow-lg" alt="Podgląd" />
                                <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full"><CheckCircle size={16} /></div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <ImagePlus size={40} className="text-slate-300" />
                                <p className="font-black text-slate-400 uppercase text-sm">Kliknij, aby dodać zdjęcie</p>
                            </div>
                        )}
                    </div>

                    {/* PRZYCISK */}
                    <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-8 rounded-[32px] font-black text-2xl uppercase flex items-center justify-center gap-4 hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 mt-4">
                        {loading ? 'Przetwarzanie...' : 'Dalej do parametrów'}
                        <CheckCircle size={28} />
                    </button>
                </form>
            </div>
        </div>
    );
} // <--- TO ZAMYKA CAŁY KOMPONENT DodajOferteKrok1