# Robin shop-scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mobile-first Nuxt 4 + Supabase prototype waarmee Robin-leden in de testwinkel inloggen (ledenpas/magic link), incheckt via een wisselende QR, producten scannen met eetpunten en uitchecken bij de kassa; plus beheer met PDF-labels.

**Architecture:** Nuxt 4 (app/ + server/) op Vercel. Alle puntenlogica in Postgres-functies (`security definer`, rij-lock per huishouden) zodat saldo-controle en registratie atomair zijn. Nitro-routes alleen voor wat een geheim nodig heeft: HMAC van de wisselende QR (`QR_SECRET`), pas-login en accounts (service role). PDF's worden in de browser gemaakt met pdf-lib, met ingebedde merkfonts en vector-logo.

**Tech Stack:** Nuxt 4.6, @nuxtjs/supabase 2.1, @supabase/supabase-js 2, Tailwind CSS 4 (@tailwindcss/vite), vue-qrcode-reader 5 (zxing-wasm), qrcode 1.5, pdf-lib 1.17 + @pdf-lib/fontkit, Vitest, Supabase CLI (lokaal, Docker) + pgTAP.

**Spec:** `docs/superpowers/specs/2026-11-09-robin-shopscan-design.md`

## Global Constraints

- Kleuren exact: groen `#115656`, beige `#faf5df`, koraal `#fd644e` (koraal alleen als accent). Geen gradients.
- Fonts: koppen Lektorat Display Narrow Bold (`Lektorat-NarrowBold.ttf`), subkoppen Work Sans Bold, tekst Work Sans Regular.
- Punten per leeftijd: ≥13 → 7280, 9–12 → 6240, 4–8 → 5200, 0–3 → 0. Maandtegoed(m) = ⌊J·m/12⌋ − ⌊J·(m−1)/12⌋.
- Tijdzone voor maand/jaar: `Europe/Amsterdam`. Budgetjaar = kalenderjaar.
- Voorschot: max 1 per maand, niet in de maand direct na een voorschot; december leent januari.
- Wisselende QR: venster = ⌊unix/interval⌋, standaard interval 60 s, geldig huidig + vorig venster; HMAC-SHA256 over `slug:kind:window`, base64url, 22 tekens; token = `<window>.<sig>`.
- URL's: product `/p/<CODE>`, ingang `/in/<slug>?t=<token>`, kassa `/uit/<slug>?t=<token>`, pas `/pas/<cardCode>`, display `/display/<slug>?key=<displayKey>`.
- Bezoek verloopt na 4 uur zonder kassascan.
- Nooit `alert()`, `confirm()` of `prompt()`: gebruik `useToast` en `useConfirm` (Promise-dialoog).
- Alle UI-tekst Nederlands, korte zinnen, warm en nuchter (merkboek tone of voice). Nooit euro's.
- RLS aan op alle tabellen.

## Review Focus

1. **Dubbel scannen door een trillende hand** (zelfde QR 2× binnen 2,5 s): verwacht één registratie. → test in Task 6 (`useScanFlow` debounce).
2. **Foto van de ingangs-QR van 3 minuten geleden** (interval 60 s): verwacht weigering "Deze code is verlopen, scan de code op het scherm opnieuw". → test in Task 3 (`verifyQrToken` venster −2 faalt).
3. **Product scannen zonder in te checken** (bijv. via camera-app op `/p/PREI`): verwacht geen registratie en de uitleg "Scan eerst de QR-code bij de ingang". → pgTAP in Task 2.
4. **Twee telefoons van hetzelfde huishouden scannen tegelijk bij laag saldo**: verwacht dat het saldo nooit onder 0 komt. → `for update` lock op huishouden in `register_scan` + pgTAP in Task 2 (tweede scan bij exact saldo = INSUFFICIENT).
5. **Geprint label in Robin-stijl (lichte QR op koraal) wordt niet gelezen**: verwacht dat de scanner geïnverteerde QR's leest. → verificatiestap in Task 9 (render label → decodeer met zxing-wasm, zowel `robin` als `hoog`).

---

## File Structure

