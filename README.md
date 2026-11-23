# 🛡️ HistorySentry — Auto History Cleaner & Incognito Rules

<p align="center">
  <b>English</b> •
  <a href="README_zh.md">简体中文</a> •
  <a href="https://github.com/lazy-mantou/HistorySentry">GitHub</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/manifest-MV3-brightgreen.svg?style=flat-square" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/browsers-Chrome%20%7C%20Firefox%20%7C%20Edge%20%7C%20Brave-orange.svg?style=flat-square" alt="Cross-Browser" />
  <img src="https://img.shields.io/badge/dependencies-zero-purple.svg?style=flat-square" alt="Zero Dependencies" />
  <img src="https://img.shields.io/badge/telemetry-100%25%20offline-success.svg?style=flat-square" alt="100% Offline" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License MIT" />
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/khhoebefmcagfhninjncpjaljdanllki">
    <img src="https://img.shields.io/badge/Chrome%20Web%20Store-Install-4285F4?style=flat-square&logo=googlechrome&logoColor=white" alt="Chrome Web Store" />
  </a>
  <a href="https://microsoftedge.microsoft.com/addons/detail/mdanoeohlnfmbaonjhjkhfbidkfhebel">
    <img src="https://img.shields.io/badge/Edge%20Add--ons-Install-0078D7?style=flat-square&logo=microsoftedge&logoColor=white" alt="Microsoft Edge Add-ons" />
  </a>
  <a href="https://addons.mozilla.org/zh-CN/firefox/addon/historyguard/">
    <img src="https://img.shields.io/badge/Firefox%20Add--ons-Install-FF7139?style=flat-square&logo=firefoxbrowser&logoColor=white" alt="Firefox Add-ons" />
  </a>
</p>

> **HistorySentry** is a pure-native, cross-browser (Chrome, Edge, Brave, and Firefox) history protection and privacy defense extension. Engineered with a unified **Browser Adapter Pattern**, it decouples browser internals across Chromium and Gecko engines. HistorySentry provides intelligent zero-input rule generation via URL hierarchy parsing, sub-millisecond instant history wiping upon visit, anti-deadlock Places SQLite flow control, and a one-click 30-minute temporary incognito mode.

---

## ✨ Key Features

- **Full Dual-Kernel Engine Parity (Chrome & Firefox)**:
  - **Chromium**: Chrome / Edge / Brave (Manifest V3, powered by `background.service_worker` and `chrome.*` APIs).
  - **Firefox**: Gecko engine (Manifest V3, powered by `background.scripts` and native `browser.*` Promise APIs).
  - The core domain and UI logic never directly couple with global browser objects, abstracting all platform differences via `IBrowserAdapter`.
- **Intelligent URL Hierarchy Parsing (`urlParser.js`)**:
  - **Domain Level**: Automatically decomposes URLs into full domain, wildcard subdomain (`*.sub.domain.com`), and root domain (`*.domain.com`), equipped with a built-in multi-tier public suffix list (`.com.cn`, `.co.uk`, `.edu.cn`, etc.).
  - **Path Level**: Instantly offers precise page targets, directory wildcards (`domain.com/a/b/*`), recursive parent paths (`domain.com/a/*`), and site-wide wildcards (`domain.com/*`).
- **High-Precision Rule Matching Engine (`ruleMatcher.js`)**:
  - Enforces strict boundary checks against hostnames and authorized subdomains, preventing false-positive matches (e.g., safeguarding `mygoogle.com` from `google.com` rules).
  - Supports wildcard path compilation, cross-domain global keyword matching, and real-time reverse history querying.
- **Instant Background Protection & Temporary Incognito (`background/index.js`)**:
  - Real-time multi-channel interception via `onVisited`, `webNavigation`, and SPA hash/pushState changes—purging matched entries the instant a navigation occurs.
  - **30-Minute Temporary Incognito**: One-click silent browsing mode where all new navigations leave zero footprint, automatically reverting via `alarms` timers.
  - **Places Anti-Lock & Concurrency Throttling**: Tailored adaptive chunk deletion (`Chromium: 20` vs `Firefox: 6`) with micro-yield pacing (`setTimeout`) to avert Firefox Places SQLite single-writer deadlocks.
  - **Dynamic Toolbar Status Indicator**: Real-time icon color switching (Emerald Green for active protection, Tech Blue for standard standby) and contextual tooltips.
- **12-Language Internationalization Matrix (`i18n.js`)**:
  - Complete native localization for English, Simplified Chinese, Traditional Chinese, Spanish, Arabic (with native RTL support), Portuguese, Indonesian, French, Russian, German, Japanese, and Korean.
- **Adaptive Theme Engine (`theme.js`)**:
  - Seamless support for System Auto, Permanent Dark Mode, and Permanent Light Mode.
