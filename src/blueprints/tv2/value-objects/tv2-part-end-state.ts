import { Tv2SisyfosPersistenceMetaData } from './tv2-meta-data'

// These values are taken from "PartEndStateExt" in Blueprints
export interface Tv2PartEndState {
  sisyfosPersistenceMetaData: Tv2SisyfosPersistenceMetaData
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