```
nuxt.config.ts, package.json, vitest.config.ts, .env.example, README.md
app/app.vue
app/assets/css/main.css                 Tailwind + @theme tokens + @font-face
app/layouts/default.vue                 lid: header met logo + BottomNav
app/layouts/plain.vue                   login, deep links (geen nav)
app/layouts/admin.vue                   beheer: zijbalk/topnav
app/components/RobinLogo.vue            inline SVG logo (prop color)
app/components/BottomNav.vue
app/components/AppDialog.vue + ToastHost.vue   (in app.vue gemount)
app/components/QrScanner.vue            wrapper rond QrcodeStream, emit('detected', raw)
app/components/QrImage.vue              SVG QR via `qrcode`
app/components/ScanResultSheet.vue      bevestiging / fout / voorschot-keuze
app/components/PointsSummary.vue        saldo-kaart (home, saldo, scan)
app/components/CategoryBars.vue
app/composables/useToast.ts, useConfirm.ts
app/composables/useOverview.ts          rpc my_overview, gedeelde state
app/composables/useScanFlow.ts          parse → actie → resultaat, debounce
app/utils/scanCode.ts                   parseScan()
app/utils/format.ts                     formatPoints(), monthName()
app/utils/pdf/brand.ts, labels.ts, cards.ts, poster.ts
app/middleware/admin.ts
app/pages/index.vue, scan.vue, saldo.vue, profiel.vue, login.vue, confirm.vue
app/pages/p/[code].vue, in/[slug].vue, uit/[slug].vue, pas/[code].vue
app/pages/display/[slug].vue
app/pages/beheer/index.vue, producten.vue, huishoudens/index.vue, huishoudens/[id].vue, scanpunten.vue, registraties.vue
server/utils/qrToken.ts, requireAdmin.ts, householdAccount.ts
server/api/display/[slug].get.ts
server/api/visit/check-in.post.ts, check-out.post.ts
server/api/auth/card.post.ts
server/api/admin/households/[id]/account.post.ts
scripts/create-admin.mjs
public/fonts/*, public/brand/*.svg
supabase/config.toml, migrations/*.sql, seed.sql, tests/*.test.sql
tests/unit/qrToken.test.ts, scanCode.test.ts, pdf.test.ts, scanFlow.test.ts
```

---

### Task 1: Scaffold Nuxt 4 + Tailwind + Supabase + merkstijl

**Files:** Create `package.json`, `nuxt.config.ts`, `app/app.vue`, `app/assets/css/main.css`, `app/layouts/{default,plain}.vue`, `app/components/{RobinLogo,BottomNav}.vue`, `vitest.config.ts`, `.env.example`, `.gitignore`; copy fonts → `public/fonts/`, logo SVG's (groen/beige/koraal, met/zonder payoff) + beeldmerk → `public/brand/`.

