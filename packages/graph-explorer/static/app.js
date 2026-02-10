/* global ReactDOM, React, GraphExplorer, graphExplorerConfig, sessionStorage */

const SparqlDialect = GraphExplorer.OWLStatsSettings
SparqlDialect.dataLabelProperty = graphExplorerConfig.dataLabelProperty
SparqlDialect.schemaLabelProperty = graphExplorerConfig.schemaLabelProperty

const STORAGE_KEY = 'graph-explorer-state'

const createDataProvider = () => {
  return new GraphExplorer.SparqlDataProvider(
    {
      endpointUrl: graphExplorerConfig.endpointUrl,
      acceptBlankNodes: graphExplorerConfig.acceptBlankNodes,
      imagePropertyUris: ['http://xmlns.com/foaf/0.1/img'],
      queryMethod: GraphExplorer.SparqlQueryMethod.GET,
    },
    SparqlDialect,
  )
}

const saveState = (model) => {
  try {
    const state = {
      endpointUrl: graphExplorerConfig.endpointUrl,
      diagram: model.exportLayout(),
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    // Ignore serialization errors
  }
}

const loadSavedState = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const state = JSON.parse(raw)
    sessionStorage.removeItem(STORAGE_KEY)
    if (state.endpointUrl === graphExplorerConfig.endpointUrl && state.diagram) {
      return state.diagram
    }
  } catch (e) {
    sessionStorage.removeItem(STORAGE_KEY)
  }
  return null
}

const onWorkspaceMounted = async (workspace) => {
  if (!workspace) {
    return
  }

  const model = workspace.getModel()
  const dataProvider = createDataProvider()
  const savedDiagram = loadSavedState()

  if (savedDiagram) {
    await model.importLayout({
      dataProvider,
      diagram: savedDiagram,
    })
    window.addEventListener('beforeunload', () => saveState(model))
    return
  }

  model.importLayout({
    dataProvider,
  })

  /**
   * get the '?resources' search param and load those resources
   */
  const url = new URL(window.location.href)
  const resources = url.searchParams.get('resources')

  if (resources) {
    const elm = await model.dataProvider.elementInfo({
      elementIds: resources.split(';'),
    })

    const elmIds = []
    resources.split(';').forEach((item) => {
      const node = model.createElement(elm[item])
      elmIds[item] = node.id
      workspace.forceLayout()
    })

    /* now that we have the resources, add the links */
    const lnk = await model.dataProvider.linksInfo({
      elementIds: resources.split(';'),
    })

    lnk.forEach((link) => {
      const newLink = new GraphExplorer.Link({
        typeId: link.linkTypeId,
        sourceId: elmIds[link.sourceId],
        targetId: elmIds[link.targetId],
      })
      model.addLink(newLink)
      workspace.forceLayout()
    })
  }

  window.addEventListener('beforeunload', () => saveState(model))
}

const props = {
  ref: onWorkspaceMounted,
  languages: graphExplorerConfig.languages,
  language: graphExplorerConfig.language,
}

ReactDOM.render(
  React.createElement(GraphExplorer.Workspace, props),
  document.getElementById('trifid-plugin-graph-explorer'),
)
