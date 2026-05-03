# TrackMania 2026 — Road to Riyadh

Live qualification tracker for the 2026 TrackMania competitive season: **EWC 2026** (Aug, Riyadh, $500k, 32 spots) and **ENC 2026** (Nov, Riyadh, $250k, 32 spots).

Single-page static site. Vanilla HTML / CSS / ES-module JS. No build step. Deployable to GitHub Pages as-is.

## Local preview

ES modules require an HTTP origin (not `file://`). Any static server works:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Settings → Pages → Source: `main` branch, `/` (root).
3. Wait ~1 min. Site is live at `https://<user>.github.io/<repo>/`.

The footer auto-detects the repo URL when hosted on `*.github.io`.

## Update standings

Edit **`data/players.json`** and push. That is the only file you need to touch.

| Field | Notes |
|---|---|
| `lastUpdated` | ISO timestamp shown in the hero. Bump on every edit. |
| `nations` | ISO-3166-α2 → `{ name, flag }`. Add when a new nationality appears. |
| `players[]` | `id` (lowercase, stable), `tag` (verbatim case — `CarlJr` not `Carljr`), `fullName`, `club`, `nationality` (α2 or `null`), `eliteCupRank`, `eliteCupPoints`. |
| `events.eliteCup.final` | Set to `true` after May 31 to stop the countdown and flip the badge to "Final". |
| `dreamhackResults` | `[{ rank, playerId }]`. Already final — should not change. |
| `ewcOnlineResults` | Fill after Jun 14 in finishing order: `[{ playerId }]`. |
| `regionalResults` | Fill after Jun 21 in finishing order. |
| `wildcards` | `[{ playerId, nation, note }]`. Use `null` while TBD. |

The site cache-busts the JSON fetch with `?v=<timestamp>`, so updates appear immediately after Pages redeploys.

**Never invent data.** If a nationality, fullName, or club is unknown, leave the field `null`.

## How qualification works

- **EWC 2026** (32 spots) = 8 DreamHack + 8 Elite Cup + 16 Online QR.
- **ENC 2026** (32 spots) = 16 Elite Cup (1 per nation) + 14 Regional + 2 Wildcard. Hard cap **2 per nation** across all paths.
- **Roll-down**: a DreamHack qualifier does not double-count. If they also rank Elite Cup top 8, that Elite Cup spot passes to the next non-DreamHack player. Same de-dupe applies if they later win an Online Qualifier.

All logic lives in `js/qualifiers.js` (pure, DOM-free, testable). A smoke test runs in the console on every page load — check DevTools.

## File layout

```
index.html            HTML skeleton + GoatCounter + font preconnects
css/styles.css        Design tokens, layout, components, responsive
data/players.json     Source of truth — only file you edit to update standings
js/main.js            Entry; orchestrates load → compute → render
js/data-loader.js     Fetch + schema validation + cache-bust
js/qualifiers.js      Pure: roll-down, nation cap, slot computation
js/render.js          DOM rendering per section + countdown
```

## Analytics

[GoatCounter](https://goatcounter.com) (privacy-friendly, no cookies, GDPR-safe). To enable:

1. Sign up, get your code (e.g. `tm2026`).
2. In `index.html`, replace `YOUR_CODE` in the `data-goatcounter` URL.

The page renders fine without it (script error is logged, not thrown).

## Stretch goals (not implemented)

- Auto-pull standings from the Liquipedia API.
- Weekly COTW countdown + previous week's top 10.
- Per-player profile pages with COTW-by-COTW results.
- Light-theme toggle.
- Embed widget (iframe).

## Contributing

Open a PR or issue if you spot a wrong tag, missing nationality, or stale standings. Tags are case-sensitive; double-check before submitting.

Not affiliated with Ubisoft Nadeo or the EWCF.
