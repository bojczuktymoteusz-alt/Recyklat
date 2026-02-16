'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Recycle, ArrowRight, BarChart3, ShieldCheck,
  Zap, Package, MapPin, TrendingUp
} from 'lucide-react';

interface Oferta {
  id: number;
  material: string;
  waga: number;
  lokalizacja: string;
  status?: string;
}

export default function Home() {
  const [stats, setStats] = useState({ count: 0, tonnage: 0 });
  const [recentOffers, setRecentOffers] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Pobieramy statystyki ogólne
        const { data: allData, error: statsError } = await supabase
          .from('oferty')
          .select('waga');

        if (!statsError && allData) {
          const totalWaga = allData.reduce((acc, curr) => acc + (curr.waga || 0), 0);
          setStats({
            count: allData.length,
            tonnage: parseFloat((Number(totalWaga) || 0).toFixed(1))
          });
        }

        // 2. Pobieramy 3 najnowsze oferty (Social Proof)
        const { data: latestData, error: recentError } = await supabase
          .from('oferty')
          .select('id, material, waga, lokalizacja, status')
          .order('created_at', { ascending: false })
          .limit(3);

        if (!recentError && latestData) {
          setRecentOffers(latestData);
        }

      } catch (err) {
        console.error("Błąd połączenia z bazą:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900">

      {/* --- SEKCJA HERO --- */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-50">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-8">
            <TrendingUp size={14} /> System Obiegu Zamkniętego B2B
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
            Zmień odpady <br />
            <span className="text-blue-600">w kapitał</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-xl mb-12 leading-relaxed">
            Najszybsza w Polsce giełda surowców wtórnych. Wystaw towar w 30 sekund i zoptymalizuj koszty logistyki oraz BDO.
          </p>

          <div className="flex flex-col md:flex-row gap-4 mb-16">
            <Link href="/dodaj" className="bg-slate-900 text-white px-10 py-6 rounded-[24px] font-black text-xl uppercase tracking-tighter hover:bg-blue-600 transition-all shadow-2xl hover:-translate-y-1 text-center">
              Wystaw towar teraz
            </Link>
            <Link href="/rynek" className="bg-white border-2 border-slate-200 px-10 py-6 rounded-[24px] font-black text-xl uppercase tracking-tighter hover:border-slate-900 transition-all text-center">
              Kup Surowiec
            </Link>
          </div>

          {/* TWOJE STATYSTYKI (Wkomponowane w Hero) */}
          <div className="flex gap-4 max-w-md">
            <div className="flex-1 bg-slate-50 p-6 rounded-[32px] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Aktywne Oferty</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.count}</p>
            </div>
            <div className="flex-1 bg-slate-50 p-6 rounded-[32px] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Łączny Tonaż</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.tonnage}<span className="text-lg ml-1 text-blue-600">t</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SEKCJA: OSTATNIO NA RYNKU (SOCIAL PROOF) --- */}
      <section className="py-24 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Ostatnio dodane</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2 italic">Real-time market feed</p>
            </div>
            <Link href="/rynek" className="text-blue-600 font-black uppercase text-xs flex items-center gap-2 hover:gap-4 transition-all">
              Zobacz cały rynek <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {!loading && recentOffers.map((o) => (
              <Link href={`/rynek/${o.id}`} key={o.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <Package className="text-slate-300 group-hover:text-blue-600" size={24} />
                  </div>
                  {o.status === 'sprzedane' ? (
                    <span className="bg-red-50 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">Sprzedane</span>
                  ) : (
                    <span className="bg-green-50 text-green-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">Aktywne</span>
                  )}
                </div>
                <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight mb-1 truncate">{o.material}</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1 mb-6">
                  <MapPin size={12} /> {o.lokalizacja}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-blue-600 font-black text-xl">{o.waga} t</span>
                  <ArrowRight className="text-slate-200 group-hover:text-blue-600 transition-colors" size={20} />
                </div>
              </Link>
            ))}
            {recentOffers.length === 0 && !loading && (
              <div className="col-span-3 py-10 text-center border-2 border-dashed border-slate-200 rounded-[32px]">
                <p className="text-slate-400 font-black uppercase text-[10px]">Oczekiwanie na nowe ogłoszenia...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- SEKCJA: WARTOŚCI BIZNESOWE --- */}
      <section className="py-32">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-20 leading-none">
            Profesjonalne narzędzie <br className="hidden md:block" />
            dla <span className="text-blue-600 font-black italic">Recyklingu.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                <BarChart3 size={32} />
              </div>
              <h4 className="font-black uppercase tracking-tight text-lg">Ceny rynkowe</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">Rozmawiaj bezpośrednio z recyklerami. Bez pośredników, bez ukrytych prowizji.</p>
            </div>

            <div className="space-y-6">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck size={32} />
              </div>
              <h4 className="font-black uppercase tracking-tight text-lg">Zgodność BDO</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">Szybka rotacja magazynu to łatwiejsza ewidencja i bezpieczeństwo prawne Twojej firmy.</p>
            </div>

            <div className="space-y-6">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                <Zap size={32} />
              </div>
              <h4 className="font-black uppercase tracking-tight text-lg">Błyskawiczna sprzedaż</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">Twoje ogłoszenie trafia bezpośrednio do sprawdzonych odbiorców. Oszczędzaj czas na szukaniu kupców.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- STOPKA Z LINKAMI PRAWNYMI --- */}
      <footer className="py-12 border-t border-slate-50">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-2 rounded-xl">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <span className="font-black tracking-tighter uppercase text-xl">Recyklat</span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <nav className="flex gap-6 text-[10px] font-black uppercase tracking-widest">
              <Link href="/regulamin" className="text-slate-400 hover:text-blue-600 transition-colors">
                Regulamin
              </Link>
              <Link href="/polityka-prywatnosci" className="text-slate-400 hover:text-blue-600 transition-colors">
                Polityka prywatności
              </Link>
            </nav>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest md:border-l md:border-slate-200 md:pl-8">
              © 2026 Recyklat B2B System
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}