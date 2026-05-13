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
 * Formatuje cenę do wyświetlenia.
 * null/undefined/ujemna → "Do negocjacji"
 * 0                     → "Za darmo" (zawsze, dla każdego ogłoszenia)
 * liczba > 0            → "500 zł / t" (lub inna jednostka)
 */
export function formatCena(
    cena: number | null | undefined | string,
    jednostka: string | null | undefined = 't',
    isNowe: boolean = false
): string {
    // Konwertuj do liczby (obsługa stringów z bazy danych)
    let cenaNumer: number | null = null;
    if (typeof cena === 'string') {
        const trimmed = cena.trim();
        cenaNumer = trimmed === '' ? null : parseFloat(trimmed);
    } else if (typeof cena === 'number') {
        cenaNumer = cena;
    }
    
    if (cenaNumer === null || isNaN(cenaNumer) || cenaNumer < 0) return 'Do negocjacji';
    if (cenaNumer === 0) return 'Za darmo';
    const jed = jednostka || 't';
    return `${cenaNumer} zł / ${jed}`;
}

/**
 * Sprawdza czy tekst wygląda jak adres domenowy.
 */
export function wyglądaJakUrl(tekst: string | null | undefined): boolean {
    if (!tekst || !tekst.trim()) return false;
    const t = tekst.trim();
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

/**
 * Data graniczna wdrożenia funkcji "Za darmo".
 * Ogłoszenia dodane PRZED tą datą z cena=0 → "Do negocjacji"
 * Ogłoszenia dodane PO tej dacie z cena=0 → "Za darmo"
 */
export const DATA_WDROZENIA_ZA_DARMO = new Date('2026-05-11T00:00:00Z');

export function formatCenaZDatata(
    cena: number | null | undefined,
    jednostka: string | null | undefined,
    created_at: string | null | undefined
): string {
    const isNowe = created_at
        ? new Date(created_at) >= DATA_WDROZENIA_ZA_DARMO
        : false;
    return formatCena(cena, jednostka, isNowe);
}
