import React from 'react';
import Link from 'next/link';

export default function PolitykaPrywatnosciPage() {
    return (
        <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6', fontFamily: 'sans-serif' }}>
            <h1>Polityka Prywatności serwisu Recyklat.pl</h1>
            <p>Ostatnia aktualizacja: 16 lutego 2026 r.</p>

            <section style={{ marginTop: '30px' }}>
                <h2>1. Kto jest administratorem Twoich danych?</h2>
                <p>
                    Administratorem danych osobowych zbieranych za pośrednictwem serwisu jest <strong>recyklat.pl</strong>
                </p>
            </section>

            <section style={{ marginTop: '30px' }}>
                <h2>2. Jakie dane zbieramy i w jakim celu?</h2>
                <p>Przetwarzamy Twoje dane (np. adres e-mail, nazwa firmy, numer telefonu) w następujących celach:</p>
                <ul>
                    <li>Świadczenie usług drogą elektroniczną (założenie konta, publikacja ogłoszeń).</li>
                    <li>Komunikacja z użytkownikami (odpowiedzi na zapytania, powiadomienia systemowe).</li>
                    <li>Zapewnienie bezpieczeństwa i zapobieganie oszustwom.</li>
                </ul>
            </section>

            <section style={{ marginTop: '30px' }}>
                <h2>3. Komu udostępniamy dane?</h2>
                <p>
                    Twoje dane kontaktowe (jeśli wyrazisz na to zgodę, publikując ogłoszenie) są widoczne dla innych
                    zweryfikowanych użytkowników platformy w celu nawiązania transakcji handlowej.
                    Ponadto dane mogą być powierzane podmiotom wspierającym nasze usługi (np. dostawcy hostingu - Vercel, Supabase).
                </p>
            </section>

            <section style={{ marginTop: '30px' }}>
                <h2>4. Twoje prawa (RODO)</h2>
                <p>Zgodnie z RODO, przysługuje Ci prawo do:</p>
                <ul>
                    <li>Dostępu do swoich danych oraz otrzymania ich kopii.</li>
                    <li>Sprostowania (poprawiania) swoich danych.</li>
                    <li>Usunięcia danych (tzw. prawo do bycia zapomnianym).</li>
                    <li>Ograniczenia przetwarzania danych.</li>
                </ul>
                <p>W celu realizacji swoich praw skontaktuj się z nami pod adresem: <strong>bojczuktymoteusz@gmail.com</strong>.</p>
            </section>

            <section style={{ marginTop: '30px' }}>
                <h2>5. Pliki Cookies (Ciasteczka)</h2>
                <p>
                    Nasz serwis używa niezbędnych plików cookies do prawidłowego działania platformy (np. utrzymanie sesji logowania).
                    Korzystając z serwisu, zgadzasz się na ich wykorzystywanie.
                </p>
            </section>

            <div style={{ marginTop: '50px' }}>
                <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>
                    ← Powrót do strony głównej
                </Link>
            </div>
        </main>
    );
}