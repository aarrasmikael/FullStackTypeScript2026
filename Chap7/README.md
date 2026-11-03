# Chap7: React sovelluksen testaus (Vitest ja React Testing Library)

Harjoituksen koodi on kansiossa `chap7-vitest`. Mocking osuus on rajattu pois tehtävänannon mukaisesti.

## Ajaminen

```bash
cd Chap7/chap7-vitest
npm install
npm run test      # watch tila
npm run test:run  # ajaa testit kerran
```

## Sisältö

`src/CanDrive.test.ts` on ensimmäinen Vitest testi (test ja expect). `src/User.ts` ja `src/User.test.ts` esittelevät describe, it, beforeAll ja erilaisia matchereita (toBe, toBeGreaterThan, toContain, not). `src/App.test.tsx` on ensimmäinen React Testing Library testi, ja `src/setupVitest.ts` ottaa jest-domin käyttöön kaikissa testeissä. Testiympäristö (jsdom ja globals) on määritelty tiedostossa `vite.config.ts`.

## Mikä on Vitest ja mikä sen tehtävä React projektin testauksessa?

Vitest on testikehys ja testien ajaja, joka on tehty Viteen perustuviin projekteihin. Se etsii projektin testitiedostot, ajaa testit ja kertoo, mitkä menivät läpi ja mitkä eivät. Se tarjoaa testien rakenteen (describe, it, test) ja tarkistukset (expect), sekä esimerkiksi watch tilan, mockauksen ja kattavuusraportit. Se tukee TypeScriptiä suoraan ja käyttää samaa konfiguraatiota kuin Vite. Vitest ei itse tiedä Reactista mitään, joten komponenttien renderöintiin tarvitaan lisäkirjasto.

## Mikä on React Testing Library ja miten sen tarkoitus eroaa Vitestistä?

React Testing Library on kirjasto, jolla React komponentteja renderöidään testissä ja jolla renderöityä käyttöliittymää voi tutkia ja käyttää. Se tarjoaa haut (esimerkiksi getByRole, getByText, getByLabelText) ja käyttäjän toimintojen simuloinnin, kuten klikkauksen ja kirjoittamisen. Ero on työnjaossa: Vitest ajaa testit ja tekee varsinaiset tarkistukset, kun taas React Testing Library huolehtii siitä, että komponentti saadaan näkyviin testiympäristössä ja sitä voidaan käyttää kuin käyttäjä. Ne täydentävät toisiaan.

## Mitä tarkoittaa periaate, että React komponenttia testataan käyttäjän näkökulmasta?

Testataan sitä, mitä käyttäjä näkee ja tekee, ei komponentin sisäistä toteutusta. Testi etsii elementit samalla tavalla kuin käyttäjä, eli roolin, tekstin tai lomakekentän otsikon perusteella. Sen jälkeen se klikkaa tai kirjoittaa ja tarkistaa, että ruudulle ilmestyy odotettu lopputulos. Testi ei tarkista esimerkiksi komponentin tilamuuttujia tai sisäisiä funktioita. Hyöty on, että testit kestävät koodin refaktoroinnin: jos toiminta pysyy samana, testit menevät edelleen läpi, vaikka toteutus muuttuisi.

## Mikä on jest-domin tehtävä testauksessa?

jest-dom laajentaa expect tarkistuksia DOM:n testaamiseen sopivilla matchereilla, kuten toBeInTheDocument, toBeVisible, toBeDisabled, toHaveTextContent ja toHaveValue. Niiden avulla testit ovat luettavampia ja virheilmoitukset selkeämpiä kuin pelkillä perustarkistuksilla. Tässä harjoituksessa se otetaan käyttöön kerran tiedostossa `setupVitest.ts`, jolloin matcherit ovat käytettävissä kaikissa testeissä.

## Miksi jsdomia tarvitaan React komponenttien testeissä?

Vitest ajaa testit oletuksena Node.js:ssä, jossa ei ole selainta eikä siten DOM:ia (document, window, elementit, tapahtumat). React komponentit tarvitsevat DOM:in, jotta ne voidaan renderöidä. jsdom on JavaScriptillä toteutettu simulaatio selaimen DOM:ista, joten komponentit voidaan renderöidä ja niille voidaan lähettää tapahtumia ilman oikeaa selainta. Se on myös nopeampaa kuin oikean selaimen käyttö. Rajoitus on, ettei jsdom piirrä oikeaa ulkoasua eikä laske asettelua. Vitestissä se otetaan käyttöön asettamalla testiympäristöksi jsdom (`environment: 'jsdom'`).
