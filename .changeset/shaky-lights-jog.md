---
"lindas-trifid-plugin-sparql-proxy": patch
---

Always set Accept-Encoding: identity to prevent compression issues. The xquery plugin in downstream applications strips content-encoding headers, causing compressed responses to appear as random noise. This fix ensures uncompressed data is always returned from the backend regardless of rewrite settings.
