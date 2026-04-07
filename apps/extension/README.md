# myManager browser extension

Quick-capture extension that saves the current page (or selected text) as a draft post in your myManager workspace.

## Install (development)

1. Open `chrome://extensions` (or `about:debugging` for Firefox).
2. Enable "Developer mode".
3. Click "Load unpacked" and select this `apps/extension` directory.
4. Click the extension icon → Settings, then enter:
   - **API base URL** — e.g. `http://localhost:3001/api/v1`
   - **API token** — generate in the web app under Settings → API Keys
   - **Workspace ID** — copy from the web app URL or admin panel

## Features

- **Popup** — capture the current tab title + URL with one click
- **Right-click → Save selection to myManager** — save any selected text
- **Right-click → Save page to myManager** — save the current page
- **Options page** — configure base URL, token, workspace

## Build for distribution

The extension is plain HTML/JS — no build step. To publish to the Chrome Web Store, zip the contents of this directory (excluding `README.md`).

## Permissions explained

- `activeTab` — read the current tab title/URL when the user clicks the popup
- `storage` — persist API token and workspace ID locally (sync storage)
- `contextMenus` — add the right-click "Save to myManager" entries
- `host_permissions` — restricted to `*.mymanager.app` and `localhost:3001`
