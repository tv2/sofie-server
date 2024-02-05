export interface Shelf {
  id: string
  actionPanels: ShelfActionPanel[]
}

export interface ShelfActionPanel {
  name: string
  rank: number
  actionSize: number
  actionFilter: unknown
}
