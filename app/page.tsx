'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Recycle, ArrowRight, BarChart3, ShieldCheck,
  Zap, Package, MapPin, TrendingUp,
  ShoppingBag, ArrowDownToLine
} from 'lucide-react';

interface Oferta {
  id: number;
  material: string;
  waga: number;
  lokalizacja: string;
  status?: string;
  typ_oferty?: string;
}

export default function Home() {
  const [stats, setStats] = useState({ count: 0, tonnage: 0 });
  const [recentOffers, setRecentOffers] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: allData, error: statsError } = await supabase
          .from('oferty')
          .select('waga, typ_oferty, status');

        if (!statsError && allData) {
          const totalWaga = allData
            .filter(o => o.typ_oferty !== 'kupie' && o.status !== 'sprzedane')
            .reduce((acc, curr) => acc + (curr.waga || 0), 0);

          setStats({
            count: allData.length,
            tonnage: parseFloat((Number(totalWaga) || 0).toFixed(1))
          });
        }

        const { data: latestData, error: recentError } = await supabase
          .from('oferty')
          .select('id, material, waga, lokalizacja, status, typ_oferty')
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
      <header className="absolute top-0 left-0 w-full z-50">
        <div className="max-w-5xl mx-auto px-6 py-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-2 rounded-xl group-hover:bg-slate-900 transition-colors shadow-md">
              <Recycle className="w-6 h-6 text-white" />
            </div>
            <span className="font-black tracking-tighter uppercase text-2xl text-slate-900 group-hover:text-blue-600 transition-colors">
              Recyklat
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 font-black text-xs uppercase tracking-widest text-slate-500">
            <Link href="/rynek" className="hover:text-slate-900 transition-colors">Giełda</Link>
            <Link href="/dodaj" className="text-blue-600 hover:text-slate-900 transition-colors">+ Dodaj Ogłoszenie</Link>
          </nav>
        </div>
      </header>

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
            Najszybsza w Polsce giełda surowców wtórnych. Kupuj, sprzedawaj i zgłaszaj zapotrzebowanie w 30 sekund.
          </p>

          <div className="flex flex-col md:flex-row gap-4 mb-16">
            <Link href="/dodaj" className="bg-slate-900 text-white px-10 py-6 rounded-[24px] font-black text-xl uppercase tracking-tighter hover:bg-blue-600 transition-all shadow-2xl hover:-translate-y-1 text-center">
              DODAJ OGŁOSZENIE
            </Link>
            <Link href="/rynek" className="bg-white border-2 border-slate-200 px-10 py-6 rounded-[24px] font-black text-xl uppercase tracking-tighter hover:border-slate-900 transition-all text-center">
              PRZEGLĄDAJ GIEŁDĘ
            </Link>
          </div>

          <div className="flex gap-4 max-w-md">
            <div className="flex-1 bg-slate-50 p-6 rounded-[32px] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Aktywne Ogłoszenia</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.count}</p>
            </div>
            <div className="flex-1 bg-slate-50 p-6 rounded-[32px] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dostępny Tonaż</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.tonnage}<span className="text-lg ml-1 text-blue-600">t</span></p>
            </div>
          </div>
        </div>
      </section>

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
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${o.typ_oferty === 'kupie' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                    {o.typ_oferty === 'kupie' ? <ArrowDownToLine className="text-blue-600" size={24} /> : <ShoppingBag className="text-emerald-600" size={24} />}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {o.typ_oferty === 'kupie' ? (
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest border border-blue-100">Kupię</span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest border border-emerald-100">Sprzedam</span>
                    )}
                  </div>
                </div>
                <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight mb-1 truncate">{o.material}</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1 mb-6">
                  <MapPin size={12} /> {o.lokalizacja}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-slate-900 font-black text-xl">{o.waga > 0 ? `${o.waga} t` : '-'}</span>
                  <ArrowRight className="text-slate-200 group-hover:text-blue-600 transition-colors" size={20} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Reszta stopki i wartości... */}
      <footer className="py-12 border-t border-slate-50">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
          <span className="font-black uppercase text-xl">Recyklat</span>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">© 2026 Recyklat B2B System</p>
        </div>
      </footer>
    </main>
  );
}