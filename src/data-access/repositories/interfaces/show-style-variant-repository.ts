import { ShowStyleVariant } from '../../../model/entities/show-style-variant'

export interface ShowStyleVariantRepository {
  getShowStyleVariant(rundownId: string): Promise<ShowStyleVariant>
}