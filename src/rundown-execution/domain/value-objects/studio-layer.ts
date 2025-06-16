import { LookaheadMode } from '../enums/lookahead-mode'

export interface StudioLayer {
  name: string
  lookaheadMode: LookaheadMode
  amountOfLookaheadObjectsToFind: number
  maximumLookaheadSearchDistance: number
}
