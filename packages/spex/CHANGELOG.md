# trifid-plugin-spex

## 4.0.0

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

## 3.0.0

### Major Changes

- 499601f: The path to the CSS file needs to be changed from `static/style.css` to `static/spex.css` in case you are using a custom template for the SPEX plugin.

## 2.2.3

### Patch Changes

- a8a1f21: Set `@zazuko/spex` version to be exactly equal to `0.2.1`, as `0.2.2` will include a breaking change in the generated style file name, and might break some custom templates.

## 2.2.2

### Patch Changes

- f0e3b13: Fix and improve types references

## 2.2.1

### Patch Changes

- 724f2ed: Fix `requestPort` value, to handle `null` cases and simplify the logic

## 2.2.0

### Minor Changes

- 007e201: Upgrade Fastify to v5.

### Patch Changes

- 080f5d8: Harmonize author and keywords fields
- a97a6a0: Use Apache 2.0 license

## 2.1.1

### Patch Changes

- 1cafa55: Return `reply` in the `routeHandler`, in order to be compatible with the support for compression.

## 2.1.0

### Minor Changes

- 9d02f2a: Upgrade SPEX to 0.2.1.

## 2.0.2

### Patch Changes

- e8faa76: Internally use the new `render` function, that takes the `request` as first argument.

## 2.0.1

### Patch Changes

- 195cb7b: Bump import-meta-resolve from 3.0.0 to 4.0.0

## 2.0.0

### Major Changes

- 4b515f8: Use 'plugins' instead of 'middlewares'
- e069220: The plugin is now using the new Trifid factory, which is a breaking change.

## 1.1.4

### Patch Changes

- 7940ded: Upgrade `import-meta-resolve` to v3.0.0

## 1.1.3

### Patch Changes

- be26d8a: Upgrade @zazuko/spex to 0.1.20

## 1.1.2

### Patch Changes

- bb4119c: Improve style

## 1.1.1

### Patch Changes

- 06ff521: Use new SPEX option names internally

## 1.1.0

### Minor Changes

- 17fac44: Upgrade @zazuko/spex to 0.1.19
