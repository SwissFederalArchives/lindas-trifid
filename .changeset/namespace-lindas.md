---
"lindas-trifid": major
"lindas-trifid-core": major
"lindas-trifid-handler-fetch": major
"lindas-trifid-plugin-graph-explorer": major
"lindas-trifid-plugin-i18n": major
"lindas-trifid-plugin-spex": major
"lindas-trifid-plugin-yasgui": major
"lindas-trifid-entity-renderer": major
"lindas-trifid-markdown-content": major
"lindas-trifid-plugin-ckan": major
"lindas-trifid-plugin-iiif": major
"lindas-trifid-plugin-sparql-proxy": major
---

Rename packages to LINDAS namespace and remove Zazuko branding

Remove all references to Zazuko and rebrand all packages under the LINDAS/Swiss Federal Archives namespace. This allows the fork to be published to npm independently and clearly indicates these are the LINDAS customizations of Trifid, not the original Zazuko packages.

Package name changes:
- trifid → lindas-trifid
- trifid-core → lindas-trifid-core
- trifid-handler-fetch → lindas-trifid-handler-fetch
- trifid-plugin-* → lindas-trifid-plugin-*
- @zazuko/trifid-* → lindas-trifid-*

Author updated to: Swiss Federal Archives / Lindas
