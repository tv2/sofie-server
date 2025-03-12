import { ShelfConfiguration, ShelfActionPanelConfiguration } from '../../model/entities/shelf-configuration'

export class ShelfConfigurationDto {
  public readonly id: string
  public readonly actionPanelConfigurations: ShelfActionPanelConfigurationDto[]
  public readonly staticActionIds: string[]
  public readonly shouldShowShelf: boolean

  constructor(shelfConfiguration: ShelfConfiguration) {
    this.id = shelfConfiguration.id
    this.actionPanelConfigurations = shelfConfiguration.actionPanelConfigurations.map(actionPanelConfiguration => new ShelfActionPanelConfigurationDto(actionPanelConfiguration))
    this.staticActionIds = shelfConfiguration.staticActionIds
    this.shouldShowShelf = shelfConfiguration.shouldShowShelf ?? false
  }
}

export class ShelfActionPanelConfigurationDto {
  public readonly id: string
  public readonly name: string
  public readonly rank: number
  public readonly actionFilter: unknown

  constructor(shelfActionPanelConfiguration: ShelfActionPanelConfiguration) {
    this.id = shelfActionPanelConfiguration.id
    this.name = shelfActionPanelConfiguration.name
    this.rank = shelfActionPanelConfiguration.rank
    this.actionFilter = shelfActionPanelConfiguration.actionFilter
  }
}
