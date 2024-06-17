import { ShowStyleVariant } from '../../../model/entities/show-style-variant'

export interface ShowStyleVariantRepository {
  getShowStyleVariantsForShowStyle(showStyleId: string): Promise<ShowStyleVariant[]>
  getShowStyleVariant(rundownId: string): Promise<ShowStyleVariant>
}
