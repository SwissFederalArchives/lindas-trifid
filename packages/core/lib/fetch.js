// @ts-check

import { Readable } from 'node:stream'

/**
 * Native fetch wrapper that converts Web ReadableStream responses to Node.js Readable streams.
 *
 * This is needed for compatibility with sparql-http-client which expects Node.js streams
 * in response bodies (for .pipe() and parser compatibility).
 *
 * Using native fetch instead of node-fetch solves brotli decompression issues:
 * - node-fetch v3.x advertises brotli support but has decompression bugs
 * - Native Node.js fetch (18+) properly handles brotli, gzip, and deflate
 *
 * @param {string | URL | Request} url - The URL to fetch
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<{
 *   ok: boolean,
 *   status: number,
 *   statusText: string,
 *   headers: Headers,
 *   body: import('node:stream').Readable | null,
 *   json: () => Promise<any>,
 *   text: () => Promise<string>,
 *   arrayBuffer: () => Promise<ArrayBuffer>
 * }>} Response object with Node.js Readable stream body
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

  // Track if body has been consumed for json/text/arrayBuffer methods
  let bodyConsumed = false
  let nodeBody = null

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,

    /**
     * Response body as Node.js Readable stream.
     * Lazily converts Web ReadableStream to Node.js Readable on first access.
     * @type {import('node:stream').Readable | null}
     */
    get body() {
      if (bodyConsumed) {
        throw new Error('Response body has already been consumed')
      }
      // Lazily convert Web ReadableStream to Node.js Readable on first access
      if (nodeBody === null && response.body) {
        // @ts-ignore - Readable.fromWeb exists in Node 17+ but TypeScript doesn't know
        nodeBody = Readable.fromWeb(response.body)
      }
      return nodeBody
    },

    /**
     * Parse response body as JSON.
     * @returns {Promise<any>}
     */
    async json() {
      if (bodyConsumed) {
        throw new Error('Response body has already been consumed')
      }
      bodyConsumed = true
      return response.json()
    },

    /**
     * Get response body as text.
     * @returns {Promise<string>}
     */
    async text() {
      if (bodyConsumed) {
        throw new Error('Response body has already been consumed')
      }
      bodyConsumed = true
      return response.text()
    },

    /**
     * Get response body as ArrayBuffer.
     * @returns {Promise<ArrayBuffer>}
     */
    async arrayBuffer() {
      if (bodyConsumed) {
        throw new Error('Response body has already been consumed')
      }
      bodyConsumed = true
      return response.arrayBuffer()
    },
  }
}
