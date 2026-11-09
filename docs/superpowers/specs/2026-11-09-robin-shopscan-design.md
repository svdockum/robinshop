# Robin shop-scan — ontwerp prototype

Datum: 2026-11-09 · Status: goedgekeurd om te bouwen (opdracht: "maak een plan en voer uit")

## Waarom

Robin is een coöperatieve "super fijne markt": leden betalen geen euro's per product maar
besteden **eetpunten** uit een jaarbudget van het huishouden. In een fysieke testwinkel
(houten stelling met kratten, QR-labels met "1 eetpunt", "3 eetpunten") willen we testen hoe
goed zelfscannen met de telefoon loopt: binnenkomen, producten scannen, afronden bij de kassa.
Later worden het NFC-passen en handscanners; als de telefoon goed werkt, blijft het de telefoon.

Bronnen: `docs/reference/*` (app-ontwerpen, labels, testopstelling),
`D:\Repos\robin\20261008 Het eetpuntensysteem van Robin - versie Job.docx`,
`D:\Repos\robin\Robin_merkboek_25.02.pdf` en `D:\Repos\robin\Merkelementen - statisch\`.

## Doelen

1. Mobile-first website (Nuxt 4 + Supabase, gehost op Vercel) waarmee een lid in de winkel:
   inlogt, bij het poortje incheckt, producten scant, en bij de kassa uitcheckt.
2. Eetpunten worden direct per scan afgeschreven en het nieuwe saldo is meteen zichtbaar.
3. Een wisselende QR-code bij ingang en kassa, zodat een foto van de code niet herbruikbaar is.
4. Vaste (statische) QR-codes op producten.
5. Beheeromgeving: producten, huishoudens, scanpunten beheren en **PDF's genereren** met
   QR-labels in Robin-stijl (plus ledenpassen en een ingangsposter).

## Niet-doelen (prototype)

NFC, handscanners, echte poortaansturing, weegschaal/variabele porties (type 2 en 3 uit het
eetpuntendocument), vlees/vis-bijdrage, facturen of betalingen, native app, offline werken,
meerdere accounts per huishouden, meerdere vestigingen.

## Anti-doelen (dan is het mislukt, ook al werkt het)

- Een lid moet ooit zelf punten uitrekenen.
- Er verschijnen euro's.
- Het is te ingewikkeld voor leden die minder talig of digitaal vaardig zijn: grote knoppen,
  korte zinnen, één ding per scherm.
- Er wordt `alert()`, `confirm()` of `prompt()` gebruikt (eigen dialogen en toasts).

## De route door de winkel

1. **Ingang** — poster met een vaste QR-code en de link naar de website.
2. **Inloggen** (één keer per telefoon; de sessie blijft bewaard):
   - **Ledenpas** (simuleert de toekomstige NFC-pas): een geprinte pas met een persoonlijke
     QR-code. Scannen → je bent ingelogd als jouw huishouden. Beheer kan een pas intrekken
     door een nieuwe code aan te maken.
   - **Inloglink per e-mail** (Supabase magic link), voor huishoudens met een e-mailadres.
     Geen open registratie: alleen huishoudens die in beheer zijn aangemaakt kunnen inloggen.
3. **Poortje** — een scherm (tablet/monitor, later e-ink) toont een **wisselende QR-code**.
   Het lid scant die → er wordt een **bezoek** geopend. Het scherm toont even
   "Welkom, familie X!" (zo ziet een medewerker dat het gelukt is).
4. **Winkelen** — het lid scant de QR-codes op de kratten. De camera blijft aan; na elke scan
   verschijnt kort het product, "−3 punten" en het nieuwe saldo, en scan je door. Een product
   terugleggen kan (scan ongedaan maken) zolang het bezoek open is.
5. **Kassa** — een scherm met een eigen wisselende QR-code. Het lid scant → het bezoek wordt
   afgesloten en het lid ziet een overzicht. Het kassascherm toont kort
   "Familie X · 8 producten · 46 punten", zodat een medewerker kan meekijken.

Productscans tellen alleen tijdens een open bezoek. Een foto van een product-QR heeft dus geen
waarde buiten de winkel. Een bezoek dat niet wordt afgesloten verloopt na 4 uur (punten blijven
afgeschreven; beheer ziet "niet uitgecheckt").

## Eetpunten

**Jaarbudget van een huishouden** = som per gezinslid, volgens het eetpuntendocument:
13 jaar en ouder 7.280 · 9 t/m 12 jaar 6.240 · 4 t/m 8 jaar 5.200 · 0 t/m 3 jaar 0.
Beheer kan per huishouden een **handmatig jaarbudget** invullen dat de berekening overschrijft.

**Maandtegoed** = jaarbudget ÷ 12. Exact verdeeld zodat 12 maanden optellen tot het jaarbudget:
tegoed(maand m) = ⌊J·m/12⌋ − ⌊J·(m−1)/12⌋.

**Doorschuiven**: wat je in een maand niet gebruikt schuift door naar de volgende maand, binnen
het kalenderjaar. Op 1 januari vervalt wat over is (zoals in het eetpuntendocument). Een huishouden
bouwt pas op vanaf zijn **startmaand** (ingesteld in beheer), zodat een testgezin dat in november
start niet ineens elf maanden tegoed heeft.

**Saldo** = opgebouwd tegoed (startmaand t/m huidige maand) + voorschot − besteed dit jaar.

**Voorschot (budget van volgende maand gebruiken)**: als een scan meer kost dan het saldo,
krijgt het lid een melding met de knop **"Gebruik mijn budget van volgende maand"**. Dan wordt het
tegoed van volgende maand nu al beschikbaar en wordt de scan alsnog geregistreerd. Volgende maand
krijg je dat tegoed dus niet nog eens. Regels:
- maximaal één voorschot per maand;
- **niet** in de maand direct na een voorschot ("anders loop je te ver achter");
- een voorschot in december gebruikt het tegoed van januari van het nieuwe jaar.
Kan er geen voorschot meer, dan wordt de scan geweigerd met een vriendelijke uitleg.

**Maximum per bezoek**: een product kan optioneel een maximum aantal per bezoek hebben
("voor sommige producten geldt een maximum", eetpuntendocument). Daarboven wordt de scan
geweigerd met uitleg.

Alle maand- en jaargrenzen in tijdzone Europe/Amsterdam.

## Wisselende QR-codes (ingang en kassa)

- Inhoud: `https://<host>/in/<scanpunt>?t=<venster>.<handtekening>` (kassa: `/uit/…`).
- venster = ⌊unix-tijd / interval⌋; handtekening = HMAC-SHA256(`QR_SECRET`,
  `scanpunt:soort:venster`), base64url, ingekort tot 22 tekens.
