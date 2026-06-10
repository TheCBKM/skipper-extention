# Chrome Web Store — Publishing Guide for Skipper

Use this checklist to publish **Skipper v2.0.1** on the Chrome Web Store.

---

## Phase 1 — Pre-publish (do this first)

### 1. Merge and test the production build

```bash
# From repo root
./scripts/package-extension.sh
```

This creates `dist/skipper-v2.0.1.zip` — **only upload this zip**, not the whole repo.

**Manual QA checklist:**

- [ ] Load unpacked extension from repo root in `chrome://extensions`
- [ ] Popup opens, toggles save and persist after reload
- [ ] YouTube watch page: platform ads skip, promos load in popup
- [ ] Prime Video: ads skip / fast-forward works
- [ ] Hotstar: ad container skip works
- [ ] No errors in service worker console (`chrome://extensions` → Inspect views)
- [ ] Options page opens from popup footer link

### 2. Host your privacy policy (required)

Chrome requires a **public HTTPS URL** because Skipper:

- Uses broad host permissions
- Sends YouTube caption data to a backend API

**Recommended:** GitHub Pages from this repo.

1. Push `docs/privacy-policy.html` to `main`
2. Repo → **Settings** → **Pages**
3. Source: **Deploy from branch** → `main` → `/docs`
4. Your site URLs will be:

   - Homepage: `https://thecbkm.github.io/skipper-extention/`
   - Support: `https://thecbkm.github.io/skipper-extention/support.html`
   - Privacy: `https://thecbkm.github.io/skipper-extention/privacy-policy.html`

   (Replace `TheCBKM` if your GitHub username/org differs.)

**Alternative:** Host `docs/privacy-policy.html` on any HTTPS site you control.

### 3. Prepare store images

Pre-built assets are in [`store-assets/`](../store-assets/):

| Asset | File | Size |
|-------|------|------|
| **Global screenshot** | `store-assets/screenshot-1280x800.png` | 1280×800 |
| **Small promo tile** | `store-assets/screenshot-440x280.png` | 440×280 |
| **Marquee promo** | `store-assets/screenshot-1400x560.png` | 1400×560 |
| **Store icon** | `icons/128.png` | 128×128 |

Upload the three PNGs above to the Chrome Web Store listing. To regenerate after UI changes:

```bash
cd store-assets
npx playwright install chromium
node generate-screenshots.mjs
```

### 4. Verify developer account

- [ ] [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) accessible
- [ ] One-time $5 developer registration fee paid (if not already)
- [ ] Account email verified

---

## Phase 2 — Create the listing

### 5. Open Developer Dashboard

1. Go to https://chrome.google.com/webstore/devconsole
2. Click **New item**
3. Upload `dist/skipper-v2.0.1.zip`
4. Wait for upload validation (manifest parse, no critical errors)

### 6. Store listing tab

Copy content from [`docs/STORE_LISTING.md`](STORE_LISTING.md):

| Field | Where to paste |
|-------|----------------|
| **Description** | Detailed description section |
| **Category** | Productivity (or Entertainment) |
| **Language** | English (add others later if desired) |

### 7. Privacy practices tab

| Question | Answer |
|----------|--------|
| **Single purpose** | Skip and fast-forward video advertisements on supported streaming sites |
| **Privacy policy URL** | Your hosted `privacy-policy.html` URL |
| **Uses remote code?** | **No** — all extension code is bundled; API returns JSON data only |
| **Data collection** | **Yes** — see below |

**Certified data use (disclose honestly):**

| Data type | Collected? | Purpose |
|-----------|------------|---------|
| Website content | Yes | Read page DOM and YouTube captions to detect ads |
| User activity | No | — |
| Personally identifiable info | No | — |

**Data handling:**

- Data is **not sold**
- Data is **not used for unrelated purposes**
- Caption/video metadata sent to promo API only for ad-segment detection

### 8. Permission justifications

Chrome may ask why each permission is needed. Use these:

| Permission | Justification |
|------------|---------------|
| `storage` | Save user toggle preferences (skip Prime ads, YouTube promos, etc.) |
| `tabs` | Detect the active tab’s platform to show status in the popup and reload tabs after install |
| `hotstar.com` | Detect and skip Hotstar ad video containers |
| `primevideo.com` / `amazon.*` | Detect Prime Video player UI and skip or fast-forward ads |
| `youtube.com` | Skip YouTube platform ads and fast-forward creator promo segments |
| `youtube-skip-ads-please-oregon.onrender.com` | Analyze caption data to detect creator promo time ranges on YouTube |

### 9. Distribution tab

| Setting | Recommendation |
|---------|----------------|
| **Visibility** | Public |
| **Regions** | All regions (or restrict as you prefer) |
| **Pricing** | Free |

### 10. Submit for review

1. Complete all required fields (red indicators)
2. Click **Submit for review**
3. Review typically takes **1–3 business days** (sometimes longer for broad host permissions)

---

## Phase 3 — After approval

### 11. Publish

When approved, click **Publish** to go live.

### 12. Share your listing URL

Format: `https://chromewebstore.google.com/detail/<extension-id>`

Find the ID in the Developer Dashboard after publishing.

### 13. Future updates

1. Bump `version` in `manifest.json` (e.g. `2.0.2`)
2. Run `./scripts/package-extension.sh`
3. Developer Dashboard → your item → **Package** → upload new zip
4. Submit for review again

---

## Common rejection reasons (avoid these)

| Issue | Fix |
|-------|-----|
| Missing privacy policy | Host `docs/privacy-policy.html` and add URL |
| Vague single-purpose description | Use exact text from STORE_LISTING.md |
| Undeclared remote data transmission | Disclose YouTube caption API in privacy form |
| Broken zip / missing icons | Run package script; verify icons in zip |
| Misleading listing | Don’t claim “blocks all ads everywhere” — list supported sites only |

---

## Quick links

- [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Program policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Branding guidelines](https://developer.chrome.com/docs/webstore/branding/)
- [Privacy policy template reference](https://developer.chrome.com/docs/webstore/program-policies/privacy/)
