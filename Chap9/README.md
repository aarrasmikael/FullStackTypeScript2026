# Chap9: Express ja Web API

Harjoituksen koodi on kansiossa `express-server`. Tehtävä kattaa kirjan luvun 9 kolme osiota: Understanding how Express improves Node development, Learning Express capabilities ja Creating a Web API with Express. Osio Testing Node on rajattu tämän tehtävän ulkopuolelle.

## Ajaminen

```bash
cd Chap9/express-server
npm install
npm start               # expressapp.js, Web API
```

Toisessa terminaalissa:

```bash
curl http://localhost:8000/api/v1/users/2
curl --header "Content-Type: application/json" --request POST --data '{"groupid": 1}' http://localhost:8000/api/v1/groups
```

Vastaukset ovat `User jon` ja `Group Admins`. Middleware esimerkki ajetaan komennolla `npm run middleware` (reitit `/a`, `/c` ja `/fail`). Sammuta palvelin ennen toisen käynnistämistä, koska molemmat käyttävät porttia 8000.

## Sisältö

`expressapp.js` on kirjan lopullinen Web API: app level middleware (`express.json()` ja lokitus next kutsulla), GET reitti `/api/v1/users/:id` (parametri polussa) ja POST reitti `/api/v1/groups` (parametri JSON bodyssa). `middleware-demo.js` esittelee middleware ketjun, Routerin, JSON bodyn lukemisen ja virheenkäsittelijän, jossa on neljä parametria (err, req, res, next).

## Mikä Express on ja miten se liittyy Node.js:ään?

Node.js on JavaScriptin suoritusympäristö selaimen ulkopuolella, ja se tarjoaa HTTP palvelimen tekemiseen tarvittavat perustoiminnot. Pelkällä Node:lla HTTP palvelimen rakentaminen on kuitenkin työlästä, koska esimerkiksi otsikot, reititys ja pyynnön bodyn lukeminen pitää hoitaa itse. Express on kevyt web sovelluskehys, joka ei ole itsenäinen palvelin vaan koodikerros Noden päällä. Kun Expressin app.listen kutsutaan, se kutsuu sisäisesti Noden createServer ja listen funktioita. Express lisää reitityksen, middleware järjestelmän ja apufunktioita (esimerkiksi res.send ja express.json), jolloin Web API:n tekeminen on selkeämpää ja nopeampaa.

## Mitä middleware tarkoittaa Expressissä? Mitä tehtäviä middleware voi hoitaa pyynnön käsittelyn aikana?

Middleware on funktio, joka on osa pyynnön käsittelyputkea ja saa käyttöönsä pyynnön (req), vastauksen (res) ja next funktion. Se voi lukea ja muokata pyyntöä tai vastausta, päättää vastauksen itse tai antaa pyynnön eteenpäin kutsumalla next. Middleware ajetaan siinä järjestyksessä, jossa ne on määritelty, ja jos middleware ei kutsu nextiä eikä lähetä vastausta, pyyntö jää roikkumaan. Jos middleware lähettää vastauksen (esimerkiksi res.send), ketju päättyy siihen. Tehtäviä, joita middleware voi hoitaa, ovat esimerkiksi lokitus, pyynnön bodyn jäsentäminen (express.json), käyttäjän tunnistus ja oikeuksien tarkistus, tietojen validointi, otsikoiden asettaminen, reititys (Router on myös middleware) ja virheiden käsittely. Virheenkäsittelijä tunnistetaan siitä, että sillä on neljä parametria (err, req, res, next). Middleware voi olla Expressin oma, kolmannen osapuolen npm paketti tai itse kirjoitettu.

## Kuvaile omin sanoin, miten HTTP pyyntö etenee Express sovelluksessa asiakkaalta palvelimelle ja takaisin asiakkaalle.

Asiakas, esimerkiksi selain tai curl, lähettää HTTP pyynnön palvelimen osoitteeseen ja porttiin, kuten http://localhost:8000/api/v1/users/2. Noden HTTP palvelin vastaanottaa pyynnön ja antaa sen Express sovellukselle, joka luo pyynnöstä request ja response oliot. Request sisältää pyynnön tiedot (metodi, polku, otsikot, parametrit ja body) ja response on se olio, jonka kautta vastaus rakennetaan. Sen jälkeen Express vie pyynnön middleware ketjun läpi siinä järjestyksessä kuin middleware on määritelty. Esimerkiksi ensin express.json lukee JSON bodyn req.body kenttään ja oma middleware kirjoittaa lokiin ja kutsuu nextiä. Seuraavaksi Router etsii reitin, joka vastaa pyynnön metodia ja polkua (esimerkiksi GET /api/v1/users/:id), ja ajaa sen käsittelijän. Käsittelijä tekee varsinaisen työn, esimerkiksi hakee käyttäjän id:n perusteella (req.params.id), ja lähettää vastauksen komennolla res.send. Vastaus kulkee Noden kautta takaisin asiakkaalle statuskoodin, otsikoiden ja sisällön kanssa. Jos jokin middleware tai käsittelijä heittää virheen, Express ohittaa muut ja siirtyy virheenkäsittelijään, joka palauttaa esimerkiksi statuskoodin 500 ja virheviestin. Jos mikään reitti ei vastaa pyyntöön, Express palauttaa virheen "Cannot GET /polku" (404).