- Geldig: huidig én vorig venster (marge voor wie net te laat scant).
- **Interval standaard 60 seconden**, per scanpunt instelbaar in beheer (bijv. 3600 voor e-ink
  dat maar eens per uur ververst). Mijn keuze: korter dan "ieder uur", omdat een gedeelde foto
  anders een uur lang werkt.
- Het scherm haalt de code op bij de server met een geheime displaysleutel in de URL
  (`/display/<scanpunt>?key=…`), want het geheim mag nooit in de browser staan.
- Omdat het een gewone URL is, werkt scannen met de app-scanner én met de gewone camera-app.

## Product-QR's

- Inhoud: `https://<host>/p/<productcode>` — statisch, verandert nooit.
- Werkt met de app-scanner (die de code uit de URL haalt) en met de gewone camera-app
  (opent de site en registreert de scan).
- De scanner leest ook EAN-13, zodat bestaande barcodes later als productcode kunnen dienen.

## Schermen voor leden (mobile-first)

Stijl volgens merkboek: beige `#faf5df` achtergrond, groen `#115656` voor tekst en vlakken,
koraal `#fd644e` alleen als accent (min-punten, meldingen). Koppen in Lektorat Display Narrow Bold,
subkoppen Work Sans Bold, tekst Work Sans Regular. Logo uit de merkelementen. Geen gradients.
Onderbalk: Home · Scannen · Saldo · Profiel (zoals de referentie-ontwerpen).

- **Home**: "Hoi familie X!", eetpunten per jaar | per maand, gezinsleden, verdeling per
  categorie deze maand, saldo-kaart, en een duidelijke status: "Scan de QR-code bij de ingang"
  of "Je bent in de winkel — scan je producten".
- **Scannen**: camera met kader, uitleg "Richt je camera op de QR-code", na een scan een
  bevestigingskaart (productfoto, naam, portie, −punten, nieuw saldo, "Verder scannen"),
  knop naar het mandje van dit bezoek met "terugleggen".
- **Saldo**: saldo, maandtegoed en gebruik deze maand, voorschotstatus, eerdere bezoeken.
- **Profiel**: huishouden, gezinsleden, uitloggen.
- **Deep links**: `/in/…`, `/uit/…`, `/p/…`, `/pas/…` — werken ook vanuit de camera-app;
  zonder login eerst naar inloggen en daarna terug.

## Beheer (`/beheer`, alleen voor beheerders)

