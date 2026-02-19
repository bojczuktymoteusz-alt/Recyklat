"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sanitizeText } from "@/lib/security";

// --- TYPY DANYCH (Dla bezpieczeństwa) ---
interface Step1Data {
    title: string;
    material: string;
    waga: string;
    lokalizacja: string;
    wojewodztwo: string;
    telefon: string;
    zdjecie_url: string;
    bdo_code?: string;
}

interface FormData {
    bdo: string;
    cena: string;
    email: string;
    impurity: string;
    form: string;
    certs: string[];
    logistics: string[];
    pickupHours: string;
    description: string;
    hasExtraDocs: boolean;
}

export default function ParametryDetailsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

    // --- SCALONY STAN FORMULARZA ---
    const [formData, setFormData] = useState<FormData>({
        bdo: "",
        cena: "",
        email: "",
        impurity: "",
        form: "",
        certs: [],
        logistics: [],
        pickupHours: "8-16",
        description: "",
        hasExtraDocs: false,
    });

    // Ładowanie danych z localStorage
    useEffect(() => {
        const savedData = localStorage.getItem("temp_offer");
        if (!savedData) {
            router.push("/dodaj");
            return;
        }

        try {
            const parsedData: Step1Data = JSON.parse(savedData);
            setStep1Data(parsedData);

            // Pre-fill BDO jeśli istnieje w kroku 1
            if (parsedData.bdo_code) {
                setFormData(prev => ({ ...prev, bdo: parsedData.bdo_code || "" }));
            }
        } catch (e) {
            console.error("Błąd parsowania danych", e);
            router.push("/dodaj");
        }
    }, [router]);

    // Uniwersalna funkcja zmiany pól tekstowych
    const handleChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Specjalna obsługa BDO (formatowanie XX XX XX)
    const handleBdoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 6);
        const formatted = val.match(/.{1,2}/g)?.join(' ') || val; // Fix: val jeśli match zwróci null
        handleChange("bdo", formatted);
    };

    // Obsługa toggle (Certyfikaty, Logistyka)
    const toggleListSelection = (field: 'certs' | 'logistics', item: string) => {
        setFormData(prev => {
            const list = prev[field];
            const newList = list.includes(item)
                ? list.filter(i => i !== item)
                : [...list, item];
            return { ...prev, [field]: newList };
        });
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Walidacja podstawowa
        if (!formData.cena || !formData.impurity || !formData.form) {
            alert("Uzupełnij obowiązkowe pola: Cena, Zanieczyszczenie oraz Forma towaru!");
            return;
        }

        if (!step1Data) return;
        setLoading(true);

        // 2. Bezpieczne parsowanie liczb (obsługa przecinka 100,50 -> 100.50)
        const safePrice = parseFloat(formData.cena.replace(',', '.')) || 0;
        const safeImpurity = parseFloat(formData.impurity) || 0;
        // 👇 Konwertujemy na String przed użyciem replace, na wypadek gdyby to już była liczba
        const safeWeight = parseFloat(String(step1Data.waga).replace(',', '.')) || 0;

        // 3. Budowanie obiektu (Sanityzacja)
        const finalOffer = {
            // Step 1
            title: sanitizeText(step1Data.title),
            material: sanitizeText(step1Data.material),
            waga: safeWeight,
            lokalizacja: sanitizeText(step1Data.lokalizacja),
            wojewodztwo: sanitizeText(step1Data.wojewodztwo),
            telefon: sanitizeText(step1Data.telefon),
            zdjecie_url: step1Data.zdjecie_url,

            // Step 2
            cena: safePrice,
            email: sanitizeText(formData.email) || null,
            bdo_code: sanitizeText(formData.bdo),
            impurity: safeImpurity,
            form: sanitizeText(formData.form),
            certificates: formData.certs.join(", "),
            logistics: formData.logistics.join(", "),
            pickup_hours: sanitizeText(formData.pickupHours),
            opis: sanitizeText(formData.description),
            extra_photo_docs: formData.hasExtraDocs,

            status: 'aktywna',
            created_at: new Date().toISOString(), // Lepiej używać ISO string dla bazy
        };

        console.log("Wysyłanie:", finalOffer);

        // 4. Wysyłka do Supabase
        const { data, error } = await supabase
            .from('oferty')
            .insert([finalOffer])
            .select();

        if (error) {
            console.error("Błąd Supabase:", error);
            setLoading(false);
        } else {
            console.log("Sukces! Otrzymano dane z bazy:", data);

            if (data && data.length > 0) {
                const noweId = data[0].id;

                try {
                    const suroweDane = localStorage.getItem('moje_oferty');
                    const zapisaneOferty = suroweDane ? JSON.parse(suroweDane) : [];

                    if (!zapisaneOferty.includes(noweId)) {
                        zapisaneOferty.push(noweId);
                        localStorage.setItem('moje_oferty', JSON.stringify(zapisaneOferty));
                    }
                } catch (lsError) {
                    console.error("Błąd localStorage:", lsError);
                }
            }

            localStorage.removeItem("temp_offer");
            setLoading(false);
            router.push("/dodano");
        }
    };

    if (!step1Data) return null;

    return (
        <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 py-12">
            <div className="bg-white p-8 rounded-[32px] shadow-xl max-w-xl w-full border border-slate-100">

                <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase">
                        Krok 2/2: Szczegóły techniczne
                    </span>
                    <Link href="/dodaj" className="text-slate-400 text-xs font-bold hover:text-slate-600 flex items-center gap-1 transition-colors">
                        ← Wróć do edycji podstaw
                    </Link>
                </div>

                <h1 className="text-2xl font-black text-slate-900 uppercase mb-2 tracking-tighter">
                    Parametry towaru
                </h1>
                <p className="text-xs font-bold text-slate-400 mb-8">Uzupełnij szczegóły techniczne Twojego towaru</p>

                <form onSubmit={handleFinalSubmit} className="space-y-6">

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                                Kod BDO <span className="text-slate-500 font-normal text-[10px]">(puste dla regranulatu / produktu)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="np. 15 01 01"
                                className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 tracking-widest"
                                value={formData.bdo}
                                onChange={handleBdoChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                                Cena za tonę <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    required
                                    type="number"
                                    placeholder="0"
                                    value={formData.cena}
                                    onChange={(e) => handleChange('cena', e.target.value)}
                                    className="w-full p-4 pr-12 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">zł/t</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                                Zanieczyszczenie <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 appearance-none transition-all cursor-pointer"
                                    value={formData.impurity}
                                    onChange={(e) => handleChange('impurity', e.target.value)}
                                >
                                    <option value="" disabled className="text-slate-400">Wybierz...</option>
                                    <option value="0">0% (Idealny / Produkt)</option>
                                    <option value="2">Do 2% (Bardzo czysty)</option>
                                    <option value="5">Do 5% (Czysty)</option>
                                    <option value="10">Do 10% (Lekko zabrudzony)</option>
                                    <option value="20">Powyżej 10% (Zabrudzony)</option>
                                    <option value="99">Nie potrafię ocenić</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                                E-mail
                            </label>
                            <input
                                type="email"
                                placeholder="biuro@firma.pl"
                                className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                            Forma towaru <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                required
                                className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 appearance-none cursor-pointer"
                                value={formData.form}
                                onChange={(e) => handleChange('form', e.target.value)}
                            >
                                <option value="" disabled className="text-slate-400">Wybierz formę...</option>
                                <option value="Bela">Bela</option>
                                <option value="Luzem">Luzem</option>
                                <option value="Regranulat">Regranulat</option>
                                <option value="Przemiał/Mielony">Przemiał / Mielony</option>
                                <option value="Odpad poprodukcyjny">Odpad poprodukcyjny</option>
                                <option value="Płynne/Szlam">Płynne / Szlam</option>
                                <option value="Inne">Inne</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Dokumenty / Certyfikaty</label>
                        <div className="flex flex-wrap gap-2">
                            {["KPO (Karta Przekazania Odpadu)", "Certyfikat pochodzenia", "Dokumentacja zdjęciowa", "Analiza składu"].map(cert => (
                                <button
                                    key={cert} type="button"
                                    onClick={() => toggleListSelection('certs', cert)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${formData.certs.includes(cert)
                                        ? "bg-blue-600 border-blue-600 text-white"
                                        : "bg-white border-slate-200 text-slate-500 hover:border-blue-400"
                                        }`}
                                >
                                    {cert}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Logistyka</label>
                        <div className="flex flex-wrap gap-2">
                            {["Transport sprzedającego", "Odbiór własny"].map(opt => (
                                <button
                                    key={opt} type="button"
                                    onClick={() => toggleListSelection('logistics', opt)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${formData.logistics.includes(opt)
                                        ? "bg-slate-900 border-slate-900 text-white"
                                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Godziny odbioru</label>
                        <input
                            type="text" placeholder="np. 8:00 - 16:00"
                            className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                            value={formData.pickupHours} onChange={(e) => handleChange('pickupHours', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                            Dodatkowy opis
                        </label>
                        <textarea
                            className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 min-h-[120px] resize-y"
                            placeholder="Wpisz dodatkowe informacje o towarze..."
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 py-2">
                        <button
                            type="button"
                            onClick={() => handleChange('hasExtraDocs', !formData.hasExtraDocs)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.hasExtraDocs ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
                                }`}
                        >
                            {formData.hasExtraDocs && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                        <span
                            onClick={() => handleChange('hasExtraDocs', !formData.hasExtraDocs)}
                            className="text-sm font-bold text-slate-600 cursor-pointer select-none"
                        >
                            Posiadam dodatkową dokumentację (zdjęcia / analizy)
                        </span>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-5 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all ${loading
                                ? "bg-slate-300 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-500 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-200"
                                }`}
                        >
                            {loading ? "Zapisywanie..." : "Dodaj ofertę"}
                        </button>
                    </div>

                </form>
            </div>
        </main>
    );
}