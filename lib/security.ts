// lib/security.ts

/**
 * Usuwa tagi HTML i niebezpieczne znaki z tekstu.
 * Zapobiega wrzucaniu skryptów do opisów i tytułów.
 */
export const sanitizeText = (text: string): string => {
    if (!text) return "";
    return text
        .replace(/</g, "&lt;") // Zamień < na bezpieczny znak
        .replace(/>/g, "&gt;") // Zamień > na bezpieczny znak
        .trim(); // Usuń białe znaki z początku i końca
};

/**
 * Sprawdza, czy URL jest bezpieczny (zaczyna się od http/https).
 * Blokuje ataki typu javascript:alert(1)
 */
export const validateUrl = (url: string): boolean => {
    if (!url) return true; // Pusty URL jest OK (opcjonalny)
    const pattern = /^(https?:\/\/)/i; // Musi zaczynać się od http:// lub https://
    return pattern.test(url);
};