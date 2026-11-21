# Chap12: Fullstack sovelluksen viimeistely

Kirjan luvun 12 tuotos: toimiva fullstack sovellus, jossa React frontend (`client`) keskustelee Chap11:n suojatun Express API:n (`server`) kanssa. Tietokantana on PostgreSQL ja Prisma.

* `server`: Chap11:n backend, johon on lisätty vain CORS (`cors` middleware ja `CLIENT_URL` ympäristömuuttuja)
* `client`: Vite, React 19, TypeScript, Redux Toolkit ja React Router

## Mitä frontendissä on

| Aihe | Toteutus |
| --- | --- |
| API client | `src/api/client.ts`: tyypitetty `fetch` kääre, liittää `Authorization: Bearer` otsikon, lähettää evästeet (`credentials: include`) ja käsittelee 401 vastauksen |
| Token muistissa | `src/api/token.ts`: access token on moduulin muuttujassa, ei localStoragessa |
| Refresh ja kilpailutilanne | `src/api/refresh.ts`: yksi jaettu refresh promise ja 10 sekunnin aikaraja |
| Autentikoinnin tila | `src/features/auth/authSlice.ts`: Redux slice ja thunkit (login, register, logout, logoutAll, initializeAuth) |
| Reitit | `src/routes`: `ProtectedRoute`, `AdminRoute` ja `AppRouter` |
| Sivut | kirjautuminen, rekisteröinti, postaukset (optimistinen poisto), postauksen luonti ja katselu, profiili ja adminin käyttäjälista |
| Virheet | `ErrorBoundary` ja käyttäjälle näkyvät virheviestit |
| Testit | Vitest ja React Testing Library: reducer, LoginPage, reittien suojaus, API client ja refreshin deduplikointi |

## Käynnistys

1. Käynnistä Docker Desktop ja tietokanta:

   ```bash
   cd deploy
   docker compose -f docker-compose.dev.yml up -d
   ```

2. Backend:

   ```bash
   cd ../server
   npm install
   cp .env.example .env
   npx prisma migrate deploy
   npx prisma db seed
   npm run dev
   ```

3. Frontend (toisessa terminaalissa):

   ```bash
   cd client
   npm install
   npm run dev
   ```

4. Avaa http://localhost:5173. Testikäyttäjät (salasana `password123`): `admin@example.com`, `mod@example.com` ja `user@example.com`.

Testit ajetaan komennolla `npm test` kansioissa `server` ja `client`. Backendin testit luovat itse `fsrtn_test` tietokannan.

## Vastaukset kysymyksiin

### 1. Miten React frontend ja Express backend yhdistettiin tässä harjoituksessa? Mitä tapahtuu, kun frontend tekee API pyynnön?

Frontend (Vite, portti 5173) ja backend (Express, portti 4000) ovat kaksi erillistä sovellusta, jotka keskustelevat keskenään HTTP:n yli JSON muodossa. Yhteys on rakennettu kahdella tavalla. Kehityksessä Vite välittää kaikki `/api` alkuiset pyynnöt proxyn kautta backendille, jolloin selaimen mielestä kaikki tulee samasta originista eikä CORS tai evästeen polku aiheuta ongelmia. Lisäksi backendissä on `cors` middleware, joka sallii frontendin originin ja evästeiden lähettämisen (`credentials: true`), koska tuotannossa frontend ja API ovat eri osoitteissa.

Kun komponentti tarvitsee dataa, se kutsuu tyypitettyä funktiota, esimerkiksi `postsApi.getAll()`. Funktio käyttää yhteistä `apiClient` funktiota, joka lisää pyyntöön access tokenin `Authorization` otsikossa ja lähettää pyynnön `fetch`illä evästeiden kanssa. Palvelimella pyyntö kulkee Helmetin, rate limiterin, JSON parserin ja tarvittaessa `authenticate` middlewaren läpi reitin käsittelijälle. Käsittelijä hakee datan Prisman kautta PostgreSQL tietokannasta ja palauttaa sen JSON:ina. Jos vastaus on 401, client yrittää hiljaa uusia tokenin ja toistaa pyynnön kerran. Muut virheet muutetaan `ApiError`iksi ja komponentti näyttää virheviestin käyttäjälle.

### 2. Mikä on Reduxin tehtävä autentikoinnin tilan hallinnassa? Millaista tietoa siinä säilytetään?

