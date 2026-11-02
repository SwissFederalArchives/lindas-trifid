// @ts-check

import { deepStrictEqual, strictEqual } from 'node:assert'
import { Readable } from 'node:stream'
import { describe, it } from 'node:test'

import formats from '@rdfjs-elements/formats-pretty'
import { serializeQuadStream } from '../lib/sparql.js'

const parse = (text, mimeType) => formats.parsers.import(mimeType, Readable.from([text]))

// Compare RDF terms rather than JSON formatting, property order, or compaction.
const quadKeys = async (stream) => {
  const keys = []
  for await (const quad of stream) {
    keys.push(JSON.stringify(['subject', 'predicate', 'object', 'graph'].map((position) => {
      const term = quad[position]
      return [term.termType, term.value, term.language || '', term.datatype?.value || '']
    })))
  }
  return keys.sort()
}

describe('JSON-LD serialization compatibility', () => {
  it('round-trips named graphs, IRIs, multilingual literals, and typed zero/false values', async () => {
    const source = [
      '<https://example.test/item> <https://schema.org/name> "Grüezi"@de .',
      '<https://example.test/item> <https://schema.org/name> "Hello"@en .',
      '<https://example.test/item> <https://schema.org/identifier> "007"^^<http://www.w3.org/2001/XMLSchema#int> .',
      '<https://example.test/item> <https://schema.org/position> "0"^^<http://www.w3.org/2001/XMLSchema#integer> .',
      '<https://example.test/item> <https://schema.org/isAccessibleForFree> "false"^^<http://www.w3.org/2001/XMLSchema#boolean> .',
      '<https://example.test/item> <https://schema.org/url> <https://example.test/resource?x=1&y=2> <https://example.test/graph> .',
    ].join('\n')

    const output = await serializeQuadStream(parse(source, 'application/n-quads'), 'application/ld+json')
    deepStrictEqual(
      await quadKeys(parse(output, 'application/ld+json')),
      await quadKeys(parse(source, 'application/n-quads')),
    )
  })

  it('serializes an empty RDF stream as valid, empty JSON-LD', async () => {
    const output = await serializeQuadStream(Readable.from([]), 'application/ld+json')
    deepStrictEqual(await quadKeys(parse(output, 'application/ld+json')), [])
  })

  it('preserves blank-node relationships without depending on blank-node labels', async () => {
    const source = [
      '<https://example.test/item> <https://schema.org/additionalProperty> _:metadata .',
      '_:metadata <https://schema.org/name> "Width" .',
      '_:metadata <https://schema.org/value> "0"^^<http://www.w3.org/2001/XMLSchema#integer> .',
    ].join('\n')
    const output = await serializeQuadStream(parse(source, 'application/n-quads'), 'application/ld+json')
    const quads = []
    for await (const quad of parse(output, 'application/ld+json')) quads.push(quad)
    strictEqual(quads.length, 3)
    const link = quads.find(quad => quad.subject.value === 'https://example.test/item')
    strictEqual(link.predicate.value, 'https://schema.org/additionalProperty')
    strictEqual(link.object.termType, 'BlankNode')
    const properties = quads.filter(quad => quad.subject.termType === 'BlankNode' && quad.subject.value === link.object.value)
    strictEqual(properties.length, 2)
    strictEqual(properties.find(quad => quad.predicate.value === 'https://schema.org/name').object.value, 'Width')
    const value = properties.find(quad => quad.predicate.value === 'https://schema.org/value').object
    strictEqual(value.value, '0')
    strictEqual(value.datatype.value, 'http://www.w3.org/2001/XMLSchema#integer')
  })

  it('preserves the CSV download format produced through the JSON-LD serializer', async () => {
    const source = '<https://example.test/item> <https://schema.org/name> "A \\"quoted\\", multilingual Grüezi" .'
    const output = await serializeQuadStream(parse(source, 'application/n-quads'), 'text/csv')
    strictEqual(output, '"key","value"\n"@id","https://example.test/item"\n"https://schema.org/name","A ""quoted"", multilingual Grüezi"\n')
  })
})
