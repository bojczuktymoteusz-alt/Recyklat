import React from 'react';

export default function RegulaminPage() {
    return (
        <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6', fontFamily: 'sans-serif' }}>
            <h1>Regulamin serwisu Recyklat.pl</h1>
            <p>Ostatnia aktualizacja: 16 lutego 2026 r.</p>

            <section>
                <h2>1. Postanowienia ogólne</h2>
                <p>Właścicielem i administratorem serwisu internetowego dostępnego pod adresem <strong>recyklat.pl</strong> z siedzibą na ul. Okólna 111/27, 42-218 Częstochowa, jest Tymoteusz Bojczuk.  <strong>Recyklat.pl</strong> jest platformą typu marketplace, służącą do nawiązywania kontaktów handlowych w branży recyklingu.</p>
            </section>

            <section>
                <h2>2. Charakter usług</h2>
                <p>Platforma Recyklat.pl umożliwia użytkownikom publikowanie ogłoszeń dotyczących sprzedaży i zakupu surowców wtórnych.</p>
                <p>Operator serwisu nie jest stroną transakcji i nie ponosi odpowiedzialności za nienależyte wykonanie zobowiązań przez użytkowników.</p>
            </section>

            <section>
                <h2>3. Obowiązki Użytkownika</h2>
                <p>Użytkownik zobowiązuje się do podawania danych zgodnych ze stanem faktycznym oraz posiadania wszelkich wymaganych prawem zezwoleń na obrót odpadami (np. wpis do BDO).</p>
            </section>

            <section>
                <h2>4. Kontakt</h2>
                <p>Wszelkie pytania dotyczące regulaminu należy kierować na adres e-mail: kontakt@recyklat.pl</p>
            </section>

            <div style={{ marginTop: '40px' }}>
                <a href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>← Powrót do strony głównej</a>
            </div>
        </main>
    );
}