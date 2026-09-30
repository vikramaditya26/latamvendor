# Awign — LatAm vendor site

Onboarding site for **vendors**: companies that bring their own team of workers (10–1,000) to the `robotech-egocentric` data collection programme. The site for individual workers is a separate project (`vikramaditya26/Latam-`, awigntraining.vercel.app).

Static HTML/CSS/JS. No build step, no framework. Portuguese by default, with Spanish and English.

## What the site says (and deliberately does not say)

- Household tasks only — "general cooking, cleaning, laundry, organising". The task list itself lives in the Minute app.
- Awign deals with the vendor only. Each vendor gets **one organization code** and shares it with its workers. Awign does not contact workers.
- Awign pays the vendor on a **15-day payment cycle**. The vendor pays its workers however it likes.
- **Not on the site, on purpose:** the rate per hour, how money is transferred, the agreement/SOW, consent forms and quality rules. These are handled in the meeting and by Awign's own documents.

## Pages

```
index.html      vendor pitch: the work, how it works, who does what, FAQ
training.html   training for a vendor's workers (video, phones, examples, rules, Minute setup, quiz)
apply.html      vendor application form
privacy.html    rendered from i18n.js
terms.html      rendered from i18n.js
```

```
styles.css            design system (shared with the worker site) + vendor additions at the end
i18n.js               every string (PT + ES + EN) and the CONFIG block
script.js             nav/footer, language, videos, quiz, form
apps-script/Code.gs   Google Apps Script that writes applications to a Google Sheet
vercel.json           clean URLs + asset caching
assets/               logo, photos, videos (~61 MB)
```

The nav and footer are injected by `script.js`, so they are edited in one place.

## Application form → Google Sheet

Until `CONFIG.APPLY_ENDPOINT` is set, submitting the form opens WhatsApp with the details filled in, so no application is lost.

To connect the sheet:

1. Create a Google Sheet, then **Extensions → Apps Script** and paste `apps-script/Code.gs`.
2. **Deploy → New deployment → Web app**. Execute as **Me**, access **Anyone**.
3. Copy the URL ending in `/exec` into `CONFIG.APPLY_ENDPOINT` in `i18n.js` and push.

Each application becomes one row. Set `NOTIFY_EMAIL` in the script to also get an email per application. The form has a hidden honeypot field to drop bot submissions.

## Config — `i18n.js`, `CONFIG` block

| Key | Value |
|---|---|
| `APPLY_ENDPOINT` | Apps Script web-app URL. Blank = WhatsApp fallback |
| `WHATSAPP_NUMBER` / `WHATSAPP_DISPLAY` | Vendor contact number (digits only / formatted) |
| `WHATSAPP_MESSAGE` | Pre-filled message, per language |
| `PLAY_STORE_URL` / `PLAY_STORE_HL` / `APP_STORE_URL` | Minute app links on the training page |
| `PHONES` | Supported phones (iPhone 12+, Pixel 6+, Galaxy S21+) |
| `VIDEO` | Video paths. Portuguese uses the English recordings |
| `ANALYTICS_ENDPOINT` | Blank = events log to console |

## Language and theme

Every visit opens in Portuguese. A language picked with the toggle lasts for that tab only (`sessionStorage`), so it carries across pages. The theme (dark by default) persists in `localStorage`.

## Local

```bash
python3 -m http.server 5179
```

## Deploy

Import `vikramaditya26/latamvendor` at [vercel.com/new](https://vercel.com/new) and accept the defaults. Later pushes redeploy automatically.
