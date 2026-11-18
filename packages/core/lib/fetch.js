// @ts-check

import { Readable } from 'node:stream'

/**
 * @typedef {Response & { body: import('node:stream').Readable | null }} NodeCompatibleResponse
 */

/**
 * Native fetch wrapper that returns a Response with Node.js Readable stream body.
 *
 * This solves the brotli decompression issue in sparql-http-client:
 * - sparql-http-client uses nodeify-fetch -> node-fetch v3.x
 * - node-fetch advertises brotli support but has decompression bugs
 * - Native Node.js fetch (18+) properly handles brotli/gzip/deflate
 *
 * The wrapper uses a Proxy to maintain full Response interface compatibility
 * while converting only the body from Web ReadableStream to Node.js Readable.
 * This is necessary because sparql-http-client calls response.body.pipe()
 * which requires Node.js streams.
 *
 * @param {string | URL | Request} url - The URL to fetch
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<Response>} Response with Node.js Readable body
 *
 * @example
 * import { nodeCompatibleFetch } from '@lindas/trifid-core'
 * import ParsingClient from 'sparql-http-client/ParsingClient.js'
 *
 * const client = new ParsingClient({
 *   endpointUrl: 'https://example.org/sparql',
 *   fetch: nodeCompatibleFetch,
 * })
 */
export async function nodeCompatibleFetch(url, options) {
  const response = await fetch(url, options)

  // Cache for the converted Node.js stream (lazy conversion)
  let nodeBody = null

  // Use Proxy to wrap Response and override only the body getter
  // This maintains full Response interface compatibility
  return new Proxy(response, {
    get(target, prop, receiver) {
      // Override body to return Node.js Readable instead of Web ReadableStream
      if (prop === 'body') {
        if (nodeBody === null && target.body !== null) {
          // Convert Web ReadableStream to Node.js Readable
          // Readable.fromWeb() is available since Node.js 17
          nodeBody = Readable.fromWeb(
            /** @type {import('node:stream/web').ReadableStream} */ (target.body),
          )
        }
        return nodeBody
      }

      // For all other properties, return the original value
      const value = Reflect.get(target, prop, receiver)

      // Bind methods to the original response to preserve correct `this` context
      if (typeof value === 'function') {
        return value.bind(target)
      }

      return value
    },
  })
}