**Interfaces:**
- Produces: Tailwind tokens `bg-beige`, `text-groen`, `bg-koraal`, `bg-zand` (#f3e8c8, kaartvlak), `font-display` (Lektorat), `font-sans` (Work Sans). `<RobinLogo color="groen|beige|koraal" payoff?>`. Layout `default` met BottomNav (Home `/`, Scannen `/scan`, Saldo `/saldo`, Profiel `/profiel`).
- `runtimeConfig`: `qrSecret` (env `NUXT_QR_SECRET`), `public.siteUrl` (env `NUXT_PUBLIC_SITE_URL`, optioneel).
- `supabase.redirectOptions`: login `/login`, callback `/confirm`, exclude `['/pas/*', '/display/*', '/confirm']`, `saveRedirectToCookie: true`.

- [ ] Step 1: `npx nuxi init` (Nuxt 4) zonder git, voeg dependencies toe, `npm install`.
- [ ] Step 2: Configureer Tailwind v4 via `@tailwindcss/vite`, `@font-face` voor beide fonts, `@theme` tokens, body `bg-beige text-groen font-sans`.
- [ ] Step 3: Vitest (node env, `tests/unit/**/*.test.ts`); placeholder-test `expect(1).toBe(1)`.
- [ ] Step 4: Run `npm run build` en `npx vitest run` → beide slagen.
- [ ] Step 5: Commit `chore: scaffold Nuxt 4 + Tailwind + Supabase met Robin-huisstijl`.

### Task 2: Database — schema, RLS, puntenlogica, seed (pgTAP)

**Files:** `supabase/config.toml` (via `supabase init`), `supabase/migrations/20261109120000_schema.sql`, `supabase/migrations/20261109120100_points.sql`, `supabase/seed.sql`, `supabase/tests/points.test.sql`, `supabase/tests/rls.test.sql`.

**Interfaces (Produces):**
- Tabellen zoals in de spec. Kolommen die anderen gebruiken:
  `products(id, code text unique (upper), name, category_id, storage text check in ('vers','koel','vries','houdbaar'), points int >0, portion text, max_per_visit int null, image_url, active bool)`,
  `households(id, name, email null, start_month date, budget_override int null, auth_user_id uuid unique null, card_code text unique default random 20-char base64url)`,
  `household_members(id, household_id, name null, age int)`,
  `scan_points(id, slug unique, name, kind text check in ('entrance','checkout'), interval_seconds int default 60, display_key text default random)`,
  `visits(id, household_id, entrance_id, checkout_id, started_at, ended_at, status text check in ('open','closed','expired'))`,
  `scans(id, visit_id, household_id, product_id, user_id, points int, quantity int default 1, created_at, removed_at)`,
  `advances(household_id, month date, amount int, created_at, primary key(household_id, month))`,
  `display_events(id bigserial, scan_point_id, kind text, title text, detail text, created_at)`, `admins(user_id pk)`.
- Functies:
  `points_for_age(age int) → int`; `month_allowance(budget int, m int) → int`; `household_year_budget(h uuid) → int`;
  `household_balance(h uuid, at timestamptz default now()) → jsonb` met sleutels `year_budget, month_allowance, month_budget, accrued, advance_this_month, advance_last_month (bool), next_month_allowance, spent_year, spent_month, available, can_advance`;
  `is_admin() → bool`; `my_household_id() → uuid`;
  `my_overview() → jsonb` `{household:{id,name}, members:[{name,age}], balance:{…}, visit:{id,started_at,items:[{scan_id,product_id,name,portion,points,image_url,created_at}],points}|null, categories:[{id,name,color,spent_month}]}`;
  `register_scan(p_code text, p_use_advance bool default false) → jsonb` `{ok:true, scan_id, product:{code,name,portion,points,image_url,category}, balance, advance_used}` of `{ok:false, error:'NOT_MEMBER'|'NO_VISIT'|'UNKNOWN_PRODUCT'|'MAX_REACHED'|'INSUFFICIENT', product?, max?, balance?, can_advance?, advance_amount?}`;
  `remove_scan(p_scan_id uuid) → jsonb` `{ok, error?:'NOT_FOUND'|'VISIT_CLOSED', balance}`;
  `start_visit(p_household uuid, p_scan_point uuid) → jsonb` `{ok:true, already:bool, visit_id}` (zet open bezoeken ouder dan 4 u op `expired`, schrijft display_event `welcome` "Welkom, <naam>!");
  `finish_visit(p_household uuid, p_scan_point uuid) → jsonb` `{ok:true, visit_id, items, points, balance}` of `{ok:false,error:'NO_VISIT'}` (schrijft display_event `checkout`);
  `admin_stats() → jsonb` (alleen admin).
- `start_visit`/`finish_visit`: execute alleen voor `service_role`.
- Seed: categorieën Groente & fruit (#115656), Zuivel (#fd644e), Graanproducten (#115656), Overige plantaardig (#fd644e); producten PREI 1 (stuk), APPELS 2, AARDAPPELS 3 ("1 kilo"), POMPOEN 4, BROOD 10 ("1 brood"), MELK 7 ("1 liter"), YOGHURT 5, HAVERMOUT 3 ("1 schep"); scanpunten `ingang` (entrance) en `kassa` (checkout); huishouden "Familie Yilmaz" (2×40, 12, 8, 5 → 31.200) met vaste `card_code` `DEMO-YILMAZ-PAS-0001`, startmaand 2026-01-01.

- [ ] Step 1: Schrijf `points.test.sql` (pgTAP) met: `points_for_age` 13→7280, 12→6240, 9→6240, 8→5200, 4→5200, 3→0; budget Yilmaz = 31200, override 12000 → 12000; `month_allowance(7280,1)=606`, `(7280,2)=607`, som 1..12 = 7280; saldo op 2026-03-15 (start jan, 1000 besteed in feb) → accrued 7800, available 6800, spent_month 0; start 2026-11 op 2026-11-20 → accrued 2600; op 2027-01-10 → accrued 2600 en spent_year telt 2026 niet; voorschot maart → maart available +2600 & can_advance false, april can_advance false & month_budget 0, mei can_advance true; voorschot dec 2026 → op 2027-01-05 accrued−voorschot = 0.
- [ ] Step 2: Schrijf in hetzelfde bestand register_scan-tests (als `authenticated` met jwt-claims van het testhuishouden): zonder bezoek → `NO_VISIT`; onbekende code → `UNKNOWN_PRODUCT`; met bezoek → ok en available daalt met de punten; `max_per_visit=1` tweede keer → `MAX_REACHED`; budget_override 12 (tegoed 1/maand) + product 3 punten → `INSUFFICIENT` met can_advance true; daarna met `p_use_advance` → ok=false wanneer voorschot niet genoeg is vs ok=true wanneer wel (gebruik override zodat een voorschot precies volstaat); saldo exact op → tweede scan `INSUFFICIENT`; `remove_scan` herstelt saldo; `remove_scan` na `finish_visit` → `VISIT_CLOSED`.
- [ ] Step 3: Schrijf `rls.test.sql`: lid A ziet geen scans/huishouden van B; lid kan niet `insert into scans`; lid kan `start_visit` niet uitvoeren (permission denied); lid ziet geen `scan_points`; admin ziet alles.
- [ ] Step 4: `supabase start` en `supabase test db` → FAIL (functies bestaan niet).
- [ ] Step 5: Schrijf de migraties en seed. Algoritme `household_balance` (de enige niet-triviale logica):
  ```
  local := at AT TIME ZONE 'Europe/Amsterdam'; y, m := jaar, maand van local
  J := household_year_budget(h)
  s := 1 als start_month < 1 jan y; maand(start_month) als zelfde jaar; anders 13
  accrued := (s<=m) ? floor(J*m/12) - floor(J*(s-1)/12) : 0
  adv_this := advances.amount voor maand (y,m) of 0
  adv_prev := advances voor de vorige maand (kan december y-1 zijn)
  if adv_prev bestaat en vorige maand ligt in jaar y-1: accrued -= adv_prev.amount
  available := accrued + adv_this - spent_year (scans niet teruggelegd, lokaal jaar y)
  month_allowance := (s<=m) ? month_allowance(J,m) : 0
  month_budget := (adv_prev ? 0 : month_allowance) + adv_this
  next_month_allowance := month_allowance(J, m=12 ? 1 : m+1)
  can_advance := adv_this = 0 AND adv_prev bestaat niet AND s<=m
  ```
  `register_scan`: lock `households` rij `for update`; open bezoek = status 'open' en started_at > now()-4h; voorschot alleen als `available < points` én `p_use_advance` én `can_advance` én `available + next_month_allowance >= points`; anders `INSUFFICIENT`.
- [ ] Step 6: `supabase db reset && supabase test db` → alle tests PASS.
- [ ] Step 7: Commit `feat(db): schema, RLS en eetpuntenlogica met pgTAP-tests`.

### Task 3: Wisselende QR-token en scan-parser (Vitest)

**Files:** `server/utils/qrToken.ts`, `app/utils/scanCode.ts`, `tests/unit/qrToken.test.ts`, `tests/unit/scanCode.test.ts`.

**Interfaces (Produces):**
- `type ScanKind = 'in' | 'uit'`
- `currentWindow(intervalSec: number, nowMs?: number): number`
- `signQrToken(secret: string, slug: string, kind: ScanKind, window: number): string` → `"<window>.<sig22>"`
- `verifyQrToken(secret, slug, kind, token: string, intervalSec: number, nowMs?: number): boolean`
- `parseScan(raw: string): ParsedScan` met `ParsedScan = {type:'product',code} | {type:'checkin',slug,token} | {type:'checkout',slug,token} | {type:'card',code} | {type:'unknown',raw}`

- [ ] Step 1: Tests `qrToken`: sign is deterministisch en 22 tekens na de punt; verify huidig venster → true; vorig venster → true; venster −2 → false (foto van 3 min oud, interval 60); andere slug → false; kind `in` token bij `uit` → false; gemanipuleerde sig → false; rommel (`"abc"`, `""`) → false.
- [ ] Step 2: Tests `parseScan`: `https://x.vercel.app/p/prei` → product `PREI`; `/in/ingang?t=123.abc` → checkin; `/uit/kassa?t=…` → checkout; `/pas/DEMO-YILMAZ-PAS-0001` → card; host maakt niet uit (`http://localhost:3000/p/MELK`); `8712345678906` → product (EAN); `" melk "` → product `MELK`; `https://google.com/zoek` → unknown; `/in/ingang` zonder t → unknown.
- [ ] Step 3: `npx vitest run` → FAIL. Step 4: implementeer (node:crypto `createHmac`, `timingSafeEqual`; `URL` voor parsing). Step 5: PASS. Step 6: Commit `feat: wisselende QR-tokens en scan-parser`.

### Task 4: Serverroutes (display, in/uitchecken, pas-login, account)

**Files:** `server/utils/requireAdmin.ts`, `server/utils/householdAccount.ts`, `server/api/display/[slug].get.ts`, `server/api/visit/check-in.post.ts`, `server/api/visit/check-out.post.ts`, `server/api/auth/card.post.ts`, `server/api/admin/households/[id]/account.post.ts`, `scripts/create-admin.mjs`.

**Interfaces:**
- Consumes: `signQrToken`, `verifyQrToken`, `currentWindow` (Task 3); `start_visit`, `finish_visit` (Task 2).
- Produces:
  - `GET /api/display/:slug?key&since` → `{kind:'in'|'uit', name, url, expiresAt:number(ms), intervalSeconds, events:[{id,kind,title,detail,created_at}]}`; 404 onbekend, 401 verkeerde key. Events alleen van de laatste 30 s en `id > since`.
  - `POST /api/visit/check-in {slug,t}` → `{ok:true, already, visitId, householdName}` | `{ok:false, error:'EXPIRED_CODE'|'NOT_MEMBER'|'UNKNOWN_POINT'}`; 401 zonder sessie.
  - `POST /api/visit/check-out {slug,t}` → `{ok:true, visitId, items, points, balance}` | `{ok:false, error:'EXPIRED_CODE'|'NO_VISIT'|'NOT_MEMBER'|'UNKNOWN_POINT'}`.
  - `POST /api/auth/card {code}` → `{tokenHash}` (client: `supabase.auth.verifyOtp({token_hash, type:'email'})`) | 404.
  - `POST /api/admin/households/:id/account` → `{userId, email}` (maakt/actualiseert auth-gebruiker; zonder e-mail: `hh-<id>@leden.robin.invalid`).
  - `ensureHouseholdUser(event, household): Promise<{userId,email}>`; `requireAdmin(event): Promise<User>`.
  - `node scripts/create-admin.mjs <email> <wachtwoord>` (leest `SUPABASE_URL` + `SUPABASE_SECRET_KEY` uit env).
- [ ] Step 1: Implementeer de routes (service-role client via `serverSupabaseServiceRole`).
- [ ] Step 2: Verifieer met curl tegen `npm run dev` + lokale Supabase: display-route geeft url + events; check-in met verlopen token → `EXPIRED_CODE`; pas-login met `DEMO-YILMAZ-PAS-0001` → tokenHash.
- [ ] Step 3: Commit `feat(api): display-tokens, in/uitchecken en pas-login`.

### Task 5: Ledenschermen — login, home, saldo, profiel

**Files:** `app/composables/{useToast,useConfirm,useOverview}.ts`, `app/components/{AppDialog,ToastHost,PointsSummary,CategoryBars}.vue`, `app/utils/format.ts`, `app/pages/{index,saldo,profiel,login,confirm}.vue`, `app/pages/pas/[code].vue`.

**Interfaces:**
- Produces: `useToast(): {show(msg: string, kind?: 'ok'|'error'|'info'): void}`; `useConfirm(): (opts:{title, body?, confirmLabel?, cancelLabel?}) => Promise<boolean>`; `useOverview(): {overview: Ref<Overview|null>, refresh(): Promise<void>, pending}`; `formatPoints(n) → "31.200"` (nl-NL).
- Login: grote knop "Scan je ledenpas" (opent QrScanner; card → pas-login), en "Inloggen met e-mail" (`signInWithOtp`, `shouldCreateUser:false`, `emailRedirectTo: <origin>/confirm`). `/pas/[code]` logt direct in.
- Home volgens `Screenshot app Robin - juiste design.png` met maandcijfers: "Hoi familie X!" / "Samen eten, samen kiezen", kaart "Jullie eetpunten · 31.200 per jaar | 2.600 per maand", gezinsleden, "Deze maand per categorie", saldo-kaart, statusblok (ingecheckt of niet). Beheerder zonder huishouden → link naar `/beheer`.
- Saldo: saldo, maandbudget/gebruikt, voorschotstatus, eerdere bezoeken.
- [ ] Step 1: Test `formatPoints(31200) === '31.200'` in `tests/unit/format.test.ts` → FAIL → implementeer → PASS.
- [ ] Step 2: Bouw de schermen; verifieer in Playwright (390×844): inloggen via `/pas/DEMO-YILMAZ-PAS-0001` → home toont 31.200 en 2.600.
- [ ] Step 3: Commit `feat: ledenschermen login, home, saldo en profiel`.

### Task 6: Scannen — scanner, scanflow, deep links, voorschot

**Files:** `app/components/{QrScanner,ScanResultSheet}.vue`, `app/composables/useScanFlow.ts`, `app/pages/scan.vue`, `app/pages/p/[code].vue`, `app/pages/in/[slug].vue`, `app/pages/uit/[slug].vue`, `tests/unit/scanFlow.test.ts`.

**Interfaces:**
- Consumes: `parseScan` (T3), API's (T4), `register_scan`/`remove_scan` (T2), `useOverview().refresh`.
- Produces: `createScanGate(windowMs = 2500): (raw: string, nowMs?: number) => boolean` (true = verwerken) in `useScanFlow.ts`; `useScanFlow(): {state: Ref<ScanState>, handleRaw(raw), useAdvance(), removeScan(id), reset()}` met `ScanState = {status:'idle'|'busy'|'result', result?: ScanResult}`.
- Foutteksten: `NO_VISIT` "Scan eerst de QR-code bij de ingang."; `UNKNOWN_PRODUCT` "Dit product kennen we niet. Vraag het even aan een medewerker."; `MAX_REACHED` "Je hebt al het maximum van dit product (max. N per bezoek)."; `INSUFFICIENT` (can_advance) "Je hebt niet genoeg punten deze maand." + knop "Gebruik mijn budget van volgende maand (+N punten)"; zonder can_advance "Je hebt niet genoeg punten. Volgende maand kun je weer verder."; `EXPIRED_CODE` "Deze code is verlopen. Scan de code op het scherm opnieuw."
- [ ] Step 1: Test `createScanGate`: zelfde raw binnen 2500 ms → tweede false; na 2600 ms → true; andere raw direct → true. FAIL → implementeer → PASS.
- [ ] Step 2: QrScanner (ClientOnly, `formats: ['qr_code','ean_13']`, achtercamera, camerafouten in het Nederlands, handmatige invoer "Code intypen").
- [ ] Step 3: Scanpagina: camera blijft aan, resultaatkaart (productfoto/initiaal, naam, portie, "−3 punten", nieuw saldo, "Verder scannen"), mandje van dit bezoek met "Terugleggen" (via `useConfirm`), trillen + korte piep bij succes.
- [ ] Step 4: Deep-linkpagina's gebruiken dezelfde flow en tonen het resultaat met knop "Naar de scanner".
- [ ] Step 5: Playwright: inchecken via een vers token van `/api/display/ingang` → `/p/PREI` → saldo −1 → `/uit/kassa?t=…` → overzicht. Commit `feat: scannen met voorschot, mandje en deep links`.

### Task 7: Display-scherm voor poortje en kassa

**Files:** `app/pages/display/[slug].vue`.
- Consumes: `GET /api/display/:slug`, `QrImage`.
- Groen scherm, beige logo, grote QR op beige vlak, kop "Scan om binnen te komen" (in) / "Scan om af te ronden" (uit), aftelbalk tot `expiresAt`, poll elke 2 s, event-overlay 5 s ("Welkom, familie Yilmaz!" / "Familie Yilmaz · 8 producten · 46 punten"), Wake Lock. Foute key → nette foutmelding.
- [ ] Step 1: Bouw; Playwright: QR wisselt na interval (zet interval tijdelijk op 10 s in de db), overlay verschijnt na check-in. Commit `feat: display voor ingang en kassa`.

### Task 8: Beheer

**Files:** `app/layouts/admin.vue`, `app/middleware/admin.ts`, `app/pages/beheer/{index,producten,scanpunten,registraties}.vue`, `app/pages/beheer/huishoudens/{index,[id]}.vue`; Storage-bucket `product-images` (migratie `20261109120200_storage.sql`, publiek lezen, admin schrijven).
- Consumes: `admin_stats()`, tabellen via admin-RLS, `POST /api/admin/households/:id/account`, PDF-builders (Task 9).
- Producten: tabel + formulier (code automatisch uit naam, hoofdletters, bewerkbaar), foto-upload, actief-schakelaar, selectievakjes → "Labels printen" (formaat klein/groot, stijl Robin/hoog contrast). Paneel "Categorieën" op dezelfde pagina (naam, kleur groen/koraal, volgorde).
- Huishoudens: lijst met saldo; detail met gezinsleden (naam, leeftijd), berekend vs handmatig budget, startmaand, e-mail (opslaan roept account-route aan), "Ledenpas printen", "Nieuwe pascode" (via `useConfirm`: oude pas werkt dan niet meer), registraties.
- Scanpunten: naam, soort, interval, link "Open display" (met key), "Nieuwe displaysleutel", "Ingangsposter printen".
- Registraties: bezoeken (status, niet-uitgecheckt), scans.
- [ ] Step 1: Bouw; Playwright: admin maakt product "Wortels" 2 punten aan, huishouden met 1 volwassene → budget 7.280, pas-login van dat huishouden werkt. Commit `feat: beheeromgeving`.

### Task 9: PDF's — labels, ledenpassen, poster

**Files:** `app/utils/pdf/{brand,labels,cards,poster}.ts`, `tests/unit/pdf.test.ts`.

**Interfaces (Produces):**
- `type BrandAssets = {lektorat: Uint8Array, workSans: Uint8Array, logoPaths: string[] /* SVG path d's, viewBox 1379.14×543.94 */}`; `loadBrandAssets(fetcher?): Promise<BrandAssets>` (browser: fetch uit `/fonts`, `/brand`).
- `buildLabelsPdf(products: {code,name,points}[], opts: {size:'klein'|'groot', style:'robin'|'hoog', baseUrl: string}, assets): Promise<Uint8Array>` — klein 95×45 mm, 2×5 per A4 staand; groot 138×65 mm, 2×2 per A4 liggend; 5 mm tussenruimte; "eetpunt" bij 1, anders "eetpunten".
- `buildCardsPdf(households: {name, cardCode}[], baseUrl, assets): Promise<Uint8Array>` — 85,6×54 mm, 2×5 per A4.
- `buildPosterPdf(baseUrl, assets): Promise<Uint8Array>` — A4.
- `drawQr(page, text, x, y, size, color)` via `QRCode.create(text,{errorCorrectionLevel:'M'})`, met stille zone van 2 modules.
- [ ] Step 1: Tests (assets via `fs` uit `public/`): 11 producten klein → 2 pagina's; 4 groot → 1 pagina; 3 passen → 1 pagina; poster → 1 pagina; uitvoer begint met `%PDF`.
- [ ] Step 2: FAIL → implementeer → PASS.
- [ ] Step 3: Verificatie scanbaarheid: script `scripts/verify-labels.mjs` rendert (pymupdf) en decodeert met zxing-wasm beide stijlen → verwachte URL's `…/p/PREI`. Visueel vergelijken met `docs/reference/Eetpunten.png`.
- [ ] Step 4: Commit `feat: PDF-labels, ledenpassen en ingangsposter in Robin-stijl`.

### Task 10: Eind-tot-eind en oplevering

**Files:** `README.md`, `.env.example`.
- [ ] Step 1: Volledige route in Playwright op 390×844: pas → home → display ingang → check-in → 3 producten → te weinig punten → voorschot → terugleggen → kassa → saldo. Geen consolefouten.
- [ ] Step 2: `npm run build`, `npx vitest run`, `supabase test db` → alles groen.
- [ ] Step 3: README: lokaal draaien, env-variabelen (`SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SECRET_KEY`, `NUXT_QR_SECRET`, `NUXT_PUBLIC_SITE_URL`), beheerder aanmaken, deploy naar Supabase cloud + Vercel, testen op een telefoon (HTTPS nodig voor de camera).
- [ ] Step 4: Commit `docs: README voor lokaal draaien en deploy`.
