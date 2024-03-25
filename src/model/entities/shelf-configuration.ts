export interface ShelfConfiguration {
  id: string
  actionPanelConfigurations: ShelfActionPanelConfiguration[]
}

export interface ShelfActionPanelConfiguration {
  id: string
  name: string
  rank: number
  actionFilter: unknown
}
