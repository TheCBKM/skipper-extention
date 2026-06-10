# Skipper

Chrome extension that automatically skips or fast-forwards ads on **Hotstar**, **Amazon Prime Video**, and **YouTube**.

## Install (development)

1. Clone this repository
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the repo root

## Build for Chrome Web Store

```bash
chmod +x scripts/package-extension.sh
./scripts/package-extension.sh
```

Upload `dist/skipper-v<version>.zip` to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

Store listing images are in [`store-assets/`](store-assets/) (1280×800, 440×280, 1400×560). Regenerate with `node store-assets/generate-screenshots.mjs` after installing Playwright Chromium.

## Publishing

See **[docs/CHROME_WEB_STORE.md](docs/CHROME_WEB_STORE.md)** for the full step-by-step guide and **[docs/STORE_LISTING.md](docs/STORE_LISTING.md)** for copy-paste listing content.

Hosted site (enable GitHub Pages from `/docs` before publishing):

- Homepage: `https://thecbkm.github.io/skipper-extention/`
- Support: `https://thecbkm.github.io/skipper-extention/support.html`
- Privacy: `https://thecbkm.github.io/skipper-extention/privacy-policy.html`

## Project structure

```
core/           Settings, messaging, platform registry
ui/             Popup and options pages
background/     Service worker and YouTube API service
platforms/      Per-site ad-skip plugins (hotstar, prime, youtube)
content/        Bootstrap content script
```

## License

Proprietary — all rights reserved unless otherwise specified by the repository owner.
