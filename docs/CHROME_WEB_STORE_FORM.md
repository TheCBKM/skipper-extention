# Chrome Web Store — Privacy & Permissions Form (copy-paste)

Use this when submitting Skipper to the Chrome Web Store Developer Dashboard.

---

## Single purpose

```
Skipper's single purpose is to skip or fast-forward video advertisements on Hotstar, Amazon Prime Video, and YouTube while the user watches content on those sites.
```

---

## storage justification

```
Skipper uses the storage permission to save the user's extension preferences, such as whether to skip Prime Video ads, skip YouTube platform ads, or fast-forward YouTube creator promos. Settings are stored locally in Chrome sync storage so preferences persist across browser sessions and synced devices. YouTube promo detection results are also cached locally for a short time to reduce repeated network requests. No account is required.
```

---

## tabs justification

```
Skipper uses the tabs permission to identify which supported streaming site the user is currently viewing so the toolbar popup can show the correct platform status (for example, "Active on this tab" on YouTube). It is also used to reload supported streaming tabs after the extension is installed or updated so the latest content scripts are applied. Skipper does not read or modify tabs on unrelated websites.
```

---

## Host permission justification

```
Skipper requires host access only on the streaming sites it supports:

• hotstar.com — to detect and skip Hotstar ad video containers in the player.
• primevideo.com and regional amazon.com domains — to detect Prime Video player elements and skip or fast-forward ads.
• youtube.com — to skip YouTube platform ads and fast-forward creator promo segments on watch pages.
• youtube-skip-ads-please-oregon.onrender.com — to send YouTube caption text, timestamps, video ID, and video description to our backend solely for detecting sponsored promo time ranges when the user has creator-promo skipping enabled.

Skipper does not run on other websites. Host access is limited to ad detection and skipping on these supported platforms and the promo-detection API described in our privacy policy.
```

---

## Are you using remote code?

**Select:** `No, I am not using Remote code`

Skipper ships all JavaScript in the extension package. The extension may call a remote HTTPS API that returns JSON data for YouTube promo detection, but it does not download or execute external JavaScript, WebAssembly, or eval'd code.

*(Leave the remote code justification field empty when "No" is selected.)*

---

## Data usage — what to check

| Category | Check? | Notes |
|----------|--------|-------|
| Personally identifiable information | **No** | No name, email, or account data collected |
| Health information | **No** | |
| Financial and payment information | **No** | |
| Authentication information | **No** | No login or credentials |
| Personal communications | **No** | |
| Location | **No** | |
| Web history | **No** | Does not collect a browsing history list |
| User activity | **No** | No keystroke, scroll, or click logging |
| **Website content** | **Yes** | DOM on supported sites; YouTube captions/descriptions for promo detection |

---

## Data usage — certification (check all three)

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## Privacy policy URL

```
https://thecbkm.github.io/skipper-extention/privacy-policy.html
```

---

## Homepage URL

```
https://thecbkm.github.io/skipper-extention/
```

---

## Support URL

```
https://thecbkm.github.io/skipper-extention/support.html
```
