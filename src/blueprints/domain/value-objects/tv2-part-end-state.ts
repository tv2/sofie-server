import { SisyfosPersistenceMetadata } from '../../../rundown-execution/domain/value-objects/metadata'

// These values are taken from "PartEndStateExt" in Blueprints
export interface Tv2PartEndState {
  sisyfosPersistenceMetadata: SisyfosPersistenceMetadata
  isJingle?: boolean
  fullFileName?: string
  serverPosition?: Tv2ServerPosition
}

export interface Tv2ServerPosition {
  fileName: string
  lastEnd: number
  isPlaying: boolean
  endedWithPartInstance?: string
}
