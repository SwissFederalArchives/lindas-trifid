// @ts-check

import { strictEqual, deepStrictEqual, ok } from 'node:assert'
import { describe, it } from 'node:test'
import { Readable } from 'node:stream'
import rdf from '@lindas/env'
import { parsers } from '@rdfjs/formats-common'

import factory from '../index.js'

const canonical = 'https://ld.admin.ch/canton/1'
const preview = 'https://test.ld.admin.ch/canton/1'
const foreign = 'https://culture.ld.admin.ch/resource/1'
const graph = 'https://ld.admin.ch/graph/demo'
const fixture = `
<${canonical}> <http://schema.org/name> "Zurich"@en .
<${canonical}> <https://ld.admin.ch/property/related> <https://ld.admin.ch/district/112> .
<${canonical}> <http://schema.org/about> <${foreign}> .
<${canonical}> <http://schema.org/description> "https://ld.admin.ch/literal-value" .
<${canonical}> <http://schema.org/identifier> "1"^^<https://ld.admin.ch/type/custom> .
<${canonical}> <http://schema.org/additionalProperty> _:detail .
_:detail <http://schema.org/name> "Detail" .
`

const parseDataset = async (text, mime = 'application/n-triples') => {
  return rdf.dataset().import(parsers.import(mime, Readable.from([text])))
}

const replacements = (text, options) => {
  for (const { find, replace } of options.rewriteResponse || []) {
    text = text.replaceAll(find, replace)
  }
  return text
}

const createHandler = async (overrides = {}, behavior = {}) => {
  const calls = []
  const errors = []
  const query = async (sparql, options = {}) => {
    calls.push({ sparql, options })
    if (options.ask) return !behavior.missing && sparql.includes(`<${behavior.storedIri || canonical}>`)
    if (options.select) {
      if (sparql.includes('?location')) {
        return behavior.redirect
          ? [{ responseCode: { value: '302' }, location: { value: replacements(behavior.redirect, options) } }]
          : []
      }
      return [{ p: rdf.namedNode('http://schema.org/name'), o: rdf.literal('Zurich', 'en'), g: rdf.namedNode(replacements(graph, options)) }]
    }
    const text = sparql.includes('VALUES ?uri')
      ? `<${foreign}> <http://schema.org/name> "Culture resource" .`
      : behavior.fixture || fixture
    return { contentType: 'application/n-triples', response: Readable.from([replacements(text, options)]) }
  }
  const plugin = await factory({
    config: {
      rewrite: true,
      datasetBaseUrl: 'https://ld.admin.ch/',
      followRedirects: true,
      enrichWithNamedGraph: true,
      labelLoader: { timeout: 1000 },
      ...overrides
    },
    logger: { debug () {}, info () {}, warn () {}, error (error) { errors.push(error) } },
    query,
    render: async (_request, _path, data) => JSON.stringify(data)
  })
  const handler = await plugin.routeHandler()
  const request = async (accept = 'application/n-triples', changes = {}) => {
    const result = { status: 200, body: '', contentType: '', location: '' }
    const reply = {
      type (value) { result.contentType = value; return this },
      send (value) { result.body = value; return this },
      status (value) { result.status = value; return this },
      redirect (value) { result.location = value; if (result.status === 200) result.status = 302; return this },
      callNotFound () { result.status = 404; return this }
    }
    await handler({
      cookies: {},
      headers: { accept },
      hostname: 'test.ld.admin.ch',
      port: '',
      protocol: 'https',
      query: {},
      session: new Map(),
      url: '/canton/1',
      ...changes
    }, reply)
    deepStrictEqual(errors, [])
    return result
  }
  return { request, calls }
}

