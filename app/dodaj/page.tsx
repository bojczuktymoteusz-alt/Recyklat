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

    useEffect(() => { setIsCheckingAuth(false); }, []);

    const uploadImage = async (fileToUpload: File) => {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1080, useWebWorker: true };
        try {
            const compressedFile = await imageCompression(fileToUpload, options);
            const fileName = `${Date.now()}.png`;
            await supabase.storage.from('oferty-zdjecia').upload(fileName, compressedFile);
            const { data } = supabase.storage.from('oferty-zdjecia').getPublicUrl(fileName);
            return data.publicUrl;
        } catch (error) { throw error; }
    };

    const handleDalej = async (e: React.FormEvent) => {
        e.preventDefault();
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
        } catch (err: any) { alert(err.message); setLoading(false); }
    };

    if (isCheckingAuth) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
            <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border-4 border-white">

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

                <form onSubmit={handleDalej} className="space-y-8">

                    {/* PRZEŁĄCZNIK TYPU */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-100 p-2 rounded-[28px] border-2 border-slate-200 shadow-inner">
                        <button type="button" onClick={() => setTypOferty('sprzedam')}
                            className={`py-4 rounded-[20px] text-sm font-black uppercase tracking-tight transition-all flex items-center justify-center gap-3 ${typOferty === 'sprzedam' ? 'bg-white text-blue-600 shadow-xl ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                            <ShoppingBag size={20} /> Sprzedam
                        </button>
                        <button type="button" onClick={() => setTypOferty('kupie')}
                            className={`py-4 rounded-[20px] text-sm font-black uppercase tracking-tight transition-all flex items-center justify-center gap-3 ${typOferty === 'kupie' ? 'bg-white text-emerald-600 shadow-xl ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                            <ArrowDownToLine size={20} /> Kupię
                        </button>
                    </div>

                    {/* TYTUŁ */}
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-slate-900 uppercase ml-1">
                            Tytuł ogłoszenia <span className="text-blue-600 text-lg">*</span>
                        </label>
                        <input required type="text" placeholder="Np. Regranulat czarny ABS (wysoki połysk)"
                            className="w-full p-5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-[24px] outline-none font-bold text-slate-900 placeholder:text-slate-400 shadow-sm transition-all text-lg"
                            value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    {/* MATERIAŁ */}
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-slate-900 uppercase ml-1">
                            Rodzaj Materiału <span className="text-blue-600 text-lg">*</span>
                        </label>
                        <div className="relative">
                            <select required className="w-full p-5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-[24px] outline-none font-bold text-slate-900 appearance-none cursor-pointer shadow-sm text-lg"
                                value={material} onChange={(e) => {
                                    setMaterial(e.target.value);
                                    const found = KATEGORIE_Z_BDO.find(item => item.nazwa === e.target.value);
                                    if (found) setAutoBdo(found.bdo);
                                }}>
                                <option value="" disabled>Wybierz kategorię...</option>
                                {KATEGORIE_Z_BDO.map(kat => <option key={kat.nazwa} value={kat.nazwa}>{kat.nazwa}</option>)}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                        </div>
                    </div>

                    {/* WAGA i TELEFON */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-900 uppercase ml-1">
                                Waga (tony)
                            </label>
                            <div className="relative">
                                <input type="number" step="0.01" placeholder="Np. 1.5"
                                    className="w-full p-5 pr-14 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-[24px] outline-none font-bold text-slate-900 text-lg shadow-sm"
                                    value={waga} onChange={(e) => setWaga(e.target.value)} />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs uppercase tracking-widest">ton</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-900 uppercase ml-1">
                                Telefon kontaktowy <span className="text-blue-600 text-lg">*</span>
                            </label>
                            <input required type="tel" placeholder="123 456 789"
                                className="w-full p-5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-[24px] outline-none font-bold text-slate-900 text-lg shadow-sm"
                                value={telefon} onChange={(e) => {

                                    let val = e.target.value.replace(/[^\d+]/g, '').substring(0, 15);

                                    // 2. Przywracamy Twoje formatowanie: dzielimy ciąg na bloki po 3 znaki i łączymy spacją
                                    const formatted = val.match(/.{1,3}/g)?.join(' ') || val;

                                    setTelefon(formatted);
                                }} />
                        </div>
                    </div>

                    {/* LOKALIZACJA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-900 uppercase ml-1">
                                Województwo <span className="text-blue-600 text-lg">*</span>
                            </label>
                            <div className="relative">
                                <select required className="w-full p-5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-[24px] outline-none font-bold text-slate-900 appearance-none cursor-pointer shadow-sm text-lg"
                                    value={wojewodztwo} onChange={(e) => setWojewodztwo(e.target.value)}>
                                    <option value="" disabled>Wybierz...</option>
                                    {WOJEWODZTWA.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {/* MIEJSCOWOŚĆ JEST TERAZ OPCJONALNA, BEZ GWIAZDKI */}
                            <label className="block text-sm font-black text-slate-900 uppercase ml-1">
                                Miejscowość
                            </label>
                            <input type="text" placeholder="Np. Łódź"
                                className="w-full p-5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-[24px] outline-none font-bold text-slate-900 text-lg shadow-sm"
                                value={lokalizacja} onChange={(e) => setLokalizacja(e.target.value)} />
                        </div>
                    </div>

                    {/* ZDJĘCIE */}
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-slate-900 uppercase ml-1">
                            Zdjęcie główne towaru
                        </label>
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const f = e.dataTransfer.files[0];
                                if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
                            }}
                            onClick={() => document.getElementById('fileInput')?.click()}
                            className="border-4 border-dashed border-slate-100 rounded-[40px] p-10 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer bg-slate-50 group relative overflow-hidden"
                        >
                            <input type="file" id="fileInput" className="hidden" accept="image/*"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
                                }}
                            />
                            {preview ? (
                                <div className="relative inline-block">
                                    <img src={preview} alt="Podgląd" className="h-48 mx-auto rounded-[32px] object-cover shadow-2xl border-4 border-white" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] flex items-center justify-center">
                                        <span className="text-white font-black text-xs uppercase bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">Zmień zdjęcie</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6">
                                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-4 group-hover:scale-110 transition-transform">
                                        <ImagePlus size={32} className="text-blue-600" />
                                    </div>
                                    <p className="text-slate-900 font-black text-lg">Kliknij tutaj lub przeciągnij plik</p>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Obsługujemy PNG, JPG (max 10MB)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-slate-900 text-white py-8 rounded-[32px] font-black text-2xl uppercase tracking-tighter shadow-2xl transition-all flex items-center justify-center gap-4 group hover:bg-blue-600 hover:shadow-blue-200 hover:-translate-y-1 active:scale-[0.98] ${loading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {loading ? 'Przetwarzanie...' : 'Dalej do parametrów'}
                        {!loading && <CheckCircle size={28} className="text-blue-400 group-hover:text-white transition-colors" />}
                    </button>

                </form>
            </div>

            <p className="mt-10 text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                Zawsze darmowe ogłoszenia dla firm
            </p>
        </div>
    );
}