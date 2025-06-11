import { ShowStyle } from '../entities/show-style'

export interface ShowStyleRepository {
  getShowStyle(showStyleId: string): Promise<ShowStyle>
}
