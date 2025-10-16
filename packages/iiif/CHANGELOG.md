# @zazuko/trifid-plugin-iiif

## 2.0.0

### Major Changes

- 732a9b5: Rename packages to LINDAS namespace and remove Zazuko branding

  Remove all references to Zazuko and rebrand all packages under the LINDAS/Swiss Federal Archives namespace. This allows the fork to be published to npm independently and clearly indicates these are the LINDAS customizations of Trifid, not the original Zazuko packages.

  Package name changes:

  - trifid → lindas-trifid
  - trifid-core → lindas-trifid-core
  - trifid-handler-fetch → lindas-trifid-handler-fetch
  - trifid-plugin-_ → lindas-trifid-plugin-_
  - @zazuko/trifid-_ → lindas-trifid-_

  Author updated to: Swiss Federal Archives / Lindas

## 1.1.1

### Patch Changes

- 724f2ed: Fix `requestPort` value, to handle `null` cases and simplify the logic

## 1.1.0

### Minor Changes

- 007e201: Upgrade Fastify to v5.

### Patch Changes

- 080f5d8: Harmonize author and keywords fields
- a97a6a0: Use Apache 2.0 license

## 1.0.4

### Patch Changes

- 1cafa55: Return `reply` in the `routeHandler`, in order to be compatible with the support for compression.

## 1.0.3

### Patch Changes

- 7442b22: Bump `@zazuko/env` from 2.1.1 to 2.2.0

## 1.0.2

### Patch Changes

- ffe692c: Upgrade `@tpluscode/rdf-string` from 1.1.3 to 1.2.1
- 009d545: Upgrade `sparql-http-client` to v3.0.0
- 3e60879: Use `@zazuko/env` instead of `rdf-ext`

## 1.0.1

### Patch Changes

- 2bfe266: Remove `@rdfjs/express-handler` dependency

## 1.0.0

### Major Changes

- 4b515f8: Use 'plugins' instead of 'middlewares'

### Minor Changes

- ed78cc9: The plugin is now using the new Trifid factory, which is a breaking change.
