<div align="center">

<img src="icons/128.png" width="96" alt="Cookie Manager logo">

# Cookie Manager

**A full cookie editor for Chrome & Brave — view, add, edit, delete, import & export cookies for the current site.**

![Chrome / Brave MV3](https://img.shields.io/badge/Chrome%20%2F%20Brave-MV3-4f46e5?logo=googlechrome&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-059669.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/nullstacks/cookie-manager?display_name=tag&sort=semver)](https://github.com/nullstacks/cookie-manager/releases/latest)
[![No dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](#install)

**[Install](#install)** · **[Features](#features)** · **[How it works](#how-it-works)** · **[Releases](https://github.com/nullstacks/cookie-manager/releases)**

</div>

---

Editing a cookie in the browser means opening DevTools, finding the Application tab and squinting at a table. Cookie Manager puts cookies in your toolbar instead: every cookie for the site you're on, searchable and filterable, fully editable — with lossless export and import in three standard formats. No account, no API keys, no build step, and it never makes a single network request.

## Features

- **View cookies for the current site** — live list with search (name, value or domain) and filters: All, Session, Persistent, Secure, HttpOnly
- **Full cookie editing** — name, value, domain, path, expiry (date-time picker), SameSite (None/Lax/Strict) plus Host-only, Session, Secure and HttpOnly flags; renaming or moving a cookie replaces the old one in a single save
- **Add & delete with undo** — one-click add pre-filled for the current site; delete one, or delete all with a two-click confirm; every delete carries an Undo in the toast
- **Export three ways** — JSON (full detail, re-importable), header string (`name=value; …`) and Netscape `cookies.txt` for curl / wget / yt-dlp — to the clipboard or as a file
- **Import with auto-detect** — paste JSON, a header string or a Netscape file; the format is detected automatically and invalid lines are skipped
- **Theming & behavior** — Auto/Dark/Light theme, six accent colors, sort by name / domain / expiry / size, show-domain-on-cards, export-to-clipboard-or-file preference
- **Zero footprint** — no background page, no network requests, MV3, zero dependencies, no build step

## Install

Works in Chrome and Brave (Manifest V3). No build step, no dependencies.

```bash
git clone https://github.com/nullstacks/cookie-manager.git
```

Then open `chrome://extensions` (or `brave://extensions`) → enable **Developer mode** → **Load unpacked** → select the cloned folder.

Prefer a zip? Download the `.zip` attached to the [latest release](https://github.com/nullstacks/cookie-manager/releases/latest), unzip, and load that folder instead.

> 📖 Full walkthrough — including updating, uninstalling and troubleshooting: **[INSTALL.md](INSTALL.md)**

## How it works

| | |
|---|---|
| **Reading & writing** | Everything goes through the browser's own `chrome.cookies` API for the active tab's site — the popup itself never touches the network. Changes apply immediately, including HttpOnly cookies you can't touch from page JavaScript. |
| **Export** | JSON keeps full detail (domain, path, SameSite, flags, store) and re-imports losslessly; the header string is what you paste into `curl -H`; Netscape is the standard `cookies.txt` format understood by curl, wget and yt-dlp. |
| **Import** | Paste any of the three formats — detection is automatic (JSON → header → Netscape). Missing fields are defaulted sanely: domain = current site, expiry = +1 year for header cookies. |
| **Safety nets** | Deletes are restorable via Undo; "Delete all" asks for a second click; name and expiry are validated before the browser sees them, and rejections surface a readable message instead of a silent failure. |

## Privacy

- Everything (cookies you view, your settings) stays **local** in your browser — the extension makes **no network requests at all**
- No analytics, no trackers, no telemetry
- Uses only the `cookies`, `clipboardWrite` and `storage` browser APIs; `<all_urls>` host access exists only so the cookies API can read and write per-site, never to fetch anything
- Nothing is stored beyond your own preferences in `chrome.storage.local`

## Contributing

Issues and PRs welcome — [open an issue](https://github.com/nullstacks/cookie-manager/issues) or fork and send a pull request. For bugs, include your Chrome/Brave version and the site or cookie that misbehaves.

## License

[MIT](LICENSE) © [Nullstacks](https://github.com/nullstacks)