---
"lindas-trifid-plugin-sparql-proxy": patch
---

Fix critical ReDoS vulnerability in ReplaceStream

- Escape regex special characters in ReplaceStream to prevent catastrophic backtracking attacks
- Prevents CPU exhaustion and service unavailability from malicious regex patterns
