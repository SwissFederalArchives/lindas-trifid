---
"lindas-trifid-plugin-sparql-proxy": patch
---

Fix SPARQL proxy returning corrupted data when rewrite is enabled. The endpoint now properly handles responses by disabling compression when rewrite functionality is active, preventing ReplaceStream from corrupting binary compressed data.
