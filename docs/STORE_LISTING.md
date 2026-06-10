# Chrome Web Store Listing Content (copy-paste ready)

---

## Extension name

```
Skipper — Skip Video Ads
```

(Chrome may truncate long names in some UI; short name in manifest is **Skipper**.)

---

## Short description (132 characters max)

```
Skip and fast-forward ads on Hotstar, Prime Video, and YouTube. Simple toggles, works automatically while you watch.
```

Character count: ~108

---

## Detailed description

```
Skipper helps you get back to your show faster by automatically skipping or fast-forwarding advertisements on supported streaming sites.

SUPPORTED PLATFORMS
• Hotstar — skips ad video segments automatically
• Amazon Prime Video — skips and fast-forwards Prime ads
• YouTube — skips platform ads and fast-forwards creator promo segments

HOW IT WORKS
Skipper runs only on the sites above. When you watch a video, it detects ad playback and either jumps past the ad or speeds through it. You stay in control with simple on/off toggles in the toolbar popup.

YOUTUBE CREATOR PROMOS
On YouTube watch pages, Skipper can analyze publicly available captions to find sponsored segments and fast-forward through them. Detected promo time ranges appear in the popup so you know what was skipped.

PRIVACY
• No account required
• Settings stored in your browser
• YouTube caption analysis uses a backend service only for promo detection — see our privacy policy for details

SETTINGS
Open the Skipper icon in your toolbar to:
• See which platform is active on the current tab
• Toggle Prime Video ad skipping
• Toggle YouTube platform ads and creator promos
• Open full settings

Skipper is built for viewers who want a cleaner, uninterrupted streaming experience on the platforms they already use.
```

---

## Single purpose description (for Privacy practices form)

```
Skipper's single purpose is to skip or fast-forward video advertisements on Hotstar, Amazon Prime Video, and YouTube while the user watches content on those sites.
```

---

## Category

**Primary:** Productivity  
**Alternative:** Entertainment

---

## Permission justification snippets

Use these if the review form asks per-permission:

**storage**
```
Stores user preferences such as whether to skip Prime Video ads or YouTube creator promos.
```

**tabs**
```
Reads the active tab URL to show which supported platform is active in the popup and to reload supported tabs after the extension is installed or updated.
```

**host_permissions (streaming sites)**
```
Required to inject content scripts that detect and skip advertisements in the video player on Hotstar, Prime Video, and YouTube pages only.
```

**host_permissions (promo API)**
```
Sends YouTube caption text and video metadata to our server solely to detect creator promotional segments and return time ranges for fast-forwarding.
```

---

## Privacy policy URL

```
https://thecbkm.github.io/skipper-extention/privacy-policy.html
```

Update the domain if you host elsewhere.

---

## Support / homepage URLs

| Field | URL |
|-------|-----|
| Homepage | `https://thecbkm.github.io/skipper-extention/` |
| Support | `https://thecbkm.github.io/skipper-extention/support.html` |
| GitHub (issues) | `https://github.com/TheCBKM/skipper-extention/issues` |

---

## Suggested screenshot captions

1. **Toolbar popup** — “Control ad skipping per platform from one simple popup”
2. **YouTube promos** — “See detected creator promo segments on YouTube watch pages”
3. **Settings** — “Full settings page with clear toggles for each feature”

---

## What to tell reviewers (optional “Notes to reviewer”)

```
Skipper skips ads on Hotstar, Prime Video, and YouTube only.

To test YouTube:
1. Install the extension
2. Open any YouTube watch URL (youtube.com/watch?v=...)
3. Open the toolbar popup — promo intervals may load after a few seconds
4. Platform ads are skipped automatically when they appear

To test Prime Video:
1. Open primevideo.com and play any title with ads
2. Ensure "Skip Prime Video ads" is enabled in the popup

To test Hotstar:
1. Open hotstar.com and play content with ads
2. Hotstar skipping is always enabled

Privacy policy: [your URL]
Backend API is used only for YouTube caption-based promo detection.
```
