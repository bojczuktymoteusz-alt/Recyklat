"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sanitizeText } from "@/lib/security";
import { CheckCircle, ShoppingBag, ArrowDownToLine, Info, Truck, Award } from "lucide-react";

interface Step1Data {
    typ_oferty?: string;
    title: string;
    material: string;
    waga: string | number;
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

    useEffect(() => {
        const savedData = localStorage.getItem("temp_offer");
        if (!savedData) {
            router.push("/dodaj");
            return;
        }

        try {
            const parsedData: Step1Data = JSON.parse(savedData);
            setStep1Data(parsedData);
            if (parsedData.bdo_code) {
                setFormData(prev => ({ ...prev, bdo: parsedData.bdo_code || "" }));
            }
        } catch (e) {
            router.push("/dodaj");
        }
    }, [router]);

    const handleChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleBdoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 6);
        const formatted = val.match(/.{1,2}/g)?.join(' ') || val;
        handleChange("bdo", formatted);
    };

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

        if (!formData.cena || !formData.impurity || !formData.form) {
            alert("Uzupełnij obowiązkowe pola!");
            return;
        }

        if (!step1Data) return;
        setLoading(true);

        const safePrice = parseFloat(formData.cena.replace(',', '.')) || 0;
        const safeImpurity = parseFloat(formData.impurity) || 0;
        const safeWeight = parseFloat(String(step1Data.waga).replace(',', '.')) || 0;

        const finalOffer = {
            typ_oferty: step1Data.typ_oferty || 'sprzedam',
            title: sanitizeText(step1Data.title),
            material: sanitizeText(step1Data.material),
            waga: safeWeight,
            lokalizacja: sanitizeText(step1Data.lokalizacja),
            wojewodztwo: sanitizeText(step1Data.wojewodztwo),
            telefon: sanitizeText(step1Data.telefon),
            zdjecie_url: step1Data.zdjecie_url,
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
            created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from('oferty').insert([finalOffer]).select();

        if (error) {
            setLoading(false);
            alert("Błąd zapisu: " + error.message);
        } else {
            if (data && data.length > 0) {
                const noweId = data[0].id;
                const suroweDane = localStorage.getItem('moje_oferty');
                const zapisaneOferty = suroweDane ? JSON.parse(suroweDane) : [];
                if (!zapisaneOferty.includes(noweId)) {
                    zapisaneOferty.push(noweId);
                    localStorage.setItem('moje_oferty', JSON.stringify(zapisaneOferty));
                }
            }
            localStorage.removeItem("temp_offer");
            router.push("/dodano");
        }
    };

    if (!step1Data) return null;

    const jestKupno = step1Data.typ_oferty === 'kupie';

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 font-sans">
            <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border-4 border-white">

                {/* NAGŁÓWEK - MIĘSISTY JAK W KROKU 1 */}
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                            {jestKupno ? "Wymagania" : "Parametry"}
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">Krok 2</span>
                            <p className="text-sm font-extrabold text-slate-500 uppercase tracking-tight">
                                {jestKupno ? "Szczegóły zapotrzebowania" : "Szczegóły techniczne"}
                            </p>
                        </div>
                    </div>
                    <Link href="/dodaj" className="bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 p-3 rounded-2xl transition-all font-black text-[10px] uppercase">
                        Wróć
                    </Link>
                </div>

                <form onSubmit={handleFinalSubmit} className="space-y-8">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-900 uppercase ml-1">Kod BDO</label>
                            <input
                                type="text" placeholder="np. 15 01 01"
                                className="w-full p-5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-[24px] outline-none font-bold text-slate-900 text-lg tracking-widest shadow-sm transition-all"
                                value={formData.bdo} onChange={handleBdoChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-900 uppercase ml-1">
                                {jestKupno ? "Budżet (zł/t)" : "Cena (zł/t)"} <span className="text-blue-600 text-lg">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    required type="number" placeholder="0"
                                    value={formData.cena} onChange={(e) => handleChange('cena', e.target.value)}
                                    className="w-full p-5 pr-14 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-[24px] outline-none font-bold text-slate-900 text-lg shadow-sm transition-all"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">zł/t</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-900 uppercase ml-1">
                                {jestKupno ? "Akcept. zabrudzenie" : "Zanieczyszczenie"} <span className="text-blue-600 text-lg">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    required value={formData.impurity} onChange={(e) => handleChange('impurity', e.target.value)}
                                    className="w-full p-5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-[24px] outline-none font-bold text-slate-900 text-base appearance-none cursor-pointer shadow-sm transition-all"
                                >
                                    <option value="" disabled>Wybierz...</option>
                                    <option value="0">0% (Idealny)</option>
                                    <option value="2">Do 2% (Bardzo czysty)</option>
                                    <option value="5">Do 5% (Czysty)</option>
                                    <option value="10">Do 10% (Lekko brudny)</option>
                                    <option value="20">Powyżej 10% (Brudny)</option>
                                    <option value="99">Nie potrafię ocenić</option>
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-900 uppercase ml-1">E-mail (kontakt)</label>
                            <input
                                type="email" placeholder="biuro@firma.pl"
                                className="w-full p-5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-[24px] outline-none font-bold text-slate-900 text-lg shadow-sm transition-all"
                                value={formData.email} onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-black text-slate-900 uppercase ml-1">
                            Postać surowca <span className="text-blue-600 text-lg">*</span>
                        </label>
                        <div className="relative">
                            <select
                                required value={formData.form} onChange={(e) => handleChange('form', e.target.value)}
                                className="w-full p-5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-[24px] outline-none font-bold text-slate-900 text-lg appearance-none cursor-pointer shadow-sm transition-all"
                            >
                                <option value="" disabled>Wybierz formę...</option>
                                <option value="Bela">Bela</option>
                                <option value="Luzem">Luzem</option>
                                <option value="Regranulat">Regranulat</option>
                                <option value="Przemiał/Mielony">Przemiał / Mielony</option>
                                <option value="Odpad poprodukcyjny">Odpad poprodukcyjny</option>
                                <option value="Płynne/Szlam">Płynne / Szlam</option>
                                <option value="Inne">Inne</option>
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                        </div>
                    </div>

                    {/* DOKUMENTACJA - MOCNIEJSZE BUTTONY */}
                    <div className="space-y-3">
                        <label className="block text-sm font-black text-slate-900 uppercase ml-1">Dokumentacja / Certyfikaty</label>
                        <div className="flex flex-wrap gap-3">
                            {["KPO (Karta Przekazania Odpadu)", "Certyfikat pochodzenia", "Analiza składu", "Zdjęcia towaru"].map(cert => (
                                <button
                                    key={cert} type="button"
                                    onClick={() => toggleListSelection('certs', cert)}
                                    className={`px-5 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${formData.certs.includes(cert)
                                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
                                        }`}
                                >
                                    <Award size={16} className={formData.certs.includes(cert) ? "text-blue-200" : "text-slate-400"} />
                                    {cert}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* LOGISTYKA - MOCNIEJSZE BUTTONY */}
                    <div className="space-y-3">
                        <label className="block text-sm font-black text-slate-900 uppercase ml-1">Logistyka i Transport</label>
                        <div className="flex flex-wrap gap-3">
                            {["Transport sprzedającego", "Odbiór własny", "Wymagana rampa", "Wymagana winda"].map(opt => (
                                <button
                                    key={opt} type="button"
                                    onClick={() => toggleListSelection('logistics', opt)}
                                    className={`px-5 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${formData.logistics.includes(opt)
                                        ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-300"
                                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
                                        }`}
                                >
                                    <Truck size={16} className={formData.logistics.includes(opt) ? "text-slate-400" : "text-slate-400"} />
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-900 uppercase ml-1">Godziny odbioru</label>
                            <input
                                type="text" placeholder="np. 8:00 - 16:00"
                                className="w-full p-5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-[24px] outline-none font-bold text-slate-900 transition-all text-lg shadow-sm"
                                value={formData.pickupHours} onChange={(e) => handleChange('pickupHours', e.target.value)}
                            />
                        </div>
                        <div className="flex items-center pb-1">
                            <button
                                type="button"
                                onClick={() => handleChange('hasExtraDocs', !formData.hasExtraDocs)}
                                className={`flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all w-full shadow-sm ${formData.hasExtraDocs
                                    ? "bg-blue-50 border-blue-600 text-blue-700"
                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-400"
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${formData.hasExtraDocs ? "bg-blue-600" : "border-2 border-slate-300 bg-white"}`}>
                                    {formData.hasExtraDocs && <CheckCircle size={16} className="text-white" />}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-left">Posiadam dodatkową dokumentację</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-black text-slate-900 uppercase ml-1">Dodatkowy Opis</label>
                        <textarea
                            className="w-full p-5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-[32px] outline-none font-bold text-slate-900 min-h-[160px] resize-none transition-all placeholder:text-slate-400 shadow-sm text-lg"
                            placeholder="Wpisz dodatkowe szczegóły, warunki płatności lub wymagania..."
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </div>

                    {/* PRZYCISK FINALNY */}
                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-8 rounded-[32px] text-white font-black text-2xl uppercase tracking-tighter transition-all flex items-center justify-center gap-4 group shadow-2xl ${loading
                                ? "bg-slate-300 cursor-not-allowed text-slate-500"
                                : "bg-emerald-600 hover:bg-emerald-500 hover:-translate-y-1 active:scale-[0.98] active:translate-y-0"
                                }`}
                        >
                            {loading ? "Przetwarzanie..." : "Dodaj ogłoszenie do bazy"}
                            {!loading && <CheckCircle size={28} className="text-emerald-200 group-hover:text-white transition-colors" />}
                        </button>
                    </div>

                </form>
            </div>
        </main>
    );
}