'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
// Dodajemy ikonę X do czyszczenia filtra i Search do lupy
import { MapPin, Phone, Filter, Search, ArrowRight, X, Ghost } from 'lucide-react';

// Kategorie do filtrów (takie same jak w formularzu + "Wszystkie")
const KATEGORIE = [
  "Wszystkie",
  "Folia LDPE (stretch)",
  "Folia kolorowa",
  "Tworzywa sztuczne (mix)",
  "Makulatura (karton)",
  "Makulatura (gazeta)",
  "Złom stalowy",
  "Złom kolorowy",
  "Drewno / Palety",
  "Inne"
];

export default function GieldaPage() {
  const [oferty, setOferty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- NOWE STANY DO WYSZUKIWARKI ---
  const [szukaj, setSzukaj] = useState('');
  const [kategoria, setKategoria] = useState('Wszystkie');

  useEffect(() => {
    pobierzOferty();
  }, []);

  const pobierzOferty = async () => {
    // Pobieramy najnowsze na górze
    const { data, error } = await supabase
      .from('oferty')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Błąd pobierania ofert:', error);
    } else {
      setOferty(data || []);
    }
    setLoading(false);
  };

  // --- LOGIKA FILTROWANIA ---
  // Filtrujemy listę ofert w czasie rzeczywistym
  const przefiltrowaneOferty = oferty.filter((oferta) => {
    // 1. Sprawdź czy pasuje do kategorii
    const pasujeKategoria = kategoria === 'Wszystkie' || oferta.material === kategoria;

    // 2. Sprawdź czy pasuje do tekstu (szukamy w materiale i lokalizacji)
    const tekst = szukaj.toLowerCase();
    const pasujeTekst =
      oferta.material.toLowerCase().includes(tekst) ||
      oferta.lokalizacja.toLowerCase().includes(tekst);

    return pasujeKategoria && pasujeTekst;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Nagłówek */}
      <header className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-lg sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Giełda Odpadów</h1>
            <p className="text-slate-400 text-xs font-bold">Znajdź surowiec dla siebie</p>
          </div>
          {/* Przycisk odświeżania */}
          <button onClick={() => { setLoading(true); pobierzOferty(); }} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition-colors">
            <Filter size={20} className="text-blue-400" />
          </button>
        </div>

        {/* --- WYSZUKIWARKA --- */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Szukaj (np. folia, Katowice)..."
            className="w-full pl-11 pr-4 py-3 bg-slate-800 rounded-xl text-white placeholder-slate-500 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={szukaj}
            onChange={(e) => setSzukaj(e.target.value)}
          />
          <Search className="absolute left-3 top-3.5 text-slate-500" size={20} />
          {szukaj && (
            <button onClick={() => setSzukaj('')} className="absolute right-3 top-3.5 text-slate-500 hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>

        {/* --- FILTRY KATEGORII (Poziomy scroll) --- */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {KATEGORIE.map((kat) => (
            <button
              key={kat}
              onClick={() => setKategoria(kat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${kategoria === kat
                  ? 'bg-blue-600 text-white shadow-md transform scale-105'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
            >
              {kat}
            </button>
          ))}
        </div>
      </header>

      {/* Lista Ofert */}
      <main className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-400 font-bold">Ładowanie giełdy...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wyświetlamy przefiltrowane oferty */}
            {przefiltrowaneOferty.length > 0 ? (
              przefiltrowaneOferty.map((oferta) => (
                <div key={oferta.id} className="bg-white p-5 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 group cursor-pointer relative overflow-hidden">

                  {/* Link nakładka na całość */}
                  <Link href={`/gielda/${oferta.id}`} className="absolute inset-0 z-10"></Link>

                  {/* Data dodania (prawy górny róg) */}
                  <div className="absolute top-5 right-5 text-[10px] font-bold text-gray-300 bg-gray-50 px-2 py-1 rounded-lg">
                    {formatDistanceToNow(new Date(oferta.created_at), { addSuffix: true, locale: pl })}
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    {/* Miniatura zdjęcia (jeśli jest) */}
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden border border-gray-100">
                      {oferta.zdjecie_url ? (
                        <img src={oferta.zdjecie_url} alt="Towar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Filter size={24} />
                        </div>
                      )}
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-slate-800 leading-tight mb-1">{oferta.material}</h2>
                      {/* Wyświetlamy opis skrócony, jeśli istnieje */}
                      {oferta.opis && (
                        <p className="text-xs text-gray-400 line-clamp-2">{oferta.opis}</p>
                      )}
                    </div>
                  </div>

                  {/* Sekcja Cena i Waga */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-green-50 p-3 rounded-2xl">
                      <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Cena</p>
                      <p className="text-base font-black text-green-700">
                        {oferta.cena ? `${oferta.cena} zł/t` : 'Do negocjacji'}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-2xl">
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Ilość</p>
                      <p className="text-base font-black text-blue-700">{oferta.waga} t</p>
                    </div>
                  </div>

                  {/* Przycisk zachęcający do kliknięcia */}
                  <div className="mb-4 flex justify-center">
                    <span className="bg-gray-50 text-blue-600 text-xs font-bold px-4 py-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center gap-2 shadow-sm">
                      Zobacz szczegóły <ArrowRight size={14} />
                    </span>
                  </div>

                  {/* Stopka z lokalizacją */}
                  <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-gray-400">
                    <MapPin size={14} />
                    <span className="text-xs font-bold">{oferta.lokalizacja}</span>
                  </div>
                </div>
              ))
            ) : (
              // Komunikat gdy nic nie znaleziono
              <div className="text-center py-12 text-gray-400">
                <Ghost size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg">Brak ofert</p>
                <p className="text-sm">Nie znaleźliśmy tego, czego szukasz.</p>
                <button
                  onClick={() => { setSzukaj(''); setKategoria('Wszystkie'); }}
                  className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                >
                  Wyczyść filtry
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button (Plus) */}
      <Link href="/dodaj" className="fixed bottom-6 right-6 bg-slate-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:bg-slate-800 transition-transform hover:scale-110 active:scale-90 border-4 border-white z-20">
        <span className="text-3xl font-light mb-1">+</span>
      </Link>
    </div>
  );
}