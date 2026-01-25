import { ns } from '@lindas/rdf-entity-webcomponent/src/namespaces.js'
// eslint-disable-next-line import/no-unresolved
import PQueue from 'p-queue'
import rdf from '@lindas/env'
import { parsers } from '@rdfjs/formats-common'

/**
 * labelNamespace: If specified, only fetches labels for iris starting with this
 * chunkSize: The number of labels to be fetched by each query
 * concurrency: Number of concurrent queries'
 * timeout: The timeout. Will return the successful chunks
 */

class LabelLoader {
  constructor(options) {
    const {
      query,
      replaceIri,
      rewriteResponse,
      labelNamespace,
      labelNamespaces,
      chunkSize,
      concurrency,
      timeout,
      logger,
      headers,
    } = options

    this.query = query
    this.replaceIri = replaceIri
    this.rewriteResponse = rewriteResponse

    this.headers = headers

    this.labelNamespaces = labelNamespace ? [labelNamespace] : labelNamespaces
    this.chunkSize = chunkSize || 30
    this.queue = new PQueue({
      concurrency: concurrency || 2,
      timeout: timeout || 1000,
    })
    this.logger = logger
  }

  labelFilter (pointer, term) {
    const inNamespaces = (term) => {
      if (!this.labelNamespaces || this.labelNamespaces.length === 0) {
        return true
      }
      for (const current of this.labelNamespaces) {
        if (term.value.startsWith(current)) {
          return true
        }
      }
      return false
    }

    if (term.termType === 'NamedNode') {
      if (inNamespaces(term)) {
        const terms = pointer.node(term).out(ns.schema.name).terms
        return terms.length === 0
      }
    }
    return false
  }

  getTermsWithoutLabel (pointer) {
    const result = rdf.termSet()
    pointer.dataset.map((quad) => {
      if (this.labelFilter(pointer, quad.subject)) {
        result.add(quad.subject)
      }
      if (this.labelFilter(pointer, quad.predicate)) {
        result.add(quad.predicate)
      }
      if (this.labelFilter(pointer, quad.object)) {
        result.add(quad.object)
      }
      return quad
    })
    return result
  }

  async fetchLabels (iris) {
    // Use original IRIs without rewriting - labels exist at original subdomain IRIs
    const uris = iris.map((x) => `<${x.value}> `).join(' ')
    this.logger?.debug(`Fetching labels for terms without label: ${uris}`)
    const response = await this.query(`
PREFIX schema: <http://schema.org/>

CONSTRUCT {
  ?uri schema:name ?label .
} WHERE {
  GRAPH ?g {
    ?uri schema:name ?label
    VALUES ?uri { ${uris} }
  }
}`, { ask: false, rewriteResponse: this.rewriteResponse, headers: this.headers })
    // Make sure the Content-Type is lower case and without parameters (e.g. charset)
    const fixedContentType = response.contentType.split(';')[0].trim().toLocaleLowerCase()
    const quadStream = parsers.import(fixedContentType, response.response)
    const dataset = await rdf.dataset().import(quadStream)
    return dataset
  }

  async tryFetchAll (pointer) {
    const terms = [...this.getTermsWithoutLabel(pointer)]
    this.logger?.debug(`LabelLoader: found ${terms.length} terms without labels`)
    const tasks = []
    while (terms.length) {
      const chunk = terms.splice(0, this.chunkSize)
      if (chunk.length) {
        tasks.push(this.queue.add(() => this.fetchLabels(chunk).catch(err => {
          this.logger?.warn(`LabelLoader: failed to fetch labels for chunk: ${err.message}`)
          return rdf.dataset() // Return empty dataset on error
        })))
      }
    }
    const results = await Promise.all(tasks)
    const totalQuads = results.reduce((sum, ds) => sum + ds.size, 0)
    this.logger?.debug(`LabelLoader: loaded ${totalQuads} label quads from ${results.length} chunks`)
    return results
  }
}

export { LabelLoader }
