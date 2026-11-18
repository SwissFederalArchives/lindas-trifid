// @ts-check

import { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { runInNewContext } from 'node:vm'

import trifidCore from '@lindas/trifid-core'

import trifidPluginFactory from '../index.js'

// Run the returned inline scripts with a minimal DOM and capture the options
// passed to SPEX. No external scripts are loaded and no HTTP listener is opened.
/**
 * @param {string} html Rendered SPEX page.
 * @param {string} pageUrl Browser page URL.
 */
const readBrowserOptions = (html, pageUrl = 'https://example.test/spex/') => {
  let options
  const element = {
    appendChild() {},
    attachShadow() { return this },
    querySelector() { return this },
    style: { setProperty() {} },
  }
  const context = {
    document: {
      createElement: () => ({ ...element }),
      getElementById: () => element,
    },
    URL,
    window: {
      location: { href: pageUrl },
      onload: () => {},
      spex: { render: (_mount, value) => { options = value } },
    },
    spexinjected: 0,
  }

  for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    runInNewContext(script[1], context, { timeout: 1000 })
  }
  runInNewContext('window.onload()', context, { timeout: 1000 })
  strictEqual(typeof options?.sparqlEndpoint, 'string', 'SPEX must receive an endpoint')
  return { options, injected: context.spexinjected }
}

/**
 * @param {import('node:test').TestContext} t Test lifecycle.
 * @param {object} config SPEX configuration.
 */
const createServer = async (t, config = {}) => {
  const { server } = await trifidCore(
    { server: { logLevel: 'warn' } },
    { spex: { module: trifidPluginFactory, config } },
  )
  t.after(() => server.close())
  return server
}

/**
 * @param {import('fastify').FastifyInstance} server Test server.
 * @param {Record<string, string>} headers Additional request headers.
 */
const getPage = (server, headers = {}) => server.inject({
  method: 'GET',
  url: '/spex/',
  headers: { host: 'example.test', ...headers },
})

describe('SPEX security regressions', () => {
  it('does not execute JavaScript supplied through X-Forwarded-Host', async (t) => {
    const server = await createServer(t)
    const response = await getPage(server, {
      // Harmless assignment, evaluated only in the isolated VM if vulnerable.
      'x-forwarded-host': "exam'+(spexinjected=1)+'ple.test",
    })
    strictEqual(response.statusCode, 200)
    const { options, injected } = readBrowserOptions(response.body)
    strictEqual(injected, 0, 'forwarded hostname executed as JavaScript')
    strictEqual(options.sparqlEndpoint, 'https://example.test/query')
  })

  it('does not retain a previous request hostname in a clean response', async (t) => {
    const server = await createServer(t)
    const first = await getPage(server, { 'x-forwarded-host': 'other.invalid' })
    strictEqual(first.statusCode, 200)

    const clean = await getPage(server)
    strictEqual(clean.statusCode, 200)
    const { options } = readBrowserOptions(clean.body)
    strictEqual(
      options.sparqlEndpoint,
      'https://example.test/query',
      'clean request inherited another request\'s endpoint',
    )
  })

  it('preserves configured endpoints and script-sensitive configuration as data', async (t) => {
    const graph = "https://example.org/quote'\\path</script><script>spexinjected=1</script>\u2028\u2029"
    const endpoint = 'https://configured.example/query'
    const server = await createServer(t, { url: endpoint, graph })

    const response = await getPage(server, { 'x-forwarded-host': 'other.invalid' })
    strictEqual(response.statusCode, 200)
    const { options, injected } = readBrowserOptions(response.body)
    strictEqual(injected, 0, 'configuration escaped the script element')
    strictEqual(options.sparqlEndpoint, endpoint)
    strictEqual(options.namedGraph, graph)
  })

  it('resolves configured relative endpoints against the browser URL', async (t) => {
    const server = await createServer(t, { url: '../query' })
    const response = await getPage(server, { 'x-forwarded-host': 'other.invalid' })
    strictEqual(response.statusCode, 200)
    const { options } = readBrowserOptions(response.body, 'https://browser.example:8443/spex/')
    strictEqual(options.sparqlEndpoint, 'https://browser.example:8443/query')
  })
})