Redux pitää kirjautumisen tilan yhdessä paikassa, josta kaikki komponentit voivat lukea sen. Navigaatio näyttää sen perusteella oikeat linkit, `ProtectedRoute` ja `AdminRoute` päättävät pääsystä, ja sivut tietävät kuka käyttäjä on. Auth slicessa säilytetään `user` (id, sähköposti, käyttäjänimi ja rooli), `isAuthenticated`, `isLoading` ja `error`. `isLoading` alkaa arvolla true, koska sovelluksen käynnistyessä ei vielä tiedetä, onko sessio voimassa. Näin kirjautunut käyttäjä ei näe hetkellisesti kirjautumissivua. Tilaa muuttavat asynkroniset thunkit `login`, `register`, `logout` ja `initializeAuth`.

Access tokenia ei säilytetä Reduxissa. Se on moduulin muuttujassa (`api/token.ts`), koska `apiClient` toimii React puun ulkopuolella eikä voi käyttää hookeja, ja koska tokenia ei haluta localStorageen, josta XSS hyökkäys voisi lukea sen. Refresh token on httpOnly evästeessä, jota JavaScript ei näe lainkaan. Thunkit päivittävät token muuttujan ja Reduxin tilan yhdessä, jotta ne eivät ole koskaan ristiriidassa. Koska Reduxin tila katoaa sivun päivityksessä, `initializeAuth` hakee session takaisin refresh evästeen avulla.

### 3. Miten protected route toimii? Mitä tapahtuu, jos käyttäjä yrittää avata suojatun sivun ilman kirjautumista?

`ProtectedRoute` on kääreitti, jonka sisällä suojatut sivut ovat. Se lukee auth tilan Reduxista. Jos `isLoading` on true, se näyttää latausviestin, koska sessiota ei ole vielä tarkistettu. Jos käyttäjä ei ole kirjautunut, se ohjaa `Navigate` komponentilla sivulle `/login` ja tallentaa mukaan paikan, jonne käyttäjä oli menossa (`state={{ from: location }}`). Muuten se renderöi `Outlet`in eli suojatun lapsireitin.

Jos kirjautumaton käyttäjä avaa esimerkiksi `/profile`, suojatun sivun komponenttia ei renderöidä lainkaan, vaan hänet ohjataan kirjautumissivulle. Kun kirjautuminen onnistuu, `LoginPage` lukee tallennetun paikan ja vie käyttäjän takaisin alkuperäiselle sivulle. `AdminRoute` tekee lisäksi roolitarkistuksen, ja muu kuin ADMIN ohjataan etusivulle. Tämä suojaus on vain käyttökokemusta varten, koska käyttäjä voi muokata selaimessa ajettavaa koodia. Oikea suojaus on palvelimella, joka palauttaa 401 ilman tokenia ja 403 ilman oikeaa roolia.

### 4. Miksi access token täytyy joskus uusia refresh tokenin avulla? Mitä ongelmaa token refresh mekanismi ratkaisee?

Access token on tarkoituksella lyhytikäinen (15 minuuttia), koska JWT:tä ei voi perua kesken sen voimassaoloajan. Jos token varastetaan, vahinko rajoittuu siihen aikaan. Käyttäjän ei kuitenkaan haluta kirjautuvan uudelleen 15 minuutin välein. Tähän ratkaisuna on refresh token (7 päivää), joka on httpOnly evästeessä ja lähtee vain `/api/auth/refresh` endpointille. Kun access token vanhenee ja palvelin vastaa 401, client pyytää uuden access tokenin refresh tokenilla ja toistaa alkuperäisen pyynnön, eikä käyttäjä huomaa mitään.

Mekanismi ratkaisee ristiriidan turvallisuuden ja käyttömukavuuden välillä. Jatkuvasti kulkeva access token on lyhytikäinen, joten sen varastamisen riski on pieni. Pitkäikäinen refresh token liikkuu harvoin ja on tallennettu tietokantaan, joten se voidaan perua (logout ja uloskirjautuminen kaikilta laitteilta). Palvelin myös rotatoi refresh tokenin: jokainen token kelpaa vain kerran, ja jo käytetyn tokenin käyttöyritys paljastaa mahdollisen varkauden. Koska rotaatio mitätöi vanhan tokenin, usean yhtäaikaisen 401 vastauksen ei saa antaa käynnistää useaa refreshiä. Siksi client jakaa yhden käynnissä olevan refresh promisen kaikkien pyyntöjen kesken.
