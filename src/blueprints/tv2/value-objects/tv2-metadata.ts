import { TimelineObject } from '../../../model/entities/timeline-object'
import { DeviceType } from '../../../model/enums/device-type'
import { DveBoxProperties } from './tv2-show-style-blueprint-configuration'

export interface Tv2SisyfosPersistenceMetadata {
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

export interface Tv2PieceMetadata {
  sisyfosPersistMetaData?: Tv2SisyfosPersistenceMetadata // Blueprints saves it as "sisyfosPersistMetaData" so until we change Blueprints, we need to call it the same...
  dve?: {
    boxes: DveBoxProperties[],
    audioTimelineObjectsForBoxes: { [inputIndex: number]: TimelineObject[] }
  }
}

export interface Tv2BlueprintTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType
    type: unknown
  }
  metaData?: Tv2TimelineObjectMetadata
  isLookahead?: boolean
  lookaheadForLayer?: string
}

export interface Tv2TimelineObjectMetadata {
  context?: string
  mediaPlayerSession?: string
  templateData?: unknown
  fileName?: string
}
