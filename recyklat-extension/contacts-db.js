/**
 * contacts-db.js
 * Recyklat.pl Chrome Extension — Baza kontaktów
 *
 * Zawiera:
 * 1. HARDCODED_CONTACTS — wyczyszczone dane z pliku tekstowego
 * 2. ContactsDB — klasa do zarządzania bazą (plik + localStorage)
 */

// ─────────────────────────────────────────────
// 1. BAZA BAZOWA (wygenerowana ze skryptu parse)
// ─────────────────────────────────────────────
const HARDCODED_CONTACTS = [
  { name: "Trans Plast Recykling Sp. z o.o.", notes: "" },
  { name: "Cheko Sp. z o.o. Zakłady Wytwórcze", notes: "" },
  { name: "SPDC international Sp. z o.o.", notes: "" },
  { name: "Zaptech Sp.j. Sobańscy", notes: "" },
  { name: "Robert Kędziora", notes: "plastik" },
  { name: "Piotr Ka", notes: "palety" },
  { name: "Paweł Gutglik", notes: "skorupy jajek" },
  { name: "Mariusz Szymański", notes: "Folia PET" },
  { name: "Galax Truck", notes: "plastiki samochodowe" },
  { name: "Andriej Andyk", notes: "żółty worek 150102" },
  { name: "Pietrek Ka", notes: "podkłady kolejowe" },
  { name: "Radosław Sikorski", notes: "LDPE/LLDPE" },
  { name: "Aleksander Pihowicz", notes: "odpad160103" },
  { name: "Mateusz Panasewicz", notes: "zmielona samochodówka" },
  { name: "Agnieszka Domińczak", notes: "PCV" },
  { name: "Marcin Smoliński", notes: "zużyte big bagi" },
  { name: "EBEKO", notes: "regranulat" },
  { name: "Filip Kalinowski", notes: "" },
  { name: "Grzegorz Gajewski", notes: "Odpad 17 09 04" },
  { name: "Paweł Grand", notes: "przemiał ABS" },
  { name: "NEXO group", notes: "" },
  { name: "ARMB Odzsyk", notes: "stretch, sianokiszonka" },
  { name: "Katarzyna Rżysko", notes: "PPHU ANNA Recykling tworzyw sztucznych" },
  { name: "Tomek Du", notes: "przyjmę odpady, przemiały" },
  { name: "Rafał Garbień", notes: "PCV granulat" },
  { name: "Tomek Spychalski", notes: "zużyta farba" },
  { name: "Patryk Nguyen", notes: "akumulatory" },
  { name: "Krystian Mogiła", notes: "zbelowane butelki" },
  { name: "Damian Suduł", notes: "otuliny po przewodach" },
  { name: "Chris Burn", notes: "" },
  { name: "Łukasz Nowak", notes: "" },
  { name: "Andrzej Kuderski", notes: "" },
  { name: "Miłosz Kuczmierczyk", notes: "" },
  { name: "Angelika Rozmus", notes: "" },
  { name: "Robert Bilecki", notes: "" },
  { name: "Dawid Drozdowski", notes: "" },
  { name: "Marcin Sitkowski", notes: "" },
  { name: "Agnieszka Kiljańczyk", notes: "" },
  { name: "Arkadiusz Kruszyński", notes: "" },
  { name: "Paweł Dróżdż", notes: "" },
  { name: "Mateusz Góra", notes: "" },
  { name: "Damian Przybycień", notes: "" },
  { name: "Sebastian Szafarczyk", notes: "" },
  { name: "Katarzyna KG", notes: "" },
  { name: "Mateusz Wrycza", notes: "" },
  { name: "Radek Jillek", notes: "" },
  { name: "Maciej Zyk", notes: "" },
  { name: "Kuba Tomalik", notes: "" },
  { name: "Ewelina Folan", notes: "" },
  { name: "Marta Fiedoruk", notes: "" },
  { name: "Artur Zawal", notes: "" },
  { name: "Paweł Nowak", notes: "" },
  { name: "Krzysztof Cimoszyński", notes: "" },
  { name: "Patryk Semmling", notes: "" },
  { name: "Hubert Marszałek", notes: "" },
  { name: "Marysia Kowalska", notes: "" },
  { name: "Charlie Wes", notes: "" },
  { name: "Marcin Gieroll", notes: "" },
  { name: "Karol Karbowski", notes: "" },
  { name: "Jerry Kolat", notes: "" },
  { name: "Sławomir Rusnak", notes: "" },
  { name: "Grzegorz Oleksinski", notes: "" },  // złączone — fuzzy matching rozpozna
  { name: "Paulina Wierzbowska", notes: "" },
  { name: "Marcin Jurgiewicz", notes: "" },
  { name: "Paweł Hałupka", notes: "" },
  { name: "Szymon Sawicki", notes: "" },
  { name: "Szymon Bartkowiak", notes: "" },
  { name: "Mariusz Bryk", notes: "" },
  { name: "Dominik Bodzon", notes: "" },
  { name: "Krzysztof Smol", notes: "" },
  { name: "Ernest Mackiewicz", notes: "" },
  { name: "Szymon Garbacz", notes: "" },
  { name: "Anton Dmytriienko", notes: "" },
  { name: "Kuba Gliński", notes: "PMMA płyta" },
  { name: "Filip Bilecki", notes: "granulat PVC" },
  { name: "Marcin Kurach", notes: "przemiał PE" },
  { name: "Grzegorz Bagiński", notes: "granulat" },
  { name: "Patryk Fromas", notes: "LDPE Bralen" },
  { name: "Damian Kłoska", notes: "barwnik czarny do PP" },
  { name: "Anna SK Rec", notes: "przemiał PP" },
  { name: "Krystian Kowalski", notes: "granulat PET" },
  { name: "Marcin Kubczak", notes: "przemiał PC/ABS" },
  { name: "Daniel Rzadkowolski", notes: "regranulaty" },
  { name: "Krzysztof Cimoszynski", notes: "" },
  { name: "AM PRIME", notes: "PS" },
  { name: "Dorian Kuźmiak", notes: "TPE" },
  { name: "EMABO", notes: "PP" },
  { name: "Kamila Działak", notes: "szukam 10 01 03" },
  { name: "Monika Mazur", notes: "odpady produkcyjne, folia" },
  { name: "Martyna Jerzyk", notes: "DPR" },
  { name: "Grzegorz Kozaczyński", notes: "ABS przemiał" },
  { name: "Ap-logic Utylizacja", notes: "surowce" },
  { name: "Plo Lukasz", notes: "odpady kolejowe zakup" },
  { name: "Marlena Nikolaj", notes: "gabaryt mielony" },
  { name: "Jacek Makuch", notes: "odpad poszlifierski" },
  { name: "Maciej Kustra", notes: "folia transparentna" },
  { name: "Ruslan Servinski", notes: "taśmociągi lub kawałki taśm" },
  { name: "Przemek Firląg", notes: "karton 150101" },
  { name: "Mateusz Chojnacki", notes: "Folia niebieska owoce/warzywa" },
  { name: "Piotr Szymorek", notes: "olej przepracowany skup" },
  { name: "Radomir Kubiński", notes: "odpad poprodukcyjny HDPE PE100" },
  { name: "Artur Kulesza", notes: "folia rolnicza" },
  { name: "Paweł Jagan", notes: "gilzy Rzeszów" },
  { name: "Paulina Kowalska", notes: "odbiór odpadów darmowy" },
  { name: "Arkadiusz Okoń", notes: "EPDM" },
  { name: "Andrzej New", notes: "LDPE" },
  { name: "Jarosław Maszorek", notes: "usługa rozdrabniania" },
  { name: "Lukas Cichy", notes: "" },
  { name: "Evergreen Solutions", notes: "" },
  { name: "Rafał Lukoszek", notes: "" },
  { name: "Mateusz Piasecki", notes: "regranulat HDPE" },
  { name: "FS-Recykling", notes: "Folia transparentna PVC, Pulver" },
  { name: "Thomas Anderson", notes: "regranulat" },
  { name: "ARplast Recykling", notes: "PA66 +25% GF" },
  { name: "Paulina Salamońska", notes: "HDPE" },
  { name: "Sebastian Dudek", notes: "" },
  { name: "Paweł Dołęga", notes: "" },
  { name: "Sebastian Gibus", notes: "19 12 08, 20 01 10, 20 01 11 — duże ilości" },
  { name: "Marlena Kowalska", notes: "odpady 19 09 02 śląskie" },
  { name: "Ralf Szybki", notes: "" },
  { name: "Omega Recycling", notes: "odpad poprodukcyjny" },
  { name: "MAR-PAC", notes: "produkcja folii" },
];

