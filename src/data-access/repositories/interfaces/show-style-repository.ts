import { ShowStyle } from '../../../rundown-execution/domain/entities/show-style'

export interface ShowStyleRepository {
  getShowStyle(showStyleId: string): Promise<ShowStyle>
}
