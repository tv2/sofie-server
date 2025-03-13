export interface ShelfConfiguration {
  id: string
  actionPanelConfigurations: ShelfActionPanelConfiguration[]
  staticActionIds: string[]
  shouldShowShelf: boolean
}

export interface ShelfActionPanelConfiguration {
  id: string
  name: string
  rank: number
  actionFilter: unknown
}
