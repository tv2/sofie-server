export interface ShelfConfiguration {
  id: string
  actionPanelConfigurations: ShelfActionPanelConfiguration[]
}

export interface ShelfActionPanelConfiguration {
  name: string
  rank: number
  actionFilter: unknown
}
