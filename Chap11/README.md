# Chap11: Autentikointi ja auktorisointi

Kirjan luvun 11 tuotokset: Express 5 API, johon on lisätty JWT autentikointi, Argon2 salasanojen hashays, roolipohjainen pääsynhallinta, refresh tokenin rotaatio ja tietoturva asetukset (Helmet ja rate limiting). Tietokantana on PostgreSQL ja Prisma 7.

## Mitä tässä on toteutettu

| Aihe | Toteutus |
| --- | --- |
| Autentikointi (kuka olet) | Rekisteröinti ja kirjautuminen (`/api/auth/register`, `/api/auth/login`), JWT access token (15 min) ja refresh token (7 pv) kirjastolla `jose` |
| Salasanat | `argon2` (Argon2id). Tallennetaan vain hash, ei selkotekstiä. Prisman global omit piilottaa `password` kentän kaikista kyselyistä |
| Validointi | Zod skeemat (`src/schemas`), `validate` middleware palauttaa 400 kenttäkohtaisilla virheillä |
| Auktorisointi (mitä saat tehdä) | `authenticate` (401) ja `authorize(...roolit)` (403) middlewaret sekä omistajuuden tarkistus postauksille |
| Roolit | `USER`, `MODERATOR` ja `ADMIN` (Prisma enum) |
| Tokenin elinkaari | `/api/auth/refresh` (rotaatio transaktiossa ja reuse detection), `/api/auth/logout` ja `DELETE /api/auth/sessions` (kaikki laitteet) |
| Eväste | Refresh token httpOnly evästeessä: `httpOnly`, `secure` tuotannossa, `sameSite: strict` ja `path: /api/auth` |
| Kovennus | `helmet()`, rate limiting (100 pyyntöä / 15 min, kirjautumiseen ja rekisteröintiin 5 epäonnistunutta / 15 min, refreshiin 20 evästeellistä epäonnistunutta yritystä / 15 min), body koko max 10 kt ja sama virheviesti väärälle salasanalle ja tuntemattomalle sähköpostille |
| Testit | Vitest ja Supertest: yksikkötestit (jwt, Zod, authService mockeilla) ja integraatiotestit oikealla tietokannalla |

## Kansiorakenne

```
Chap11/
  deploy/docker-compose.dev.yml   PostgreSQL kehitystietokanta (portti 5434)
  server/
    prisma/                        schema, migraatio ja seed
    src/
      app.ts                       middlewaret ja reitit (helmet, rate limit, body, routes, virheet)
      server.ts                    käynnistys
      db.ts                        Prisma client (global omit password)
      middleware/                  authenticate, authorize, validate, errorHandlers
      routes/                      authRoutes, userRoutes, postRoutes
      services/authService.ts      rekisteröinti, kirjautuminen ja siivous
      schemas/                     Zod skeemat
      utils/                       jwt, cookies, dates
      __tests__/                   yksikkö ja integraatiotestit
```

## Käynnistys

1. Käynnistä Docker Desktop ja tietokanta:

   ```bash
   cd deploy
   docker compose -f docker-compose.dev.yml up -d
   ```

2. Asenna riippuvuudet ja luo asetukset:

   ```bash
   cd ../server
   npm install
   cp .env.example .env
   ```

   Vaihda tarvittaessa `JWT_ACCESS_SECRET` ja `JWT_REFRESH_SECRET` omiksesi (vähintään 32 merkkiä, eri arvot).

3. Aja migraatio ja lisää testikäyttäjät:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

   Seed luo käyttäjät `admin@example.com` (ADMIN), `mod@example.com` (MODERATOR) ja `user@example.com` (USER), kaikilla salasana `password123`.

4. Käynnistä palvelin:

   ```bash
   npm run dev
   ```

5. Aja testit (tarvitsevat tietokannan ja luovat itse `fsrtn_test` tietokannan):

   ```bash
   npm test
   ```

## API lyhyesti

| Reitti | Pääsy |
| --- | --- |
| `POST /api/auth/register`, `POST /api/auth/login` | julkinen |
| `POST /api/auth/refresh`, `POST /api/auth/logout` | refresh token evästeestä |
| `DELETE /api/auth/sessions` | kirjautunut |
| `GET /api/v1/posts`, `GET /api/v1/posts/:id` | julkinen |
| `POST /api/v1/posts` | kirjautunut |
| `PUT` ja `DELETE /api/v1/posts/:id` | omistaja, MODERATOR tai ADMIN |
| `GET` ja `PUT /api/v1/users/me` | kirjautunut |
| `GET /api/v1/users`, `DELETE /api/v1/users/:id` | vain ADMIN |

Esimerkki kirjautumisesta:

```bash
curl -i -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

## Huomioita

* Kirjan koodirepositoriossa ei ole luvun 11 koodia valmiina, joten toteutus on tehty kirjan tekstin mukaan. Pohjana on kirjan esimerkki (User ja Post), ei kurssin blogisovellus.
* Refresh endpointin rate limit ohittaa pyynnöt, joilla ei ole refresh token evästettä. Muuten kirjautumaton käyttäjä kuluttaisi jokaisella sivun latauksella (frontend yrittää refreshiä) kirjautumisen rajan.
* Prisma migraatio `20251121000000_init` sisältää koko skeeman (User, Post, RefreshToken ja Role enum) yhtenä migraationa.
* Epäonnistuneet kirjautumiset palauttavat 400 (`AUTH_ERROR`), jotta frontend ei erehdy luulemaan niitä vanhentuneeksi sessioksi (401 laukaisee tokenin uusimisen).
