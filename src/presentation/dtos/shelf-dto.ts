import { Shelf, ShelfActionPanel } from '../../model/entities/shelf'

export class ShelfDto {

  public readonly id: string
  public readonly actionPanels: ShelfActionPanelDto[]

  constructor(shelf: Shelf) {
    this.id = shelf.id
    this.actionPanels = shelf.actionPanels.map(actionPanel => new ShelfActionPanelDto(actionPanel))
  }
}

export class ShelfActionPanelDto {

  public readonly name: string
  public readonly rank: number
  public readonly actionSize: number
  public readonly actionFilter: unknown

  constructor(actionPanel: ShelfActionPanel) {
    this.name = actionPanel.name
    this.rank = actionPanel.rank
    this.actionSize = actionPanel.actionSize
    this.actionFilter = actionPanel.actionFilter
  }
}
