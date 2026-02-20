'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { CheckCircle } from 'lucide-react';
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

    // Form states
    const [title, setTitle] = useState('');
    const [material, setMaterial] = useState('');
    const [waga, setWaga] = useState('');
    const [lokalizacja, setLokalizacja] = useState('');
    const [wojewodztwo, setWojewodztwo] = useState('');
    const [telefon, setTelefon] = useState('');
    const [autoBdo, setAutoBdo] = useState('');

    // File states
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // 🛡️ SPRAWDZANIE SESJI
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            // 👇 TYMCZASOWA ZMIANA: Zakomentowałem wyrzucanie, żebyś mógł testować na localhost
            if (!session) {
                console.log("Brak sesji (tryb deweloperski - nie wyrzucam)");
                // router.push('/rynek'); // <--- ODKOMENTUJ TO, JAK JUŻ SKOŃCZYSZ APKIĘ!
            }

            setIsCheckingAuth(false);
        };
        checkUser();
    }, [router]);

    // Obsługa wklejania zdjęcia (Ctrl+V)
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
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`; // Lepsze generowanie nazwy
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
        e.preventDefault(); // Zatrzymaj przeładowanie strony

        if (!title || !material || !telefon || !wojewodztwo || !lokalizacja) {
            alert("Uzupełnij obowiązkowe pola!");
            return;
        }

        setLoading(true);

        try {
            let uploadedImageUrl = '';
            if (file) {
                uploadedImageUrl = await uploadImage(file);
            }

            // Sanityzacja danych
            const step1Data = {
                title: sanitizeText(title),
                material: sanitizeText(material),
                waga: parseFloat(waga) || 0,
                lokalizacja: sanitizeText(lokalizacja),
                wojewodztwo: sanitizeText(wojewodztwo),
                telefon: sanitizeText(telefon),
                zdjecie_url: uploadedImageUrl,
                bdo_code: autoBdo
            };

            // Zapis do localStorage
            localStorage.setItem('temp_offer', JSON.stringify(step1Data));

            // Przejście do kroku 2
            router.push('/dodaj/parametry');

        } catch (err: any) {
            console.error(err);
            alert('Błąd: ' + err.message);
            setLoading(false);
        }
    };

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-slate-500 font-bold animate-pulse">Ładowanie...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Dodaj Ofertę</h1>
                        <p className="text-xs font-bold text-slate-400">KROK 1/2</p>
                    </div>
                    <Link href="/" className="text-slate-400 hover:text-slate-900 text-sm font-bold transition-colors">Anuluj</Link>
                </div>

                <form onSubmit={handleDalej} className="space-y-4">

                    {/* TYTUŁ */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                            Tytuł ogłoszenia <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="np. Folia 100% PVC - stała podaż"
                            className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 placeholder:text-slate-400"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* MATERIAŁ */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                            Rodzaj Materiału <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-semibold text-slate-900 appearance-none cursor-pointer"
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

                    {/* WAGA i TELEFON */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                                Waga towaru <span className="text-slate-500 font-normal text-[10px] ml-1">(opcjonalnie)</span>
                            </label>
                            <div className="relative">
                                {/* 👇 USUNIĘTO 'required', zmieniono placeholder */}
                                <input
                                    type="number" step="0.01" placeholder="np. 10"
                                    className="w-full p-4 pr-12 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                                    value={waga} onChange={(e) => setWaga(e.target.value)}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">/t</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                                Telefon <span className="text-red-500">*</span>
                            </label>
                            <input
                                required type="tel" placeholder="123 456 789"
                                className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                                value={telefon}
                                onChange={(e) => {
                                    let val = e.target.value.replace(/\D/g, '').substring(0, 9);
                                    const formatted = val.match(/.{1,3}/g)?.join(' ') || val;
                                    setTelefon(formatted);
                                }}
                            />
                        </div>
                    </div>

                    {/* LOKALIZACJA */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                                Województwo <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 appearance-none cursor-pointer"
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
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                                Miejscowość <span className="text-red-500">*</span>
                            </label>
                            <input
                                required type="text" placeholder="np. pod Łaskiem"
                                className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                                value={lokalizacja} onChange={(e) => setLokalizacja(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ZDJĘCIE (Drag & Drop) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Zdjęcie</label>
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
                                <div className="text-slate-500 text-sm italic">Kliknij lub wklej (Ctrl+V)</div>
                            )}
                        </div>
                    </div>

                    {/* PRZYCISK DALEJ */}
                    {/* 👇 ZMIANA: Usunąłem onClick, dodałem type="submit". Teraz enter w polu formularza też zadziała! */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-xl uppercase tracking-tighter shadow-xl transition-all flex items-center justify-center gap-3 group ${loading ? 'opacity-70 cursor-wait' : 'hover:bg-blue-600 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]'
                            }`}
                    >
                        {loading ? 'Przetwarzanie...' : 'Dalej - Parametry'}
                        {!loading && <CheckCircle size={24} className="text-blue-400 shrink-0 group-hover:text-white transition-colors" />}
                    </button>
                </form>
            </div>
        </div>
    );
}