# Chap6: Redux, Context ja React Router

## Mitä ongelmaa Redux pyrkii ratkaisemaan?

Reduxin tarkoitus on tehdä sovelluksen tilanhallinnasta ennustettavaa ja keskitettyä. Kun sovellus kasvaa, tilaa joudutaan välittämään monen komponentin läpi propsien avulla (prop drilling), ja on vaikea hahmottaa, mikä komponentti muuttaa tilaa ja milloin. Reduxissa koko tila on yhdessä storessa, ja sitä voi muuttaa vain lähettämällä actionin, jonka reducer käsittelee. Tämä tekee tilan muutoksista jäljitettäviä ja helpommin testattavia ja debugattavia. Nykyään Reduxia käytetään yleensä Redux Toolkitin kanssa, joka vähentää toistuvaa boilerplate koodia.

## Mitä tarkoitetaan sovelluksen globaalilla tilalla?

Globaali tila on sellaista dataa, jota tarvitaan useassa eri osassa sovellusta, eikä se kuulu yhden komponentin sisäiseen tilaan. Esimerkkejä ovat kirjautunut käyttäjä, teema, ostoskorin sisältö ja välimuistissa oleva palvelimelta haettu data. Paikallinen tila (useState) taas koskee vain yhtä komponenttia, esimerkiksi lomakekentän arvoa.

## Millaisessa sovelluksessa käyttäisit mieluummin Reduxia kuin React Contextia?

Reduxia käyttäisin suuressa tai monimutkaisessa sovelluksessa, jossa tilaa muutetaan useasta paikasta ja tilan muutosten pitää olla hallittuja ja jäljitettäviä. Esimerkiksi verkkokauppa, jossa on ostoskori, käyttäjätiedot, suodattimet ja paljon asynkronista dataa. Redux DevToolsin ansiosta tilan muutoksia voi seurata ja toistaa. Context sopii paremmin pieneen tai keskikokoiseen sovellukseen ja harvoin muuttuvaan tietoon, kuten teemaan tai kieleen, koska Contextin arvon muuttuessa kaikki sitä käyttävät komponentit renderöityvät uudelleen, mikä voi heikentää suorituskykyä.

## Mitä hyötyä React Routerista on?

React Router mahdollistaa usean näkymän sisältävän Single Page Applicationin (SPA). Sivua ei ladata palvelimelta kokonaan uudelleen, vaan Router vaihtaa näytettävän komponentin osoitteen mukaan. Hyötyjä ovat nopea ja sulava navigointi, selkeä sovelluksen rakenne reittien avulla, selaimen edellinen ja seuraava painikkeet toimivat, ja jokaisella näkymällä on oma osoite, jonka voi tallentaa kirjanmerkkiin tai jakaa. Lisäksi Router tukee dynaamisia reittejä (esim. /posts/5) ja suojattuja reittejä.

## Mitä tapahtuu URL osoitteelle, kun käyttäjä navigoi eri näkymiin?

Kun käyttäjä navigoi toiseen näkymään, esimerkiksi Link komponentin kautta, React Router päivittää selaimen osoiterivin (History API:n avulla) ilman koko sivun uudelleenlatausta. Router lukee uuden osoitteen, valitsee sitä vastaavan reitin ja renderöi siihen kuuluvan komponentin. Osoite siis muuttuu aina näkymän mukana, vaikka kyseessä on yksi sivu.
