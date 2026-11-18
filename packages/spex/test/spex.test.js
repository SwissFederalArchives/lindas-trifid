// @ts-check

import { strictEqual } from 'node:assert'
import { describe, it, beforeEach, afterEach } from 'node:test'

import trifidCore from '@lindas/trifid-core'

import trifidPluginFactory from '../index.js'

/**
 * Get an endpoint of the Fastify Instance.
 *
 * @param {import('fastify').FastifyInstance} server Server.
 * @returns {string}
 */
const getListenerURL = (server) => {
  const addresses = server.addresses().map((address) => {
    if (typeof address === 'string') {
      return address
    }
    return `http://${address.address}:${address.port}`
  })

  if (addresses.length < 1) {
    throw new Error('The listener is not listening')
  }

  return addresses[0]
}

describe('lindas-trifid-plugin-spex', () => {
  let trifidListener

  beforeEach(async () => {
    const trifidServer = await trifidCore(
      {
        server: {
          listener: {
            port: 0,
          },
          logLevel: 'warn',
        },
      },
      {
        spex: {
          module: trifidPluginFactory,
          config: {
            endpointUrl: '/test',
          },
        },
      },
    )
    trifidListener = await trifidServer.start()
  })

  afterEach(async () => {
    await trifidListener.close()
  })

  it('can serve SPEX', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex/`)
    await res.text() // Just make sure that the stream is consumed
    strictEqual(res.status, 200)
    strictEqual(res.redirected, false) // Should not redirect on this case
  })

  it('should redirect if trailing slash is missing', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex`)
    await res.text() // Just make sure that the stream is consumed
    strictEqual(res.status, 200) // The redirection should lead to a correct page
    strictEqual(res.redirected, true) // Check the redirection
  })

  it('should serve the static JavaScript file', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex/static/spex.umd.cjs`)
    await res.text() // Just make sure that the stream is consumed
    strictEqual(res.status, 200)
    strictEqual(res.headers.get('content-type').split(';')[0], 'text/javascript')
  })

  it('serves the JavaScript MIME type for HEAD requests and cache-busting URLs', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex/static/spex.umd.cjs?v=1`, { method: 'HEAD' })
    strictEqual(res.status, 200)
    strictEqual(res.headers.get('content-type').split(';')[0], 'text/javascript')
  })

  it('preserves conditional and range requests for the browser bundle', async () => {
    const url = `${getListenerURL(trifidListener)}/spex/static/spex.umd.cjs`
    const res = await fetch(url)
    const body = await res.text()
    const cached = await trifidListener.inject({
      url: '/spex/static/spex.umd.cjs',
      headers: { 'if-none-match': res.headers.get('etag') },
    })
    strictEqual(cached.statusCode, 304)
    const partial = await trifidListener.inject({
      url: '/spex/static/spex.umd.cjs',
      headers: { range: 'bytes=0-9' },
    })
    strictEqual(partial.statusCode, 206)
    strictEqual(partial.headers['content-type'].split(';')[0], 'text/javascript')
    strictEqual(partial.body, body.slice(0, 10))
  })

  it('should serve the static CSS file', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex/static/spex.css`)
    await res.text() // Just make sure that the stream is consumed
    strictEqual(res.status, 200)
    strictEqual(res.headers.get('content-type').split(';')[0], 'text/css')
  })
})
