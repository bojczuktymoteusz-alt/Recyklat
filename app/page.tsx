'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Recycle } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState({ count: 0, tonnage: 0 });

  useEffect(() => {
    async function fetchStats() {
      // Pobieramy dane z bazy, żeby liczniki były prawdziwe
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
    }
    fetchStats();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">

        {/* Logo i Nagłówek */}
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
            <Recycle className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">RECYKLAT</h1>
        <p className="text-xs font-bold text-blue-600 tracking-widest mb-8">GIEŁDA SUROWCÓW</p>

        {/* Statystyki */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Aktywne Oferty</p>
            <p className="text-2xl font-black text-slate-800">{stats.count}</p>
          </div>
          <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Łączny Tonaż</p>
            <p className="text-2xl font-black text-slate-800">{stats.tonnage} t</p>
          </div>
        </div>

        {/* Przyciski */}
        <div className="space-y-3">
          <Link href="/dodaj" className="block w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg">
            Wystaw towar na giełdę
          </Link>

          <Link href="/gielda" className="block w-full bg-white text-slate-700 py-4 rounded-xl font-bold border-2 border-gray-100 hover:bg-gray-50 transition">
            Przeglądaj ogłoszenia
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-400 font-medium">
          Zarządzaj surowcami wtórnymi szybko i profesjonalnie.
        </p>
      </div>
    </main>
  );
}