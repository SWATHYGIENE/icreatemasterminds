# iCreateMasterminds

Landing page for **iCreateMasterminds** (icreatemasterminds.com), a program of Automate Your Journey. Leaders run **Journey Circles**: local groups of 6–10 non-competing business owners led by a certified circle leader. Static HTML/CSS/JS plus one Vercel serverless function that sends applications to GoHighLevel.

```
index.html        Landing page
styles.css        All styles (design tokens at the top)
main.js           Dues calculator + application form
api/apply.js      POST /api/apply → validates, forwards to GHL inbound webhook
privacy.html      Draft privacy policy (served at /privacy)
terms.html        Draft terms (served at /terms)
assets/           Favicon; drop a founder photo here
vercel.json       Clean URLs + security headers
```

## Deploy

1. Create a GitHub repo and push this folder:
   ```bash
   git remote add origin git@github.com:SWATHYGIENE/icreatemasterminds.git
   git push -u origin main
   ```
2. In Vercel: **Add New → Project → Import** the repo. Framework preset: **Other**. No build command, no output directory.
3. In GoHighLevel, create a workflow with an **Inbound Webhook** trigger and copy its URL.
4. In Vercel: **Settings → Environment Variables** → add `GHL_WEBHOOK_URL` = that URL (Production and Preview). Redeploy.
5. Submit a test application, then in the GHL workflow use **Create/Update Contact** to map the fields below.
6. Add your domain under **Settings → Domains**.

## Fields sent to GoHighLevel

| Field | Notes |
|---|---|
| `first_name`, `last_name`, `email`, `phone` | Standard contact fields |
| `company_name`, `industry`, `location`, `years_in_business` | Map to custom fields as needed |
| `circle_role` | `leader` or `member` |
| `swat_network_member` | true / false |
| `goals` | Free text |
| `sms_consent`, `consent_timestamp`, `consent_ip`, `page` | Keep these for your TCPA consent record |
| `utm_*`, `ref` | Pulled from the page URL |
| `tags` | `icreatemasterminds`, `jc-leader-applicant` or `jc-member-applicant`, `swat-network-member` |

## Before launch

- [ ] Point icreatemasterminds.com at Vercel (Dynadot DNS)
- [ ] Confirm the time commitment, circle size and meeting format in the **How a circle runs** and **straight answers** sections match the real program
- [ ] Adjust the calculator defaults/ranges in `index.html` (`#members`, `#dues`)
- [ ] Replace the `MC` placeholder with a photo in `assets/` (see comment in the founder section)
- [ ] Set the real contact email (search for `hello@automateyourjourney.com`)
- [ ] Have `privacy.html` and `terms.html` reviewed, and confirm the SMS consent wording with whoever handles your A2P 10DLC registration
- [ ] Add analytics or the GHL tracking script if you want it

## Local preview

`npx vercel dev` runs the page and the API together. For the page only, `npx serve .`

## Connected categories and collaboration circles

The new `/circles` workspace is served on this domain through an explicit Vercel rewrite to Agrarian Exchange. Both sites use the same canonical category IDs, parent hierarchy and moderation state. This provides immediate two-way visibility without duplicate category stores or synchronization jobs.

Members can register or sign in using their existing shared Agrarian account, join individual category circles, post, reply, report content and suggest categories/subcategories. Browser sessions are scoped separately to each domain. No account credentials or database secrets are stored in this repository. Category participation does not create a trading profile, credit ledger or paid Journey Circle enrollment.

The shared implementation and database migrations live in `SWATHYGIENE/agrarianexchange`, under `lib/circles.ts`, `lib/circle-pages.ts`, `lib/circle-actions.ts`, and `app/circles/[[...path]]/route.ts`. Deploy that project before this site when changing routes. See its `docs/connected-circles.md` for verification and operational details.

All circle responses, including proxied responses, are private/no-store. The origin checks production domain origins on every POST. Never cache the circle workspace or rewrite unrelated Agrarian pages. Circle availability depends on the Agrarian service; the marketing page and application endpoint remain independent.
