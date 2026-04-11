// lib/ofertaUtils.ts
// Wspólne helpery używane na stronie rynku, szczegółów i stronie głównej

/**
 * Generuje tytuł zastępczy gdy title === null
 * Wzór: "[Materiał] - [Forma] - [Lokalizacja]"
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
 * Formatuje cenę do wyświetlenia
 * -1 lub 0 → "Do negocjacji"
 */
export function formatCena(cena: number | null | undefined): string {
    if (cena === null || cena === undefined || cena <= 0 || cena === -1) {
        return 'Do negocjacji';
    }
    return `${cena} zł/t`;
}

/**
 * Czy oferta jest aktywna (widoczna na rynku)
 */
export function isAktywna(status: string | null | undefined): boolean {
    return !status || status === 'aktywna';
}

/**
 * Czy lokalizacja to "cały kraj"
 */
export function isOgolnopolska(lokalizacja: string | null | undefined): boolean {
    if (!lokalizacja) return false;
    const l = lokalizacja.toLowerCase();
    return l.includes('polska') || l.includes('cała') || l.includes('caly');
}

/**
 * Czy lokalizacja to zagranica
 */
export function isZagranica(lokalizacja: string | null | undefined): boolean {
    if (!lokalizacja) return false;
    const l = lokalizacja.toLowerCase();
    return l.includes('europa') || l.includes('zagranica') || l.includes('zagranicz');
}
