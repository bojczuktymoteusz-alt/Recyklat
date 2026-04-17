// lib/ofertaUtils.ts

/**
 * Generuje tytuł zastępczy gdy title === null
 */
export function getFallbackTitle(oferta: {
    title?: string | null;
    material?: string | null;
    form?: string | null;
    lokalizacja?: string | null;
}): string {
    if (oferta.title && oferta.title.trim()) return oferta.title.trim();
    const parts = [
        oferta.material,
        oferta.form && oferta.form !== 'Inne' ? oferta.form : null,
        oferta.lokalizacja,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' - ') : 'Oferta bez tytułu';
}

/**
 * Formatuje cenę do wyświetlenia. 0 lub -1 → "Do negocjacji"
 */
export function formatCena(cena: number | null | undefined): string {
    if (cena === null || cena === undefined || cena <= 0 || cena === -1) return 'Do negocjacji';
    return `${cena} zł/t`;
}

/**
 * Sprawdza czy tekst wygląda jak adres domenowy.
 * Rozpoznaje: interia.pl, www.firma.com, https://coś.eu, firma.com.pl itd.
 * Nie wymaga www ani protokołu.
 */
export function wyglądaJakUrl(tekst: string | null | undefined): boolean {
    if (!tekst || !tekst.trim()) return false;
    const t = tekst.trim();
    // Regex: opcjonalny protokół, opcjonalne www, segment nazwy, kropka, TLD (2-6 liter), opcjonalna ścieżka
    return /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,6})+([/?#].*)?$/.test(t);
}

/**
 * Dodaje https:// jeśli brakuje protokołu
 */
export function fixUrl(url: string | null | undefined): string {
    if (!url || !url.trim()) return '';
    const t = url.trim();
    if (/^https?:\/\//i.test(t)) return t;
    return `https://${t}`;
}

/**
 * Usuwa protokół i www z URL do wyświetlenia
 */
export function urlDoWyswietlenia(url: string | null | undefined): string {
    if (!url) return '';
    return url.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
}

/**
 * Czy oferta jest aktywna
 */
export function isAktywna(status: string | null | undefined): boolean {
    return !status || status === 'aktywna';
}

export function isOgolnopolska(lokalizacja: string | null | undefined): boolean {
    if (!lokalizacja) return false;
    const l = lokalizacja.toLowerCase();
    return l.includes('polska') || l.includes('cała');
}

export function isZagranica(lokalizacja: string | null | undefined): boolean {
    if (!lokalizacja) return false;
    const l = lokalizacja.toLowerCase();
    return l.includes('europa') || l.includes('zagranica');
}
