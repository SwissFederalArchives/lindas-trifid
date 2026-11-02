---
'@lindas/trifid-plugin-spex': patch
---

Prevent forwarded-host JavaScript injection and shared endpoint poisoning in SPEX. Resolve relative endpoints against the browser page URL and safely serialize inline configuration. Custom SPEX templates must embed `options` directly as an object literal and resolve the endpoint in the browser, as shown in the plugin README.