- **Modern Minimalist Responsive UI**:
  - **Popup View**: Compact 356px responsive layout with real-time history hit calculation, allowing instant "Protect & Clean" or "Delete History Only".
  - **Options Console**: Tab-based vertical navigation featuring deep history search & bulk deletion, full rule CRUD with pattern collision prevention, 90-day SVG trend visualization, JSON backup/restore, and advanced engine preferences.

---

## 🏗️ Architecture & Directory Structure

```text
HistGuard/
├── manifest.chrome.json       # Chromium MV3 Manifest (Service Worker Architecture)
├── manifest.firefox.json      # Firefox MV3 Manifest (Background Script Architecture)
├── package.json               # Metadata & Native NPM Scripts
├── build.js                   # Zero-dependency Dual-Browser Build Script
├── CHANGELOG.md               # Detailed Release & Iteration Notes
├── icons/                     # Icons (16/32/48/128/512 in Tech Blue & Emerald Green)
├── src/
│   ├── adapters/              # 【Adapter Layer】Unifies chrome.* vs browser.* APIs
│   │   ├── IBrowserAdapter.js # Abstract interface specifications
│   │   ├── ChromiumAdapter.js # Chromium implementation (Promise wrappers)
│   │   ├── FirefoxAdapter.js  # Firefox implementation
│   │   └── index.js           # Runtime environment sniffer & singleton exporter
│   ├── core/                  # 【Core Business Logic】(Decoupled from DOM & Browser)
│   │   ├── urlParser.js       # URL hierarchy parser & public suffix recognition
│   │   ├── ruleMatcher.js     # Regex compilation, boundary guards & keyword matching
│   │   ├── storage.js         # Atomic multi-key writes & 90-day rolling retention
│   │   ├── historyCleaner.js  # Async chunked deletion & concurrency throttling
│   │   ├── i18n.js            # Internationalization engine with interpolation
│   │   ├── theme.js           # Theme manager (Auto/Dark/Light)
│   │   └── locales/           # 12-language localized dictionary matrix
│   ├── background/            # 【Background Daemon】
│   │   ├── index.js           # Multi-channel real-time listener & alarms scheduler
│   │   └── toolbarIndicator.js# Toolbar icon status & badge renderer
│   ├── popup/                 # 【Popup Interface】(356px width, quick rule addition)
│   └── options/               # 【Options Dashboard】(History search, SVG charts, rules)
├── tests/                     # 【Native Unit Tests】(Built on node:test + node:assert/strict)
└── dist/                      # 【Build Artifacts】
    ├── chrome/                # Chromium unpacked distribution directory
    └── firefox/               # Firefox temporary add-on distribution directory
```

---

## 🚀 Build & Installation

### 🛒 Install from Browser Stores
- [![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/khhoebefmcagfhninjncpjaljdanllki) — [Chrome Web Store](https://chromewebstore.google.com/detail/khhoebefmcagfhninjncpjaljdanllki)
- [![Microsoft Edge Add-ons](https://img.shields.io/badge/Edge%20Add--ons-Install-0078D7?style=flat-square&logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/mdanoeohlnfmbaonjhjkhfbidkfhebel) — [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/mdanoeohlnfmbaonjhjkhfbidkfhebel)
- [![Firefox Add-ons](https://img.shields.io/badge/Firefox%20Add--ons-Install-FF7139?style=flat-square&logo=firefoxbrowser&logoColor=white)](https://addons.mozilla.org/zh-CN/firefox/addon/historyguard/) — [Firefox Add-ons (AMO)](https://addons.mozilla.org/zh-CN/firefox/addon/historyguard/)

### 1. Build the Extension
HistorySentry adheres strictly to a **zero third-party dependency** standard. It builds using native Node.js—**no** `npm install` required:
```bash
node build.js
# Or via npm
npm run build
```
Build outputs will be generated in `dist/chrome` and `dist/firefox`.

### 2. Install in Chromium (Chrome / Edge / Brave)
1. Navigate to `chrome://extensions/` (or `edge://extensions/` in Microsoft Edge).
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `dist/chrome` directory from this project root.

### 3. Install in Mozilla Firefox
1. Navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Browse and select the `dist/firefox/manifest.json` file.

### 4. Run Native Unit Tests
```bash
npm test
# Or directly via node
node --test tests/*.test.js
```

---

## 🔒 Privacy & Security Guarantee

1. **100% Offline & Local**: Zero telemetry, zero analytics, zero external network requests. All rule evaluations, history removals, and trend calculations occur strictly inside your local browser sandbox.
2. **Zero-Dependency Architecture**: No external bundling tools (Webpack/Vite), UI frameworks (Tailwind), or utility libraries (Lodash/Axios). The codebase is fully transparent and independently auditable.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
