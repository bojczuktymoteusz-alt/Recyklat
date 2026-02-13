'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
// Upewnij się, że ta ścieżka jest poprawna. Jeśli błąd, spróbuj: '../lib/supabase'
import { supabase } from '@/lib/supabase';
import { Recycle } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState({ count: 0, tonnage: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Pobieramy dane z bazy
        const { data, error } = await supabase
          .from('oferty')
          .select('waga');

        if (!error && data) {
          const totalWaga = data.reduce((acc, curr) => acc + (curr.waga || 0), 0);
          setStats({
            count: data.length,
            tonnage: parseFloat((Number(totalWaga) || 0).toFixed(1))
          });
        }
      } catch (err) {
        console.error("Błąd połączenia z bazą:", err);
      }
    }
    fetchStats();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-4 border-white">

        {/* Logo i Nagłówek */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-5 rounded-3xl shadow-lg shadow-blue-200">
            {/* Jeśli tu jest błąd, wpisz w terminalu: npm install lucide-react */}
            <Recycle className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">RECYKLAT</h1>
        <p className="text-xs font-bold text-blue-600 tracking-[0.3em] uppercase mb-10">GIEŁDA SUROWCÓW</p>

        {/* Statystyki */}
        <div className="flex gap-4 mb-10">
          <div className="flex-1 bg-gray-50 p-4 rounded-3xl border border-gray-100">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Aktywne Oferty</p>
            <p className="text-3xl font-black text-slate-800">{stats.count}</p>
          </div>
          <div className="flex-1 bg-gray-50 p-4 rounded-3xl border border-gray-100">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Łączny Tonaż</p>
            <p className="text-3xl font-black text-slate-800">{stats.tonnage} t</p>
          </div>
        </div>

        {/* Przyciski */}
        <div className="space-y-4">
          <Link href="/dodaj" className="block w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-slate-800 transition shadow-xl active:scale-95 transform duration-200">
            Wystaw towar na giełdę
          </Link>

          {/* POPRAWIONY LINK: Zmieniono /gielda na /rynek */}
          <Link href="/rynek" className="block w-full bg-white text-slate-900 py-5 rounded-2xl font-bold border-2 border-gray-100 hover:bg-gray-50 transition shadow-sm active:scale-95 transform duration-200">
            Przeglądaj ogłoszenia
          </Link>
        </div>

        <p className="mt-10 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
          Recyklat B2B System v2.0
        </p>
      </div>
    </main>
  );
}