import { SplitScreenBoxProperties } from '../../blueprints/tv2/value-objects/tv2-show-style-blueprint-configuration'
import { TimelineObject } from '../entities/timeline-object'
import { AudioMode } from '../enums/audio-mode'
import { OutputLayer } from '../enums/output-layer'
import { PlayoutContent } from './playout-content'

export interface SisyfosPersistenceMetadata {
  /**
   * The layers this piece wants to persist into the next part
   */
  sisyfosLayers: string[]
  /**
   * The layers this piece gathered from previous pieces and wants to persist into the next part
   */
  previousSisyfosLayers?: string[]
  /**
   * Whether `sisyfosLayers` and `previousSisyfosLayers` may be persisted into the next part if accepted
   */
  wantsToPersistAudio?: boolean
  /**
   * Whether `sisyfosLayers` and `previousSisyfosLayers` from the previous part may be persisted
   */
  acceptsPersistedAudio?: boolean
  /**
   * Whether the piece was inserted/updated by fast Camera/Live cutting within a part or fading down persisted levels
   */
  isModifiedOrInsertedByAction?: boolean
}

export interface PieceMetadata {
  playoutContent: PlayoutContent
  outputLayer?: OutputLayer
  sisyfosPersistMetaData?: SisyfosPersistenceMetadata // Blueprints saves it as "sisyfosPersistMetaData" so until we change Blueprints, we need to call it the same...
  audioMode?: AudioMode
  splitScreen?: {
    boxes: SplitScreenBoxProperties[], // TODO: Update where 'SplitScreenBoxProperties' comes from.
    audioTimelineObjectsForBoxes: { [inputIndex: number]: TimelineObject[] } // TODO: Does this need to be Tv2BlueprintTimelineObject?
  }
  config?: {
    DVEInputs: string
    DVEName: string
  }
  mediaPlayerSessions?: string[]
  sourceName?: string
}

export interface TimelineObjectMetadata {
  context?: string
  mediaPlayerSession?: string
  templateData?: unknown
  fileName?: string
}
