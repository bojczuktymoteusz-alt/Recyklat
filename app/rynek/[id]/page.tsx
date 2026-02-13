'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MapPin, Phone, Info, Truck, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function SzczegolyOferty() {
    const { id } = useParams();
    const router = useRouter();
    const [oferta, setOferta] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
            }
            setLoading(false);
        }
        if (id) fetchOferta();
    }, [id, router]);

    const usunOferte = async () => {
        const potwierdzenie = confirm("Czy na pewno chcesz trwale usunąć tę ofertę?");
        if (!potwierdzenie) return;

        const { error } = await supabase
            .from('oferty')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Błąd: " + error.message);
        } else {
            alert("Oferta usunięta pomyślnie.");
            router.push('/rynek');
        }
    };

    if (loading) return <div className="p-10 text-center">Ładowanie szczegółów...</div>;
    if (!oferta) return <div className="p-10 text-center">Nie znaleziono oferty.</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/rynek" className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors font-semibold">
                        <ArrowLeft size={20} />
                        <span>Powrót do giełdy</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={usunOferte}
                            className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-all border border-red-100 text-sm font-bold"
                        >
                            <Trash2 size={16} />
                            Usuń
                        </button>
                        <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">ID: {oferta.id}</span>
                    </div>
                </div>
            </div>

            {/* Main Content - pb-60 zapewnia, że dół nie będzie ucięty */}
            <div className="max-w-4xl mx-auto px-4 py-8 w-full pb-60">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEWA KOLUMNA */}
                    <div className="space-y-6">
                        <div className="aspect-square bg-white rounded-[32px] overflow-hidden border shadow-sm ring-1 ring-black/5">
                            {oferta.zdjecie_url ? (
                                <img src={oferta.zdjecie_url} alt={oferta.material} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-slate-50">
                                    <div className="text-6xl mb-2 italic font-serif">?</div>
                                    <span className="text-xs font-medium uppercase tracking-widest">Brak zdjęcia</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-[32px] border shadow-sm space-y-4">
                            <h1 className="text-3xl font-black text-gray-900 leading-tight uppercase tracking-tight">
                                {oferta.material}
                            </h1>
                            <div className="flex flex-wrap gap-3 items-center">
                                <span className="bg-green-600 text-white px-4 py-2 rounded-2xl text-2xl font-black shadow-lg shadow-green-200">
                                    {oferta.cena} zł / t
                                </span>
                                <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl text-lg font-bold border border-blue-100">
                                    Dostępne: {oferta.waga} t
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 pt-4 border-t border-dashed">
                                <MapPin size={20} className="text-green-500" />
                                <span className="font-bold text-lg">{oferta.lokalizacja}</span>
                            </div>
                        </div>

                        {/* KONTAKT - z dodatkowym marginesem dolnym mb-10 */}
                        <a
                            href={`tel:${oferta.telefon}`}
                            className="block bg-green-600 p-6 rounded-[32px] shadow-xl text-white hover:bg-green-700 transition-all transform hover:-translate-y-1 active:scale-95 group mb-10"
                        >
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-3 flex items-center gap-2">
                                <Phone size={16} /> Kontakt do sprzedawcy
                            </h3>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-black tracking-tighter">
                                    {oferta.telefon}
                                </span>
                                <div className="bg-white/20 p-3 rounded-2xl">
                                    <Phone size={24} fill="currentColor" />
                                </div>
                            </div>
                            <p className="text-xs mt-4 font-medium py-2 border-t border-white/10 text-center uppercase tracking-widest">
                                Kliknij, aby zadzwonić
                            </p>
                        </a>
                    </div>

                    {/* PRAWA KOLUMNA */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-[32px] border shadow-sm">
                            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                                <Info size={18} className="text-blue-500" /> Parametry
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Kod odpadu</p>
                                    <p className="font-black text-slate-700">{oferta.bdo_code || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Zanieczyszczenie</p>
                                    <p className="font-black text-slate-700">{oferta.impurity}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[32px] border shadow-sm">
                            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                                <Truck size={18} className="text-orange-500" /> Logistyka
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                                        <Truck size={20} className="text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Transport</p>
                                        <p className="text-sm font-bold text-slate-700 leading-tight">{oferta.logistics || 'Do ustalenia'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                        <Clock size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Załadunek</p>
                                        <p className="text-sm font-bold text-slate-700 leading-tight">{oferta.pickup_hours || 'Brak danych'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[32px] border shadow-sm">
                            <h3 className="font-black text-gray-900 mb-2 text-sm uppercase tracking-widest">Opis</h3>
                            <div className="p-4 bg-slate-50 rounded-2xl min-h-[100px]">
                                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                                    {oferta.opis || 'Brak dodatkowego opisu dla tej oferty.'}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}