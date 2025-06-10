import { ConfigurationRepository } from '../interfaces/configuration-repository'
import { Configuration } from '../../../rundown-execution/domain/entities/configuration'
import { StudioRepository } from '../interfaces/studio-repository'
import { ShowStyleRepository } from '../interfaces/show-style-repository'
import { ShowStyle } from '../../../rundown-execution/domain/entities/show-style'
import { Studio } from '../../../rundown-execution/domain/entities/studio'
import {UnsupportedOperationException} from '../../../rundown-execution/domain/exceptions/unsupported-operation-exception'

// Alba currently only uses one hardcoded studio.
const STUDIO_ID: string = 'studio0'
// Alba currently only uses one hardcoded showStyle.
const SHOW_STYLE_ID: string = 'show0'

export class MongoConfigurationRepository implements ConfigurationRepository {

  constructor(
    private readonly studioRepository: StudioRepository,
    private readonly showStyleRepository: ShowStyleRepository
  ) {
  }

  public clearConfigurationCache(): void {
    throw new UnsupportedOperationException('Method not applicable.')
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
