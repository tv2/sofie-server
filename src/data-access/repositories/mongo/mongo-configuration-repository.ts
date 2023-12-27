import { ConfigurationRepository } from '../interfaces/configuration-repository'
import { Configuration } from '../../../model/entities/configuration'
import { StudioRepository } from '../interfaces/studio-repository'
import { ShowStyleRepository } from '../interfaces/show-style-repository'
import { ShowStyle } from '../../../model/entities/show-style'
import { Studio } from '../../../model/entities/studio'

// Sofie currently only uses one hardcoded studio.
const STUDIO_ID: string = 'studio0'
// Sofie currently only uses one hardcoded showStyle.
const SHOW_STYLE_ID: string = 'show0'

export class MongoConfigurationRepository implements ConfigurationRepository {

  constructor(
    private readonly studioRepository: StudioRepository,
    private readonly showStyleRepository: ShowStyleRepository
  ) {
  }

  public clearConfigurationCache(): void {
    throw new Error('Method not applicable.')
  }

  public async getConfiguration(): Promise<Configuration> {
    const studio: Studio = await this.studioRepository.getStudio(STUDIO_ID)
    const showStyle: ShowStyle = await this.showStyleRepository.getShowStyle(SHOW_STYLE_ID)
    return {
      studio,
      showStyle
    }
  }
}
