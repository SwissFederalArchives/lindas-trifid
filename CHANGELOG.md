# lindas-trifid Changelog

**Repository:** SwissFederalArchives/lindas-trifid
**Description:** LINDAS fork of Trifid - Lightweight Linked Data Server

---

## December 2025

### 2025-12-15

**`2cb3aa3b` - Bump package versions for npm release**
- Version bump for npm publishing

### 2025-12-12

**`1566435b` - Fix CSP headers and remove provenance from packages**
- Fixed Content Security Policy header configuration
- Removed provenance metadata from packages

### 2025-12-10

**`47664245` - Update changeset with @lindas/* scoped package names**
- Updated changeset for new package naming

**`66cea8e0` - Add @lindas/clownface dependency to ckan package**
- Added clownface dependency to CKAN plugin

**`baca248c` - Regenerate package-lock.json for @lindas/* dependencies**
- Updated lockfile for new dependencies

**`48d1042a` - Migrate to @lindas/* scoped npm packages and update dependencies**
- Major migration to LINDAS-branded packages:
  - lindas-trifid
  - @lindas/trifid-core
  - @lindas/trifid-entity-renderer
  - @lindas/trifid-plugin-markdown-content
  - @lindas/trifid-plugin-ckan
  - @lindas/trifid-plugin-graph-explorer
  - @lindas/trifid-plugin-i18n
  - @lindas/trifid-plugin-sparql-proxy
  - @lindas/trifid-plugin-spex
  - @lindas/trifid-plugin-yasgui

### 2025-12-03

**`51fb076b` - Add changeset to republish all lindas-trifid packages**
- Prepared changeset for package republishing

**`c34d5af8` - Add changeset for ckan vulnerability fix**
- Added changeset for security fix

**`2155aeec` - Fix js-yaml vulnerability in ckan package**
- Fixed CVE via xmlbuilder2 in js-yaml dependency

**`6b885b29` - Local testing configuration for lindas-local-environment**
- Added local testing configuration

**`18845b4f` - Fix docker-sparql config to use lindas-trifid-* packages**
- Updated Docker configuration for new package names

---

## November 2025

### 2025-11-23

**`314d90dc` - Enable compression support in SPARQL proxy**
- Re-enabled gzip/deflate/brotli compression negotiation
- Removed `Accept-Encoding: identity` override that was disabling compression
- Fixed compression mismatch issues with cube-creator

### 2025-11-11

**`d19d2689` - Add changesets for security fixes in entity-renderer and sparql-proxy**
- Prepared changesets for security releases

**`961a1d24` - Apply critical security fixes: SPARQL injection, ReDoS, and open redirect vulnerabilities**
- **SPARQL Injection Fix (entity-renderer):** Fixed vulnerability where user-supplied URIs could modify SPARQL query semantics
- **ReDoS Fix (sparql-proxy):** Fixed regular expression vulnerable to catastrophic backtracking
- **Open Redirect Fix (entity-renderer):** Prevented malicious redirects to external sites through crafted URIs

**`5e677513` - Fix SPARQL proxy returning corrupted data when rewrite is enabled**
- Fixed data corruption issues in SPARQL proxy rewrite functionality

### 2025-11-06

**`a0972086` - Update sparql-proxy dependency to 3.0.3**
- Updated SPARQL proxy to version with compression fixes

**`a308b755` - Disable provenance for local npm publish**
- Disabled provenance for local publishing

**`61479fa4` - Bump lindas-trifid-plugin-sparql-proxy to 3.0.3**
- Version bump for SPARQL proxy

**`1e78d952` - Add changeset for SPARQL proxy compression fix**
- Added changeset for compression fix release

**`ebe250d2` - Fix SPARQL proxy returning corrupted data when rewrite is enabled**
- Another fix for data corruption with rewrites

**`8be66835` - Add backwards-compatible trifid binary alias**
- Added `trifid` as alias for `lindas-trifid` binary for backwards compatibility
- Fixes deployment errors: `Cannot find module '/app/node_modules/.bin/trifid'`

---

## October 2025

### 2025-10-27

**`dcadee20` - Update package-lock.json and normalize line endings**
- Normalized line endings for cross-platform compatibility

### 2025-10-22

**`78a20380` - Add nonce support to YASGUI plugin for CSP compliance**
- Added Content Security Policy nonce support to YASGUI plugin
- Enables per-request nonce tokens for inline scripts
- Required for CSP implementation in lindas-admin-ch

### 2025-10-16

**`732a9b58` - Rebrand all packages to LINDAS namespace and remove Zazuko references**
- Major rebranding from Zazuko to LINDAS
- Updated all package names to lindas-* or @lindas/*
- Removed all Zazuko references from code and documentation

**`1ef3ad98` - Update all imports to use lindas-* package names**
- Updated all import statements to new package names

**`ab6270d9` - Update @zazuko package imports to lindas-***
- Migrated @zazuko imports to @lindas

**`aeff8964` - Fix JSDoc reference to trifid-core**
- Fixed documentation references

**`2ea0f2ee` - Fix: Add test script to root package and update name to lindas-trifid-root**
- Added root test script for monorepo testing

---

## Summary

### Security Vulnerabilities Fixed

| Vulnerability | Package | Severity | Description |
|--------------|---------|----------|-------------|
| SPARQL Injection | entity-renderer | High | User URIs could modify query semantics |
| Open Redirect | entity-renderer | Medium | Malicious redirects via crafted URIs |
| ReDoS | sparql-proxy | Medium | Regex catastrophic backtracking |
| js-yaml CVE | ckan | Medium | Vulnerability via xmlbuilder2 |

### Package Migration

All packages rebranded from Zazuko to LINDAS:
- `trifid` -> `lindas-trifid`
- `trifid-core` -> `@lindas/trifid-core`
- `@zazuko/trifid-entity-renderer` -> `@lindas/trifid-entity-renderer`
- `@zazuko/trifid-plugin-sparql-proxy` -> `@lindas/trifid-plugin-sparql-proxy`
- And all other trifid plugins

### Features Added

- **CSP Nonce Support:** YASGUI plugin now supports Content Security Policy nonces
- **Backwards-Compatible Binary:** Added `trifid` alias for `lindas-trifid`
- **Compression Support:** Re-enabled gzip/deflate/brotli compression

### Bug Fixes

- Fixed SPARQL proxy data corruption with rewrites enabled
- Fixed compression mismatch causing cube-creator failures

---

*Last updated: 2025-12-15*
