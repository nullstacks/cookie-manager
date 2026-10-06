# Installing Cookie Manager

Works in **Chrome** and **Brave** (Manifest V3). No account, no API keys, no build step, zero dependencies.

- [Option A — download a release zip](#option-a--download-a-release-zip)
- [Option B — from source (git)](#option-b--from-source-git)
- [First launch](#first-launch)
- [Using it](#using-it)
- [Updating](#updating)
- [Uninstalling](#uninstalling)
- [Troubleshooting](#troubleshooting)

---

## Requirements

- Chrome or Brave. Edge and other Chromium browsers generally work too, but only Chrome/Brave are tested.
- That's it — there is no `npm install`, no build, no configuration file to edit.

## Option A — download a release zip

1. Download the latest release: **[github.com/nullstacks/cookie-manager/releases/latest](https://github.com/nullstacks/cookie-manager/releases/latest)** — grab the `.zip` asset attached to it.
2. Unzip it. You should get a folder whose **root** contains `manifest.json`.
3. Continue at [First launch](#first-launch).

> Note: releases are cut manually and can lag behind the repo. If you want the very latest code, use Option B.

## Option B — from source (git)

```bash
git clone https://github.com/nullstacks/cookie-manager.git
```

Then continue at [First launch](#first-launch), selecting the cloned folder (`cookie-manager`) in step 3.

## First launch

1. Open the extensions page — type `chrome://extensions` in the address bar (`brave://extensions` in Brave).
2. Enable **Developer mode** (toggle, top-right corner).
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Pin the Cookie Manager icon: click the puzzle-piece icon in the toolbar → pin **Cookie Manager**. (Optional, but handy.)

Keep the original folder in place — loaded-unpacked extensions run from it. Don't delete the folder or move your clone after installing (if you do, **Load unpacked** the new location instead).

## Using it

- Open any **http/https** website, then click the toolbar icon → the popup lists every cookie for that site.
- Click a row to expand it. **Save** writes the cookie back through the browser's cookies API; changing name/domain/path replaces the old cookie in the same save.
- **Add** (+) creates a new cookie pre-filled for the current site (host-only, expiry +1 year, Secure on https pages).
- **Delete** (🗑 on the row) removes a single cookie — Undo appears in the toast. **Delete all** (🗑 in the header) asks for a second click and also carries Undo.
- **Export** (↓) copies or downloads the current cookies as **JSON**, a **header string** or **Netscape `cookies.txt`**. **Import** does the reverse — paste any of the three and the format is detected automatically.
- **Settings**: Auto/Dark/Light theme, accent color, sort order, show-domain-on-cards, export-to-clipboard-or-file, confirm-on-delete-all. Everything is saved automatically.

## Updating

- **Release zip:** download the new zip, unzip, and make sure `manifest.json` is still at the folder root, then reload (next step). Easiest: update the *same* folder in place.
- **Git clone:** `git pull` inside the folder.
- **Reload the extension:** `chrome://extensions` → find Cookie Manager → click the ↻ (reload) button. Your settings are preserved across updates; reloading only applies the code changes.

## Uninstalling

`chrome://extensions` → Cookie Manager → **Remove**. Your stored settings are deleted with it — the extension keeps nothing outside your browser.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Popup says "Unsupported page" | Cookies only exist for http/https pages. Open a real website (not `chrome://…`, the New Tab page or another browser-internal page) and try again. |
| "Browser rejected this cookie" | Check the domain (no leading dot needed — the **Host only** toggle handles that), the expiry date, and that a **Secure** cookie isn't being set from an `http://` page. SameSite=None also requires Secure in modern Chrome. |
| Import says "could not parse" | JSON must start with `[` or `{`; Netscape lines need 7 tab-separated columns; header strings need `name=value` pairs separated by `;`. Invalid lines are skipped, valid ones still import. |
| "Copy to clipboard failed" | The popup lost focus — the clipboard only works while the popup is visible. Click the toolbar icon again and retry, or switch Settings → Export action to **Download**. |
| Cookie saved but not visible on the page | Check that the domain and path actually match the site (a path of `/x` hides it from `/`). HttpOnly cookies save fine here even though page JavaScript can't read them. |
| Extension "disabled" after browser update | Re-open `chrome://extensions`; if a policy removed it (e.g. work machine), load it again via **Load unpacked** from your existing folder. |