// ─────────────────────────────────────────────
// 2. KLASA ZARZĄDZAJĄCA BAZĄ
// ─────────────────────────────────────────────
class ContactsDB {
  static STORAGE_KEY = "recyklat_extra_contacts";

  /**
   * Pobiera wszystkie kontakty: hardcoded + dodane przez użytkownika
   */
  static async getAll() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        const extra = result[this.STORAGE_KEY] || [];
        resolve([...HARDCODED_CONTACTS, ...extra]);
      });
    });
  }

  /**
   * Dodaje nowy kontakt do lokalnej pamięci (nie nadpisuje pliku bazowego)
   */
  static async add(name, notes = "") {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        const extra = result[this.STORAGE_KEY] || [];
        // Unikaj duplikatów
        const exists = extra.some(
          (c) => c.name.toLowerCase() === name.toLowerCase()
        );
        if (!exists) {
          extra.push({ name: name.trim(), notes: notes.trim(), addedByUser: true });
          chrome.storage.local.set({ [this.STORAGE_KEY]: extra }, () => {
            resolve({ success: true, contact: { name, notes } });
          });
        } else {
          resolve({ success: false, reason: "duplicate" });
        }
      });
    });
  }

  /**
   * Zwraca listę kontaktów dodanych ręcznie przez użytkownika
   */
  static async getUserAdded() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || []);
      });
    });
  }

  /**
   * Usuwa kontakt dodany przez użytkownika (nie można usunąć hardcoded)
   */
  static async remove(name) {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        const extra = (result[this.STORAGE_KEY] || []).filter(
          (c) => c.name.toLowerCase() !== name.toLowerCase()
        );
        chrome.storage.local.set({ [this.STORAGE_KEY]: extra }, resolve);
      });
    });
  }
}

// Eksportuj globalnie (content scripts nie używają ES modules)
window.ContactsDB = ContactsDB;
window.HARDCODED_CONTACTS = HARDCODED_CONTACTS;
