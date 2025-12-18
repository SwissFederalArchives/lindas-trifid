# nodeCompatibleFetch Utility

## Overview

The `nodeCompatibleFetch` utility provides a native Node.js fetch wrapper that maintains compatibility with `sparql-http-client` while properly supporting brotli compression.

## Problem Statement

### The Issue

The CKAN plugin was experiencing "Decompression failed" errors (resulting in 502 Bad Gateway) when the SPARQL proxy returned brotli-compressed responses.

### Root Cause Analysis

The dependency chain causing the issue:

```
@lindas/trifid-plugin-ckan
  -> sparql-http-client v3.0.1
       -> nodeify-fetch v3.1.0
            -> node-fetch v3.2.10  <-- THE PROBLEM
```

**node-fetch v3.x behavior:**
- Sends `Accept-Encoding: gzip, deflate, br` header by default (advertising brotli support)
- Has known bugs in brotli decompression, especially with streaming responses
- When the server responds with `Content-Encoding: br`, decompression fails

**sparql-http-client behavior:**
- Uses `response.body` as a Node.js Readable stream
- Calls `.pipe()` on the response body for parsing
- Expects Node.js stream interface, not Web ReadableStream

## Solution

### Why Not Just Disable Brotli?

One option was to add `Accept-Encoding: gzip, deflate` (excluding brotli) or `Accept-Encoding: identity` (no compression). However:

1. `identity` disables ALL compression including gzip, reducing performance
2. The colleague specifically needed brotli support to work
3. Disabling brotli is a workaround, not a fix

### The Native Fetch Approach

Node.js 18+ includes native `fetch` that:
- Properly handles brotli, gzip, and deflate decompression
- Is built into Node.js (no external dependencies)
- Is well-tested and maintained

**The challenge:** Native fetch returns Web ReadableStream, but `sparql-http-client` expects Node.js Readable streams (for `.pipe()` support).

### The Wrapper Solution

The `nodeCompatibleFetch` utility:
1. Uses native `fetch` for the HTTP request (proper brotli handling)
2. Converts the response body from Web ReadableStream to Node.js Readable stream
3. Maintains the same interface expected by `sparql-http-client`

```javascript
import { Readable } from 'node:stream'

export async function nodeCompatibleFetch(url, options) {
  const response = await fetch(url, options)
  let nodeBody = null

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    get body() {
      // Lazily convert Web ReadableStream to Node.js Readable
      if (nodeBody === null && response.body) {
        nodeBody = Readable.fromWeb(response.body)
      }
      return nodeBody
    },
    json: () => response.json(),
    text: () => response.text(),
    arrayBuffer: () => response.arrayBuffer(),
  }
}
```

## Usage

### In CKAN Plugin

```javascript
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import { nodeCompatibleFetch } from '@lindas/trifid-core'

const client = new ParsingClient({
  endpointUrl: config.endpointUrl,
  user: config.user,
  password: config.password,
  fetch: nodeCompatibleFetch,
})
```

### In Other Components

Any component using `sparql-http-client` can use this utility to fix brotli decompression issues:

```javascript
import { nodeCompatibleFetch } from '@lindas/trifid-core'
import StreamClient from 'sparql-http-client'

const client = new StreamClient({
  endpointUrl: 'https://lindas.admin.ch/query',
  fetch: nodeCompatibleFetch,
})
```

## Technical Details

### Stream Conversion

The key function is `Readable.fromWeb()` (available since Node.js 17):
- Takes a Web ReadableStream as input
- Returns a Node.js Readable stream
- Handles backpressure correctly
- Preserves streaming semantics

### Lazy Conversion

The body is converted lazily (on first access) because:
- `sparql-http-client` may use `.json()` for ASK queries (no stream needed)
- Converting unnecessarily wastes resources
- The response body can only be consumed once

### Error Handling

The wrapper tracks whether the body has been consumed to prevent double-consumption errors:
- If `.body` is accessed, the stream is consumed
- If `.json()` or `.text()` is called after, an error is thrown

## Requirements

- Node.js 18+ (for native fetch and `Readable.fromWeb()`)
- This is already a requirement for Trifid v5+

## Files Changed

- `packages/core/lib/fetch.js` - New utility file
- `packages/core/index.js` - Export the utility
- `packages/core/package.json` - Version bump to 6.1.0
- `packages/ckan/src/ckan.js` - Use the new utility
- `packages/ckan/package.json` - Version bump to 5.0.3, add trifid-core dependency

## Related Issues

- node-fetch brotli issues: https://github.com/node-fetch/node-fetch/issues
- sparql-http-client expects Node streams: By design for Node.js compatibility

## Future Considerations

If `sparql-http-client` is updated to support Web streams natively (or to use native fetch), this wrapper may become unnecessary. Until then, this provides a clean solution that:
- Fixes the immediate problem
- Is backwards compatible
- Is reusable across all Trifid components
- Requires no changes to `sparql-http-client` itself