- **Overzicht**: bezoeken vandaag, punten per categorie, actieve bezoeken.
- **Producten**: naam, code, categorie, bewaarwijze (vers/koel/vries/houdbaar), punten,
  portie ("1 stuk", "1 brood"), max per bezoek, foto, actief. Selecteren → **PDF met labels**.
- **Categorieën**: Groente & fruit, Zuivel, Graanproducten, Overige plantaardig (aanpasbaar).
- **Huishoudens**: naam, e-mail (optioneel), startmaand, gezinsleden (naam, leeftijd),
  berekend/handmatig jaarbudget, saldo, **ledenpas printen**, nieuwe pascode.
- **Scanpunten**: ingang/kassa, interval, link naar het display, ingangsposter printen.
- **Registraties**: bezoeken en scans per huishouden.

### PDF's (in de browser gegenereerd met pdf-lib, merkfonts ingebed)

- **Productlabels** in de stijl van `docs/reference/Eetpunten.png`: koraal vlak, QR-code in
  beige, groot puntental, "eetpunt/eetpunten" verticaal, ROBIN-logo in beige. Formaten: klein
  (10 per A4, voor kratten) en groot (4 per A4). Mijn toevoeging: de productnaam klein onderaan,
  zodat labels met hetzelfde puntental niet verwisseld worden bij het ophangen. Optie
  "hoog contrast" (groene QR op beige vlak) voor als een telefoon de lichte-op-koraal QR slecht leest.
- **Ledenpassen** op creditcardformaat (85,6 × 54 mm), 10 per A4: groen vlak, beige logo,
  huishoudnaam, QR in beige vlak.
- **Ingangsposter** (A4): logo, "Welkom bij Robin", QR naar de website plus de link als tekst.

## Techniek (gekozen)

- Nuxt 4, `@nuxtjs/supabase`, Tailwind CSS v4, TypeScript.
- Supabase: Postgres + Auth + Storage (productfoto's). Lokaal ontwikkelen met de Supabase CLI
  (Docker); migraties in `supabase/migrations`, testdata in `supabase/seed.sql`.
- **Puntenlogica in Postgres-functies** (`security definer`, met rij-lock per huishouden), zodat
  saldo-controle en registratie atomair zijn.
- **Nitro-serverroutes** voor alles met geheimen: QR-handtekeningen (`QR_SECRET`), inloggen
  met de pas en accounts aanmaken (service role).
- Scanner: `vue-qrcode-reader` (native BarcodeDetector, of zxing-wasm als fallback op iOS).
- RLS aan op alle tabellen: leden zien alleen hun eigen huishouden; beheerders alles.
- Eén Supabase-auth-gebruiker per huishouden. Huishoudens zonder e-mailadres krijgen een
  intern placeholder-adres; zij loggen alleen in met de pas.

## Datamodel (globaal)

- `categories` (naam, kleur, volgorde)
- `products` (code uniek, naam, categorie, bewaarwijze, punten, portie, max_per_bezoek, foto, actief)
- `households` (naam, e-mail, startmaand, handmatig jaarbudget, auth-gebruiker, pascode)
- `household_members` (huishouden, naam, leeftijd)
- `scan_points` (slug, naam, soort ingang/kassa, interval, displaysleutel)
- `visits` (huishouden, ingang, kassa, gestart, afgerond, status)
- `scans` (bezoek, huishouden, product, punten-momentopname, aantal, tijd, teruggelegd)
- `advances` (huishouden, maand, punten) — uniek per huishouden+maand
- `display_events` (scanpunt, soort, tekst, tijd) — voor "Welkom, familie X!" op het scherm
- `admins` (gebruiker)

## Aan de bouwer gelaten

Exacte componentstructuur, kopij binnen de tone of voice van het merkboek (warm, nuchter, korte
zinnen), animaties (rustig), foutteksten, en de inrichting van het beheer-dashboard.

## Mijn keuzes (ter controle)

1. Wisselinterval standaard 60 s (instelbaar), in plaats van "ieder uur".
2. Ledenpas = inloggen op de telefoon; de wisselende QR bij het poortje = aanwezigheid bewijzen.
   Later kan een NFC-lezer bij het poortje het bezoek direct openen.
3. Eén account per huishouden.
4. Startmaand per huishouden, zodat opbouw niet vanaf januari terugrekent.
5. Productnaam klein op het label, plus een optie voor hoog contrast.
6. Bezoek verloopt na 4 uur zonder kassascan.
7. Kalenderjaar als budgetjaar.
8. Merkfonts (Lektorat, Work Sans) worden als webfont meegeleverd. Controleer of de licentie
   van Lektorat webgebruik toestaat vóór een publieke livegang.
