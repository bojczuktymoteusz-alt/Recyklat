"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ParametryDetailsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step1Data, setStep1Data] = useState<any>(null);

    // --- TWOJE STANY ---
    const [bdo, setBdo] = useState("");
    const [cena, setCena] = useState("");
    const [email, setEmail] = useState(""); // <-- NOWY STAN DLA MAILA
    const [impurity, setImpurity] = useState("");
    const [form, setForm] = useState("");
    const [certs, setCerts] = useState<string[]>([]);
    const [logistics, setLogistics] = useState<string[]>([]);
    const [pickupHours, setPickupHours] = useState("8-16");
    const [description, setDescription] = useState("");
    const [hasExtraDocs, setHasExtraDocs] = useState(false);

    // Pobieramy dane z Kroku 1 i automatycznie ustawiamy BDO
    useEffect(() => {
        const savedData = localStorage.getItem("temp_offer");
        if (!savedData) {
            router.push("/dodaj");
        } else {
            const parsedData = JSON.parse(savedData);
            setStep1Data(parsedData);

            // --- AUTOMATYCZNE BDO Z KROKU 1 ---
            if (parsedData.bdo_code) {
                setBdo(parsedData.bdo_code);
            }
        }
    }, [router]);

    // Obsługa multiselect
    const toggleSelection = (item: string, list: string[], setList: any) => {
        if (list.includes(item)) {
            setList(list.filter((i: string) => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!step1Data) return;

        // Łączymy dane z Kroku 1 i Kroku 2
        const finalOffer = {
            // --- DANE Z KROKU 1 ---
            material: step1Data.material,
            waga: step1Data.waga,
            lokalizacja: step1Data.lokalizacja,
            telefon: step1Data.telefon,
            zdjecie_url: step1Data.zdjecie_url,

            // --- DANE Z KROKU 2 ---
            cena: parseFloat(cena) || 0,
            email: email || null, // <-- DODANY EMAIL DO BAZY
            bdo_code: bdo,
            impurity: parseFloat(impurity) || 0,
            form: form,
            certificates: certs.join(", "),
            logistics: logistics.join(", "),
            pickup_hours: pickupHours,
            opis: description,
            extra_photo_docs: hasExtraDocs,

            status: 'aktywna',
            created_at: new Date(),
        };

        const { error } = await supabase.from('oferty').insert([finalOffer]);

        if (error) {
            alert("Błąd zapisu: " + error.message);
            setLoading(false);
        } else {
            localStorage.removeItem("temp_offer");
            setLoading(false);
            router.push("/dodano");
        }
    };

    if (!step1Data) return null;

    return (
        <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 py-12">
            <div className="bg-white p-8 rounded-[32px] shadow-xl max-w-xl w-full border border-slate-100">

                {/* Pasek postępu */}
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

                    {/* CZYSTA SIATKA 2x2: BDO, Cena, Zanieczyszczenie, E-mail */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Kod BDO</label>
                            <input
                                type="text" placeholder="np. 000123456"
                                className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                                value={bdo} onChange={(e) => setBdo(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Cena za tonę</label>
                            <div className="relative">
                                <input
                                    required
                                    type="number"
                                    placeholder="0"
                                    value={cena}
                                    onChange={(e) => setCena(e.target.value)}
                                    className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                                />
                                <span className="absolute right-4 top-4 text-slate-400 font-bold text-sm">zł/t</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Zanieczyszczenie (%)</label>
                            <div className="relative">
                                <input
                                    type="number" step="0.1" placeholder="0.0"
                                    className="w-full p-4 pr-12 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                                    value={impurity} onChange={(e) => setImpurity(e.target.value)}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">%</span>
                            </div>
                        </div>
                        {/* 4. MIEJSCE W SIATCE: E-mail */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                                E-mail <span className="text-slate-400 font-normal text-[10px]">(Opcjonalne)</span>
                            </label>
                            <input
                                type="email"
                                placeholder="biuro@firma.pl"
                                className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Forma towaru - Lista rozwijana */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Forma towaru</label>
                        <div className="relative">
                            <select
                                required
                                className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 appearance-none"
                                value={form}
                                onChange={(e) => setForm(e.target.value)}
                            >
                                <option value="" disabled className="text-slate-400">wybierz:</option>
                                <option value="Bela">Bela</option>
                                <option value="Luzem">Luzem</option>
                                <option value="Przemiał/Mielony">Przemiał / Mielony</option>
                                <option value="Regranulat">Regranulat</option>
                                <option value="Odpad poprodukcyjny">Odpad poprodukcyjny</option>
                                <option value="Inne">Inne</option>
                            </select>
                            {/* Mała strzałeczka z boku dla lepszego wyglądu (opcjonalnie, wymaga ChevronDown z lucide-react, ale zadziała i bez) */}
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>
                    {/* Certyfikaty (Multi-select style) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Dokumenty / Certyfikaty</label>
                        <div className="flex flex-wrap gap-2">
                            {["KPO (Karta Przekazania Odpadu)", "Certyfikat pochodzenia", "Dokumentacja zdjęciowa", "Analiza składu"].map(cert => (
                                <button
                                    key={cert} type="button"
                                    onClick={() => toggleSelection(cert, certs, setCerts)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${certs.includes(cert)
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-blue-400"
                                        }`}
                                >
                                    {cert}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Logistyka */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Logistyka</label>
                        <div className="flex flex-wrap gap-2">
                            {["Transport sprzedającego", "Transport kupującego", "Odbiór własny"].map(opt => (
                                <button
                                    key={opt} type="button"
                                    onClick={() => toggleSelection(opt, logistics, setLogistics)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${logistics.includes(opt)
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Godziny i Opis */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Godziny odbioru</label>
                        <input
                            type="text"
                            className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                            value={pickupHours} onChange={(e) => setPickupHours(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Opis dodatkowy</label>
                        <textarea
                            rows={3}
                            className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900"
                            value={description} onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-xl border border-blue-100">
                        <input
                            type="checkbox"
                            id="extraDocs"
                            checked={hasExtraDocs}
                            onChange={(e) => setHasExtraDocs(e.target.checked)}
                            className="w-5 h-5 accent-blue-600"
                        />
                        <label htmlFor="extraDocs" className="text-sm font-bold text-blue-800 cursor-pointer">
                            Posiadam dodatkową dokumentację zdjęciową
                        </label>
                    </div>

                    <button
                        disabled={loading} type="submit"
                        className="w-full bg-green-600 text-white p-5 rounded-2xl font-black text-xl hover:bg-green-500 transition-all shadow-lg active:scale-95 disabled:bg-slate-400 uppercase tracking-tight mt-4"
                    >
                        {loading ? 'Zapisywanie...' : 'Opublikuj Ofertę ✔'}
                    </button>

                </form>
            </div>
        </main>
    );
}