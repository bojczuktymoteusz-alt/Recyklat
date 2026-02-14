'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';

// 1. ROZSZERZONA LISTA Z KODAMI BDO
const KATEGORIE_Z_BDO = [
    { nazwa: "Folia LDPE (stretch)", bdo: "15 01 02" },
    { nazwa: "Folia kolorowa", bdo: "15 01 02" },
    { nazwa: "Tworzywa sztuczne (mix)", bdo: "16 01 19" },
    { nazwa: "Makulatura (karton)", bdo: "15 01 01" },
    { nazwa: "Makulatura (gazeta)", bdo: "15 01 01" },
    { nazwa: "Złom stalowy", bdo: "17 04 05" },
    { nazwa: "Złom kolorowy", bdo: "17 04 01" },
    { nazwa: "Drewno / Palety", bdo: "15 01 03" },
    { nazwa: "Inne", bdo: "" }
];

// LISTA WOJEWÓDZTW (alfabetycznie)
const WOJEWODZTWA = [
    "dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie",
    "łódzkie", "małopolskie", "mazowieckie", "opolskie",
    "podkarpackie", "podlaskie", "pomorskie", "śląskie",
    "świętokrzyskie", "warmińsko-mazurskie", "wielkopolskie", "zachodniopomorskie"
];

const getIcon = (material: string) => {
    const m = material.toLowerCase();
    if (m.includes('folia')) return '🧻';
    if (m.includes('tworzywa')) return '♻️';
    if (m.includes('makulatura') || m.includes('karton')) return '📄';
    if (m.includes('złom') || m.includes('stal')) return '🔩';
    if (m.includes('drewno') || m.includes('palety')) return '🪵';
    return '❓';
};

export default function DodajOferteKrok1() {
    const router = useRouter();

    const [material, setMaterial] = useState('');
    const [waga, setWaga] = useState('');
    const [lokalizacja, setLokalizacja] = useState(''); // Miejscowość
    const [wojewodztwo, setWojewodztwo] = useState(''); // NOWY STAN: Województwo
    const [telefon, setTelefon] = useState('');

    const [autoBdo, setAutoBdo] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const item = e.clipboardData?.items[0];
            if (item?.type.indexOf('image') !== -1) {
                const blob = item?.getAsFile();
                if (blob) {
                    setFile(blob);
                    setPreview(URL.createObjectURL(blob));
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const uploadImage = async (fileToUpload: File) => {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true
        };

        try {
            const compressedFile = await imageCompression(fileToUpload, options);
            const fileExt = compressedFile.name.split('.').pop() || 'png';
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from('oferty-zdjecia').upload(filePath, compressedFile);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('oferty-zdjecia').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error("Błąd kompresji/uploadu:", error);
            throw error;
        }
    };

    const handleDalej = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let uploadedImageUrl = '';
            if (file) {
                uploadedImageUrl = await uploadImage(file);
            }

            const step1Data = {
                material,
                waga: parseFloat(waga),
                lokalizacja, // Zostawiamy jako Miejscowość
                wojewodztwo, // DODANE WOJEWÓDZTWO
                telefon,
                zdjecie_url: uploadedImageUrl,
                bdo_code: autoBdo
            };

            localStorage.setItem('temp_offer', JSON.stringify(step1Data));
            router.push('/dodaj/parametry');
        } catch (err: any) {
            alert('Błąd: ' + err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Dodaj Ofertę</h1>
                        <p className="text-xs font-bold text-slate-400">KROK 1/2</p>
                    </div>
                    <Link href="/" className="text-slate-400 hover:text-slate-900 text-sm font-bold transition-colors">Anuluj</Link>
                </div>

                <form onSubmit={handleDalej} className="space-y-4">
                    {/* Wybór materiału */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1 ml-1">
                            Rodzaj materiału {material && <span>{getIcon(material)}</span>}
                        </label>
                        <select
                            required
                            className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-semibold text-slate-900 appearance-none transition-all cursor-pointer"
                            value={material}
                            onChange={(e) => {
                                const val = e.target.value;
                                setMaterial(val);
                                const found = KATEGORIE_Z_BDO.find(item => item.nazwa === val);
                                if (found) setAutoBdo(found.bdo);
                            }}
                        >
                            <option value="" disabled>-- Wybierz z listy --</option>
                            {KATEGORIE_Z_BDO.map(kat => (
                                <option key={kat.nazwa} value={kat.nazwa}>{kat.nazwa}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Waga towaru</label>
                            <div className="relative">
                                <input
                                    required type="number" step="0.01" placeholder="0.00"
                                    className="w-full p-4 pr-12 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                                    value={waga} onChange={(e) => setWaga(e.target.value)}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">t</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Telefon</label>
                            <input
                                required type="tel" placeholder="123 456 789"
                                className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                                value={telefon} onChange={(e) => setTelefon(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Województwo</label>
                            <select
                                required
                                className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 appearance-none transition-all cursor-pointer"
                                value={wojewodztwo}
                                onChange={(e) => setWojewodztwo(e.target.value)}
                            >
                                <option value="" disabled>-- wybierz --</option>
                                {WOJEWODZTWA.map(w => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Miejscowość</label>
                            <input
                                required type="text" placeholder="np. Katowice"
                                className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                                value={lokalizacja} onChange={(e) => setLokalizacja(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Zdjęcie (Opcjonalne)</label>
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const f = e.dataTransfer.files[0];
                                if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
                            }}
                            onClick={() => document.getElementById('fileInput')?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition-all cursor-pointer bg-gray-100 relative overflow-hidden"
                        >
                            <input type="file" id="fileInput" className="hidden" accept="image/*"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
                                }}
                            />
                            {preview ? (
                                <img src={preview} alt="Podgląd" className="h-32 mx-auto rounded-lg object-cover shadow-md" />
                            ) : (
                                <div className="text-slate-500 text-sm italic">Kliknij, przeciągnij lub wklej (Ctrl+V)</div>
                            )}
                        </div>
                    </div>

                    <button
                        disabled={loading} type="submit"
                        className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:bg-slate-400 uppercase tracking-tight"
                    >
                        {loading ? 'Przetwarzanie...' : 'Dalej - Parametry ⯈'}
                    </button>
                </form>
            </div>
        </div>
    );
}