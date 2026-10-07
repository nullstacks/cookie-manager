# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(Chrome / Brave Manifest V3 extension. The surface in scope is the toolbar popup, 400 px wide with height following its content up to the 600 px popup cap. Plain HTML/CSS/JS, no build step, zero dependencies.)

## Users

A mix of developers debugging sessions and auth, power users moving a session into curl / wget / yt-dlp or scripts, and privacy-minded people inspecting or clearing the cookies a site has set. The moment of use is mid-task with the site open in the tab behind the popup: a quick look, a value to grab, a cookie to tweak.

## Product Purpose

Puts the cookies for the current site in the toolbar instead of DevTools' Application tab: searchable, filterable, fully editable, with lossless export and import. Success is getting the one cookie value you need, or fixing one cookie, in a few seconds without opening DevTools, and moving a whole cookie set in or out in a standard format.

## Positioning

A full cookie editor that never touches the network: no account, no keys, no telemetry. It covers the whole loop for the active site (find, copy, edit, add, delete with undo, import, export in JSON / header string / Netscape cookies.txt) in a popup.

## Operating Context

- Opened from the toolbar on an http/https tab; other pages show an unsupported state.
- Reads and writes through the browser's own `chrome.cookies` API; HttpOnly cookies are editable.
- Preferences (theme, accent, sort, export mode, delete-all confirmation, show-domain) persist in `chrome.storage.local`.
- Short, interruptible visits; the popup closes the moment the task is done.

## Capabilities and Constraints

- Function that must survive any redesign: live cookie list for the site with search (name, value, domain); filters All / Session / Persistent / Secure / HttpOnly with live counts; expand a cookie to edit name, value, domain, path, expiry, SameSite and Host-only / Session / Secure / HttpOnly; add pre-filled for the site; copy a value; delete one with Undo; delete all with a two-click confirm and Undo; export as JSON, header string or Netscape to clipboard or file; import with format auto-detect; site favicon in the header; settings (theme Auto/Dark/Light, six accent colors, sort by name / domain / expiry / size, show domain on each cookie, export copy vs download, confirm delete-all, reset).
- Manifest V3 CSP: no remote scripts, no inline event handlers; no network requests from the popup.
- Light and dark appearance both supported, with an explicit Auto / Dark / Light override.
- Rows can be numerous (hundreds); the list must stay fast.

## Brand Commitments

- The previous look (serif header, bundled Young Serif / Schibsted Grotesk / IBM Plex Mono, moss-black and bone palette, red-orange accent, stamp-style tags) is released.
- **Standing direction (user-chosen):** the same clean, Apple-native system as the sibling Temp Mail extension: system typography, inset grouped lists, hairline separators, semantic system colours, native-feeling controls, played straight. No decorative world. The six selectable accent colors are a feature and stay, restyled as system colours with blue as default.

## Evidence on Hand

- Real flows and states exist in code (`popup.html`, `popup.css`, `popup.js`).
- No screenshots, research or analytics are on hand. None may be invented.

## Product Principles

1. The value you came for is one click away: copying a cookie's value is always visible, never behind hover.
2. Editing is one expand away from the list; the list is the product, not a dashboard around it.
3. Destructive actions are reversible (Undo) and bulk deletion needs a second click.
4. The popup is a pit stop: dense but calm, and it fits its content instead of reserving empty space.
5. It should feel like part of the operating system, not like a web page.

## Accessibility & Inclusion

Keyboard reachable controls with visible focus, no nested interactive elements, text contrast of at least 4.5:1 in both themes and for every selectable accent, no information carried by colour alone, reduced motion respected.
