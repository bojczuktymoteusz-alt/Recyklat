'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft, MapPin, Phone, Info, Truck,
    Clock, Trash2, Mail, CheckCircle, Scale, Award, ShieldCheck, Map, FileText
} from 'lucide-react';
import Link from 'next/link';

export default function SzczegolyOferty() {
    const { id } = useParams();
    const router = useRouter();
    const [oferta, setOferta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [czyToMoje, setCzyToMoje] = useState(false);

    // --- FUNKCJA TŁUMACZĄCA WARTOŚĆ ZANIECZYSZCZENIA ---
    const getImpurityLabel = (val: number | string) => {
        const v = Number(val);
        if (v === 2) return "Do 2% (Bardzo czysty)";
        if (v === 5) return "Do 5% (Czysty)";
        if (v === 10) return "Do 10% (Lekko zabrudzony)";
        if (v === 20) return "Powyżej 10% (Zabrudzony)";
        if (v === 99) return "Nie potrafię ocenić";
        return v + "%"; // Fallback dla starych wpisów ręcznych
    };

    useEffect(() => {
        async function fetchOferta() {
            const { data, error } = await supabase
                .from('oferty')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Błąd:', error);
                router.push('/rynek');
            } else {
                setOferta(data);
                const mojeIds = JSON.parse(localStorage.getItem('moje_oferty') || '[]');
                if (mojeIds.includes(Number(id))) {
                    setCzyToMoje(true);
                }
            }
            setLoading(false);
        }
        if (id) fetchOferta();
    }, [id, router]);

    const usunOferte = async () => {
        const potwierdzenie = confirm("Czy na pewno chcesz TRWALE usunąć tę ofertę z bazy danych?");
        if (!potwierdzenie) return;

        const { error } = await supabase
            .from('oferty')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Błąd bazy: " + error.message);
        } else {
            const mojeIds = JSON.parse(localStorage.getItem('moje_oferty') || '[]');
            const noweIds = mojeIds.filter((oldId: number) => oldId !== Number(id));
            localStorage.setItem('moje_oferty', JSON.stringify(noweIds));

            alert("Oferta została usunięta.");
            router.push('/rynek');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-spin text-4xl">♻️</div>
        </div>
    );

    if (!oferta) return <div className="p-10 text-center font-black uppercase">Nie znaleziono oferty.</div>;

    const jestSprzedane = oferta.status === 'sprzedane';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/rynek" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-bold uppercase text-xs tracking-widest">
                        <ArrowLeft size={18} />
                        <span>Powrót</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {czyToMoje && (
                            <button
                                onClick={usunOferte}
                                className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-all border border-red-100 text-[10px] font-black uppercase"
                            >
                                <Trash2 size={14} />
                                Usuń ogłoszenie
                            </button>
                        )}
                        <span className="text-[10px] text-gray-400 font-black bg-gray-100 px-2 py-1 rounded uppercase">ID: #{oferta.id}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-8 w-full pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEWA KOLUMNA - ZDJĘCIE I TYTUŁ */}
                    <div className="space-y-6">
                        <div className="aspect-square bg-white rounded-[40px] overflow-hidden border shadow-sm relative">
                            {oferta.zdjecie_url ? (
                                <img
                                    src={oferta.zdjecie_url}
                                    alt={oferta.material}
                                    className={`w-full h-full object-cover ${jestSprzedane ? 'grayscale opacity-50' : ''}`}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 bg-slate-50 text-8xl font-black opacity-20">?</div>
                            )}

                            {jestSprzedane && (
                                <div className="absolute inset-0 bg-red-600/30 backdrop-blur-[2px] flex items-center justify-center">
                                    <div className="bg-white text-red-600 px-8 py-3 rounded-2xl font-black text-3xl uppercase tracking-tighter shadow-2xl -rotate-6 border-4 border-red-600">
                                        Sprzedane
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-6">
                            <h1 className={`text-4xl font-black tracking-tighter uppercase leading-none ${jestSprzedane ? 'text-gray-400' : 'text-slate-900'}`}>
                                {oferta.material}
                            </h1>
                            <div className="flex flex-wrap gap-3 items-center pt-2">
                                <span className={`px-5 py-3 rounded-2xl text-2xl font-black shadow-lg ${jestSprzedane ? 'bg-gray-100 text-gray-400 shadow-none' : 'bg-green-600 text-white shadow-green-100'}`}>
                                    {oferta.cena} zł / t
                                </span>
                                <span className="bg-slate-50 text-slate-600 px-5 py-3 rounded-2xl text-lg font-bold border border-slate-100 flex items-center gap-2">
                                    <Scale size={18} /> {oferta.waga} t
                                </span>
                            </div>

                            {/* POPRAWIONA SEKCJA LOKALIZACJI I WOJEWÓDZTWA */}
                            <div className="flex flex-col pt-6 border-t border-slate-50 gap-2">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shrink-0">
                                        <MapPin size={24} className="text-blue-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-xl uppercase tracking-tight text-slate-900">{oferta.lokalizacja}</span>
                                        {oferta.wojewodztwo && (
                                            <span className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-1 uppercase tracking-widest">
                                                <Map size={12} /> Woj. {oferta.wojewodztwo.toLowerCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PRAWA KOLUMNA - PARAMETRY */}
                    <div className="space-y-6">

                        {/* NOWA SEKCJA: OPIS (Wyświetla dane firmy, kolor, pochodzenie itp.) */}
                        {oferta.opis && (
                            <div className="bg-white p-8 rounded-[40px] border shadow-sm">
                                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest opacity-40">
                                    <FileText size={16} className="text-blue-600" /> Opis i kontakt dodatkowy
                                </h3>
                                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {oferta.opis}
                                </p>
                            </div>
                        )}

                        <div className="bg-white p-8 rounded-[40px] border shadow-sm">
                            <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 text-xs uppercase tracking-widest opacity-40">
                                <Info size={16} /> Szczegóły
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100">
                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">BDO</p>
                                    <p className="font-black text-slate-700 text-lg">{oferta.bdo_code || '---'}</p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100">
                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">Zanieczyszczenie</p>
                                    <p className="font-black text-slate-700 text-lg">{getImpurityLabel(oferta.impurity)}</p>
                                </div>
                            </div>
                            <div className="mt-4 p-5 bg-slate-50 rounded-[24px] border border-slate-100">
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">Postać</p>
                                <p className="font-black text-slate-700 text-lg uppercase">{oferta.form || 'Luzem'}</p>
                            </div>
                        </div>

                        {/* SEKCJA: CERTYFIKATY I DOKUMENTY */}
                        <div className="bg-white p-8 rounded-[40px] border shadow-sm mt-6">
                            <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 text-xs uppercase tracking-widest opacity-40">
                                <Award size={16} className="text-purple-500" /> Dokumentacja i Jakość
                            </h3>

                            {oferta.certificates && (Array.isArray(oferta.certificates) ? oferta.certificates.length > 0 : oferta.certificates.length > 0) ? (
                                <div className="p-5 bg-purple-50 rounded-[24px] border border-purple-100">
                                    <p className="text-[10px] uppercase font-black text-purple-400 mb-3 tracking-widest">
                                        Gwarantowane dokumenty:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {(Array.isArray(oferta.certificates)
                                            ? oferta.certificates
                                            : oferta.certificates.split(',')
                                        ).map((cert: string, index: number) => (
                                            <div
                                                key={index}
                                                className="bg-white text-purple-700 px-4 py-2 rounded-xl text-[11px] font-black border border-purple-200 shadow-sm flex items-center gap-2"
                                            >
                                                <ShieldCheck size={14} className="text-purple-400" />
                                                {cert.trim()}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 border-dashed text-center">
                                    <p className="text-slate-400 font-bold text-sm italic">
                                        Sprzedający nie wskazał dodatkowych certyfikatów.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border shadow-sm">
                            <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 text-xs uppercase tracking-widest opacity-40">
                                <Truck size={16} /> Logistyka
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-[24px] border border-slate-100">
                                    <Truck size={20} className="text-blue-600 shrink-0" />
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Transport</p>
                                        <p className="text-sm font-black text-slate-700">{oferta.logistics || 'Do ustalenia'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-[24px] border border-slate-100">
                                    <Clock size={20} className="text-blue-600 shrink-0" />
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Odbiór</p>
                                        <p className="text-sm font-black text-slate-700">{oferta.pickup_hours || 'Brak danych'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DOLNY PASEK KONTAKTOWY */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 z-50">
                <div className="max-w-4xl mx-auto">
                    {jestSprzedane ? (
                        <div className="h-16 w-full bg-red-50 border-2 border-red-100 rounded-2xl flex items-center justify-center gap-3">
                            <CheckCircle size={24} className="text-red-600" />
                            <span className="text-red-600 font-black uppercase tracking-tighter text-xl">Oferta zakończona</span>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <a
                                href={`tel:${oferta.telefon}`}
                                className="flex-1 bg-slate-900 text-white rounded-[24px] h-16 flex items-center justify-center gap-3 font-black text-xl shadow-2xl active:scale-95 transition-all uppercase tracking-tight"
                            >
                                <Phone size={24} fill="currentColor" />
                                Zadzwoń: {oferta.telefon}
                            </a>
                            {oferta.email && (
                                <a
                                    href={`mailto:${oferta.email}?subject=Zapytanie o: ${oferta.material}`}
                                    className="px-8 bg-blue-50 text-blue-600 font-black uppercase tracking-widest rounded-[24px] flex items-center justify-center gap-2 border-2 border-blue-100 active:scale-95 transition-all"
                                >
                                    <Mail size={24} />
                                    <span>Napisz</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
