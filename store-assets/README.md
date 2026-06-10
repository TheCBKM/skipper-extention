# Chrome Web Store Screenshots

Promotional images for the Chrome Web Store listing.

| File | Size | Use |
|------|------|-----|
| `screenshot-1280x800.png` | 1280×800 | Global screenshot (required) |
| `screenshot-440x280.png` | 440×280 | Small promo tile |
| `screenshot-1400x560.png` | 1400×560 | Marquee promo tile |

## Regenerate

```bash
cd store-assets
npx playwright install chromium
node generate-screenshots.mjs
```

Source templates: `screenshot-*.html` and `popup-mockup.html`.
