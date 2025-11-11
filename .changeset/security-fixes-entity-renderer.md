---
"lindas-trifid-entity-renderer": patch
---

Apply critical security fixes: SPARQL injection and open redirect vulnerabilities

- Fix SPARQL injection in container queries by using STRSTARTS instead of REGEX
- Add open redirect protection with URL validation whitelist for Swiss government domains
- Validate all redirect URLs before redirecting (both SPARQL redirects and schema:URL redirects)
