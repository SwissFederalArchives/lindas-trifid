# JSON-LD 8 → 9 compatibility checks

These tests cover the Trifid paths affected by PR #49. Run from the repository root after installing dependencies:

```bash
node --test packages/core/test/sparql-jsonld.test.js packages/iiif/test/jsonld-compatibility.test.js
```

The focused CI step runs the same command. The root `npm test` script currently does not execute package tests.

## Test design

| Area | Contract checked |
| --- | --- |
| Core JSON-LD serialization | RDF round-trip preserves named graphs, IRIs, language tags, typed zero/false, and lexical forms such as `007` |
| Blank nodes | Relationships survive serialization; generated identifiers may change |
| Empty results | Output remains valid JSON-LD representing no triples |
| CSV downloads | Quotes, Unicode, columns and newlines remain compatible through the shared serializer |
| IIIF conversion and framing | Manifest identity, language maps, canvas order, dimensions and annotation/body/target nesting remain unchanged |
| IIIF context cache | Repeated framing calls reuse loaded contexts |
| HTTP context loading | Actual Node document loaders follow redirects and resolve relative nested contexts |
| Failed context retrieval | HTTP failures reject processing rather than returning incomplete data |

The IIIF fixture models the dataset after the existing `fixBlankNodes()` adapter: blank-node values have an `_:` prefix. This is important when comparing JSON-LD 8 with 9. The tests preserve current dimension strings and the existing `oa:painting` representation; they do not change IIIF output conventions.

The core tests compare RDF semantics rather than JSON object order or compaction choices. The framing tests check the public tree structure rather than incidental blank-node names.

## Version comparison

The same production modules and test files were exercised in isolated Node 22 installs on 2 November 2026:

| Dependency | Baseline | PR #49 candidate |
| --- | --- | --- |
| `jsonld` | 8.3.3 | 9.0.0 |
| `@rdfjs/serializer-jsonld-ext` | 4.0.1 | 4.0.2 |
| `@digitalbazaar/http-client` | 3.4.1 | 4.4.0 |
| `undici` | 5.29.0 | 6.29.1 |
| `rdf-canonize` | 3.4.0 | 5.0.0 |

Both configurations pass all eight compatibility checks. The normal test run checks the versions installed from the checkout's lockfile; it does not install an alternate version or modify dependencies. Repeat on both sides of the dependency update when validating a future migration.

## Context fixture provenance and network isolation

`support/iiif-contexts.json` freezes the official [IIIF Presentation 3 context](https://iiif.io/api/presentation/3/context.json) and its imported IIIF/W3C contexts, retrieved on 2 November 2026. Each top-level key identifies the HTTPS source URL of that document. The fixture loader maps HTTP aliases to these snapshots while preserving the requested document URL for resolution.

During framing, the test intercepts only the production document-loader construction. Unknown context URLs fail immediately. Separate transport tests use the real document loader against an ephemeral loopback HTTP server. Test execution does not contact external context sites, a SPARQL server, or a live LINDAS service.

## Migration limits

JSON-LD 9 requires Node 18 or later; CI uses Node 22. Its canonicalization dependency changes the default algorithm and complexity controls. Trifid's inspected paths do not call `canonize` or `normalize`, so these tests deliberately do not require identical default canonicalization output. Consumers needing stable historical canonicalization must specify an algorithm and assess graph-complexity limits separately. The removed `application/nquads` alias is not used by the inspected paths, which use `application/n-quads`.

This is targeted library compatibility coverage. It does not replace full application tests with production datasets, a real SPARQL server, or browser clients. The IIIF plugin is marked unmaintained in its package README.