describe('rewriteResults', () => {
  it('preserves legacy response rewriting by default', async () => {
    const { request } = await createHandler()
    const response = await request()
    strictEqual(response.status, 200)
    ok(response.body.includes(`<${preview}>`))
    ok(response.body.includes('<https://test.ld.admin.ch/property/related>'))
  })

  for (const mime of ['application/n-triples', 'text/turtle', 'application/ld+json', 'application/rdf+xml']) {
    it(`retains exact RDF terms and preview lookup for ${mime}`, async () => {
      const { request, calls } = await createHandler({ rewriteResults: false })
      const response = await request(mime)
      strictEqual(response.status, 200)
      const actual = await parseDataset(response.body, mime)
      const expected = await parseDataset(fixture)
      strictEqual(actual.size, expected.size)
      // Compare named-node and literal terms; blank-node identifiers are serializer-local.
      for (const quad of expected) {
        if (quad.subject.termType !== 'BlankNode' && quad.object.termType !== 'BlankNode') ok(actual.has(quad))
      }
      ok([...actual].some(quad => quad.subject.termType === 'BlankNode' && quad.object.value === 'Detail'))
      ok(calls[0].sparql.includes(`<${canonical}>`))
      ok(calls.every(call => !call.options.rewriteResponse?.length))
      strictEqual(response.body.includes('https://test.ld.admin.ch/'), false)
    })
  }

  it('accepts false from an environment variable', async () => {
    const { request } = await createHandler({ rewriteResults: 'false' })
    const response = await request()
    ok(response.body.includes(`<${canonical}>`))
    strictEqual(response.body.includes(preview), false)
  })

  it('renders the canonical HTML root, JSON-LD, labels, and graph metadata', async () => {
    const { request, calls } = await createHandler({ rewriteResults: false })
    const response = await request('text/html')
    strictEqual(response.status, 200)
    const page = JSON.parse(response.body)
    strictEqual(page.entityUrl, canonical)
    strictEqual(page.entityLabel, 'Zurich')
    ok(page.dataset.includes('Culture resource'))
    ok(page.dataset.includes(`href="${foreign}"`))
    ok(page.jsonld.includes(canonical))
    ok(JSON.stringify(page.metadata).includes(graph))
    strictEqual(response.body.includes('https://test.ld.admin.ch/'), false)
    const labels = calls.filter(call => call.sparql.includes('VALUES ?uri'))
    ok(labels.some(call => call.sparql.includes(`<${foreign}>`)))
    ok(labels.every(call => !call.sparql.includes('<https://ld.admin.ch/resource/1>')))
  })

  it('preserves canonical redirect targets', async () => {
    const target = 'https://ld.admin.ch/canton/2'
    const { request } = await createHandler({ rewriteResults: false }, { redirect: target })
    const response = await request('text/html')
    strictEqual(response.status, 302)
    strictEqual(response.location, target)
  })

  it('finds schema:URL redirects on the canonical HTML root', async () => {
    const { request } = await createHandler({ rewriteResults: false, enableSchemaUrlRedirect: true }, {
      fixture: fixture + `<${canonical}> <http://schema.org/URL> "https://ld.admin.ch/canton/2"^^<http://www.w3.org/2001/XMLSchema#anyURI> .`
    })
    const response = await request('text/html')
    strictEqual(response.status, 302)
    strictEqual(response.location, 'https://ld.admin.ch/canton/2')
  })

  it('does not apply additional response replacements when disabled', async () => {
    const { request } = await createHandler({ rewriteResults: false, additionalRewrites: [{ find: 'https://culture.ld.admin.ch/', replace: 'https://invented.example/' }] })
    const response = await request()
    ok(response.body.includes(`<${foreign}>`))
    strictEqual(response.body.includes('invented.example'), false)
  })

  it('keeps exact-host lookup when rewriting is disabled', async () => {
    const { request, calls } = await createHandler({ rewrite: false, rewriteResults: false })
    const response = await request()
    strictEqual(response.status, 404)
    strictEqual(calls.length, 1)
    ok(calls[0].sparql.includes(`<${preview}>`))
  })

  it('can switch to stored TEST identifiers without changing the handler', async () => {
    const { request, calls } = await createHandler({ rewrite: false, rewriteResults: false }, {
      storedIri: preview,
      fixture: fixture.replaceAll('https://ld.admin.ch/', 'https://test.ld.admin.ch/')
    })
    const response = await request()
    strictEqual(response.status, 200)
    ok(response.body.includes(`<${preview}>`))
    ok(calls[0].sparql.includes(`<${preview}>`))
    ok(calls.every(call => !call.options.rewriteResponse?.length))
  })

  it('does not fall back to the core namespace on an energy-only host', async () => {
    const { request, calls } = await createHandler({ rewriteResults: false, datasetBaseUrl: 'https://energy.ld.admin.ch/' })
    const response = await request('application/n-triples', { hostname: 'test.energy.ld.admin.ch' })
    strictEqual(response.status, 404)
    strictEqual(calls.length, 1)
    ok(calls[0].sparql.includes('<https://energy.ld.admin.ch/canton/1>'))
  })

  it('returns 404 for a missing resource without requesting a description', async () => {
    const { request, calls } = await createHandler({ rewriteResults: false }, { missing: true })
    const response = await request()
    strictEqual(response.status, 404)
    strictEqual(calls.length, 1)
  })
})
