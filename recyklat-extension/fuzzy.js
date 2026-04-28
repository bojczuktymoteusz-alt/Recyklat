/**
 * fuzzy.js
 * Recyklat.pl Chrome Extension — Silnik elastycznego dopasowania nazwisk
 *
 * Algorytm:
 * 1. Normalizacja (usuń znaki diakrytyczne, małe litery, usuń spacje)
 * 2. Levenshtein distance — dopuszcza literówki
 * 3. Token matching — "Kuba Gliński" vs "KubaGlinski" (brak spacji)
 * 4. Substring matching — imię lub nazwisko zawarte w ciągu
 */

const FuzzyMatcher = (() => {

  // Mapa polskich znaków diakrytycznych
  const DIACRITICS = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
    'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l', 'Ń': 'n',
    'Ó': 'o', 'Ś': 's', 'Ź': 'z', 'Ż': 'z',
  };

  /**
   * Normalizuje string: usuń diakrytyki, zamień na małe litery
   */
  function normalize(str) {
    if (!str) return '';
    return str
      .split('')
      .map((ch) => DIACRITICS[ch] || ch)
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ''); // usuń wszystko poza literami i cyframi
  }

  /**
   * Odległość Levenshteina między dwoma stringami
   */
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    return dp[m][n];
  }

  /**
   * Oblicza próg dopuszczalnego błędu w zależności od długości stringa
   * Krótkie nazwiska (<=5 znaków) — max 1 błąd
   * Długie — max 2 błędy
   */
  function threshold(len) {
    if (len <= 4) return 0;
    if (len <= 7) return 1;
    return 2;
  }

  /**
   * Główna funkcja dopasowania.
   * @param {string} fbName — nazwa z Facebooka
   * @param {Array<{name: string, notes: string}>} contacts — baza kontaktów
   * @returns {{ matched: boolean, contact: object|null, score: number, method: string }}
   */
  function match(fbName, contacts) {
    const fbNorm = normalize(fbName);
    if (!fbNorm) return { matched: false, contact: null, score: 0, method: 'none' };

    let bestResult = { matched: false, contact: null, score: 0, method: 'none' };

    for (const contact of contacts) {
      const contactNorm = normalize(contact.name);
      if (!contactNorm) continue;

      // ── Metoda 1: Pełne dopasowanie (exact) ──────────────────────────────
      if (fbNorm === contactNorm) {
        return { matched: true, contact, score: 100, method: 'exact' };
      }

      // ── Metoda 2: Levenshtein na pełnych nazwach ─────────────────────────
      const dist = levenshtein(fbNorm, contactNorm);
      const thr = threshold(Math.max(fbNorm.length, contactNorm.length));
      if (dist <= thr) {
        const score = 90 - dist * 10;
        if (score > bestResult.score) {
          bestResult = { matched: true, contact, score, method: 'levenshtein' };
        }
        continue;
      }

      // ── Metoda 3: Token matching (złączone imię+nazwisko bez spacji) ──────
      // Np. "grzegorzoleksinski" zawiera tokeny "grzegorz" i "oleksinski"
      const contactTokens = contact.name
        .split(/\s+/)
        .map(normalize)
        .filter((t) => t.length > 2);

      if (contactTokens.length >= 2) {
        // Sprawdź czy fbNorm zawiera wszystkie tokeny z bazy
        const allTokensFound = contactTokens.every(
          (token) => fbNorm.includes(token) || levenshtein(fbNorm.slice(0, token.length + 2), token) <= 1
        );
        if (allTokensFound) {
          const score = 85;
          if (score > bestResult.score) {
            bestResult = { matched: true, contact, score, method: 'token-concat' };
          }
          continue;
        }

        // Sprawdź czy contactNorm (bez spacji) jest zawarty w fbNorm
        const contactConcat = contactTokens.join('');
        if (fbNorm.includes(contactConcat) || contactConcat.includes(fbNorm)) {
          const score = 82;
          if (score > bestResult.score) {
            bestResult = { matched: true, contact, score, method: 'token-concat-sub' };
          }
          continue;
        }
      }

      // ── Metoda 4: Substring — imię lub nazwisko w nazwie FB ──────────────
      // Jeśli w nazwie FB zawarte jest przynajmniej pierwsze słowo (imię)
      // I drugie słowo (nazwisko) z bazy
      if (contactTokens.length >= 2) {
        const firstName = contactTokens[0];
        const lastName = contactTokens[contactTokens.length - 1];
        const firstNameInFb = fbNorm.includes(firstName) ||
          levenshtein(fbNorm.substring(0, firstName.length), firstName) <= threshold(firstName.length);
        const lastNameInFb = fbNorm.includes(lastName) ||
          levenshtein(fbNorm.substring(fbNorm.length - lastName.length), lastName) <= threshold(lastName.length);

        if (firstNameInFb && lastNameInFb) {
          const score = 78;
          if (score > bestResult.score) {
            bestResult = { matched: true, contact, score, method: 'firstname-lastname' };
          }
        }
      }
    }

    return bestResult;
  }

  return { match, normalize, levenshtein };
})();

window.FuzzyMatcher = FuzzyMatcher;
