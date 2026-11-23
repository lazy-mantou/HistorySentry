# Privacy Policy for History Guard

**Last Updated:** November 16, 2026

History Guard ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains our practices regarding data collection, usage, and permissions.

---

### 1. Zero Data Collection & 100% Local Processing
History Guard is designed with a strict **Privacy-First** philosophy:
- **No Personal Data Collected:** We do not collect, track, store, or transmit any personal information, browsing behavior, identity data, or IP addresses.
- **Zero External Network Requests:** The extension operates 100% offline. It makes zero outgoing network calls to any remote servers, cloud endpoints, analytics trackers, or telemetry services.
- **Zero Third-Party Tracking:** We do not integrate any third-party SDKs, analytics libraries (e.g., Google Analytics), advertising networks, or monetization platforms.

---

### 2. Permissions & How They Are Used
All permissions requested by History Guard are strictly used within your local browser sandbox to provide core functionalities:

- **`history`**: Used solely to detect visits to user-defined protected websites and automatically erase matching history entries in milliseconds. Also used for local history search and batch cleanup in the options dashboard. History records are never read or uploaded externally.
- **`storage`**: Used to save your custom protection rules, theme settings, and local interception statistics inside the browser's local sandbox (`chrome.storage.local`). All data remains on your local device.
- **`tabs` & `activeTab`**: Used temporarily when clicking the extension icon to read the current tab's URL and title, enabling you to add instant protection rules for the active site.
- **`webNavigation`**: Used to detect client-side redirects and Single Page Application (SPA) history-state changes in real-time, ensuring lingering history entries are caught and deleted.
- **`alarms`**: Powers local timers for "Temporary Trace-Free Sessions" (15 minutes to 12 hours) and "Pause Protection" countdowns without persistent memory overhead.
- **`<all_urls>` (Host Permissions)**: Because users can dynamically protect any domain across the web, target hosts cannot be pre-declared. Host permissions are strictly used to match visited URLs against your local rule list. **History Guard never injects content scripts, never reads page DOM, and never accesses cookies, forms, or passwords.**

---

### 3. Data Storage, Retention, and User Control
- All rule lists, preferences, and aggregate interception counters are stored exclusively on your local device.
- You have complete control over your data: you can modify rules, clear all statistics, or uninstall the extension at any time, which permanently removes all local configuration data.

---

### 4. Third-Party Sharing and Sale of Data
We do not sell, rent, trade, transfer, or disclose any user data to third parties under any circumstances.

---

### 5. Changes to This Policy
If we make changes to this policy, we will update the "Last Updated" date at the top and publish the revised version in our repository.

---

### 6. Contact & Source Code
History Guard is open-source. If you have questions about this Privacy Policy, you can open an issue or reach out via our GitHub repository:
- **Repository:** https://github.com/lazy-mantou/HistorySentry
