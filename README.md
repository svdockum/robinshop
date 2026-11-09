# Robin shop-scan

Mobile-first prototype voor de Robin testwinkel: leden scannen met hun telefoon hun
boodschappen en betalen met **eetpunten**. Nuxt 4 + Supabase, gehost op Vercel.

## Zo werkt het in de winkel

1. **Ingang**: een poster met een QR-code en de link naar de website (`/robinadmin/scanpunten` → *Ingangsposter printen*).
2. **Inloggen**: scan de geprinte **ledenpas** (voorloper van de NFC-pas) of vraag een inloglink per e-mail aan.
3. **Poortje**: een scherm toont een **wisselende QR-code** (`/display/ingang?key=…`). Scannen opent een bezoek.
4. **Winkelen**: scan de vaste QR-labels bij de kratten. Punten gaan er direct af, terugleggen kan.
5. **Kassa**: scan de wisselende kassacode (`/display/kassa?key=…`). Het bezoek is afgerond.

Eetpunten: jaarbudget = som per gezinslid (13+: 7.280 · 9–12: 6.240 · 4–8: 5.200), of handmatig.
Per maand komt er jaarbudget ÷ 12 bij; wat je niet gebruikt schuift door binnen het jaar.
Te weinig punten? Dan kun je één keer het budget van volgende maand gebruiken (niet twee maanden achter elkaar).

## Beheer: `/robinadmin`

Producten met **QR-labels als PDF** (Robin-stijl of hoog contrast), categorieën, huishoudens met
gezinsleden en **ledenpassen als PDF**, ingang/kassa-schermen en registraties.

> `/robinadmin` staat voorlopig **open** (geen login). Wie de URL kent, ziet pascodes en displaysleutels.
> Zet `NUXT_ADMIN_PASSWORD` om het af te schermen; de pagina vraagt dan om dat wachtwoord.

## Lokaal draaien

Vereist: Node 22+, Docker (voor de lokale Supabase) en de Supabase CLI.

```bash
npm install
supabase start                 # lokale database met migraties + testdata (supabase/seed.sql)
cp .env.example .env.local     # vul de waarden uit `supabase status -o env` in
npm run dev:local              # http://localhost:3000 tegen de lokale database
```

Testdata lokaal: ledenpas `http://localhost:3000/pas/DEMO-YILMAZ-PAS-0001` (31.200 punten per jaar) en
`/pas/DEMO-DEVRIES-PAS-0002` (krap budget, om het voorschot te testen). Displays:
`/display/ingang?key=dev-ingang-sleutel-0001` en `/display/kassa?key=dev-kassa-sleutel-0001`.

De camera werkt alleen via https of op localhost. Testen met een echte telefoon: deploy naar Vercel
(of gebruik een https-tunnel).

## Tests

```bash
npm test              # unit-tests (Vitest): puntenlogica, QR-tokens, scan-parser, PDF's
npm run test:db       # database-tests (pgTAP): saldo, doorschuiven, voorschot, RLS
npx nuxi typecheck
```

## Deploy

**Supabase (cloud)**

```bash
supabase link --project-ref <ref>
supabase db push                       # migraties
node scripts/seed-base.mjs             # categorieën, testproducten, ingang en kassa (leest .env)
```

In het Supabase-dashboard onder *Authentication → URL Configuration*: zet de **Site URL** op de
Vercel-URL, voeg `https://<jouw-domein>/**` toe aan de redirect-URL's en zet nieuwe aanmeldingen uit
(*Allow new users to sign up* uit). Voor inloglinks naar leden is een eigen SMTP-server nodig
(de standaardmail van Supabase mailt alleen teamleden).

**Vercel**: importeer de repo (Nuxt wordt automatisch herkend) en zet deze omgevingsvariabelen:

| Variabele | Waarde |
|---|---|
| `SUPABASE_URL` | Project-URL |
| `SUPABASE_KEY` | Publishable/anon key |
| `SUPABASE_SECRET_KEY` | Secret/service-role key (alleen server) |
| `NUXT_QR_SECRET` | Lange willekeurige tekst (`openssl rand -base64 32`) |
| `NUXT_PUBLIC_SITE_URL` | Publieke URL, bijv. `https://robinshop.vercel.app` (komt in geprinte QR-codes) |
| `NUXT_ADMIN_PASSWORD` | Optioneel: wachtwoord voor `/robinadmin` |

Print labels en passen pas als `NUXT_PUBLIC_SITE_URL` goed staat, anders verwijzen ze naar de verkeerde website
(de scanner in de app leest ze wel, de gewone camera-app niet).

## Structuur

- `app/pages` — ledenapp (`/`, `/scan`, `/saldo`, `/profiel`), deep links (`/p`, `/in`, `/uit`, `/pas`), displays, `/robinadmin`
- `app/utils/pdf` — labels, ledenpassen en poster (pdf-lib, merkfonts ingebed)
- `server/api` — wisselende QR-tokens, in/uitchecken, pas-login, beheer-API
- `supabase/migrations` — schema, RLS en de puntenlogica (Postgres-functies)
- `docs/reference` — ontwerpen en labelvoorbeelden
