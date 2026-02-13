'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Upewnij się, że ścieżka jest ok
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Potrzebne do przejścia dalej

const KATEGORIE = [
    "Folia LDPE (stretch)", "Folia kolorowa", "Tworzywa sztuczne (mix)",
    "Makulatura (karton)", "Makulatura (gazeta)", "Złom stalowy",
    "Złom kolorowy", "Drewno / Palety", "Inne"
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
    const router = useRouter(); // Kierownica do zmiany strony

    const [material, setMaterial] = useState('');
    const [waga, setWaga] = useState('');
    const [lokalizacja, setLokalizacja] = useState('');
    const [telefon, setTelefon] = useState('');

    // Zdjęcia
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);

    // Obsługa wklejania (Paste)
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

    // Funkcja uploadu zdjęcia (robimy to już w kroku 1, żeby nie zgubić pliku)
    const uploadImage = async (fileToUpload: File) => {
        const fileExt = fileToUpload.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from('oferty-zdjecia').upload(filePath, fileToUpload);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('oferty-zdjecia').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleDalej = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let uploadedImageUrl = '';

            // Jeśli jest zdjęcie, wysyłamy je teraz
            if (file) {
                uploadedImageUrl = await uploadImage(file);
            }

            // Pakujemy dane do "walizki" (LocalStorage)
            const step1Data = {
                material,
                waga: parseFloat(waga),
                lokalizacja,
                telefon,
                zdjecie_url: uploadedImageUrl
            };

            localStorage.setItem('temp_offer', JSON.stringify(step1Data));

            // Przechodzimy do Kroku 2
            router.push('/dodaj/parametry');

        } catch (err: any) {
            alert('Błąd podczas przetwarzania zdjęcia: ' + err.message);
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
                            className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-semibold text-slate-900 appearance-none"
                            value={material} onChange={(e) => setMaterial(e.target.value)}
                        >
                            <option value="" disabled>-- Wybierz z listy --</option>
                            {KATEGORIE.map(kat => <option key={kat} value={kat}>{kat}</option>)}
                        </select>
                    </div>

                    {/* Waga i Telefon */}
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

                    {/* Lokalizacja */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Lokalizacja</label>
                        <input
                            required type="text" placeholder="np. Katowice, śląskie"
                            className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                            value={lokalizacja} onChange={(e) => setLokalizacja(e.target.value)}
                        />
                    </div>

                    {/* Zdjęcie (Drag & Drop) */}
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