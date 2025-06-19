import { Tv2DownstreamKeyer } from '../../value-objects/tv2-studio-blueprint-configuration'
import { TimelineEnable } from '../../../../rundown-execution/domain/entities/timeline-enable'
import {
  SplitScreenBoxProperties,
  SplitScreenLayoutProperties
} from '../../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2BlueprintTimelineObject, } from '../../value-objects/tv2-blueprint-timeline-object'
import { Piece } from '../../../../rundown-execution/domain/entities/piece'
import { Tv2VideoMixerLayer } from '../../value-objects/tv2-layers'
import { TimelineObjectMetadata } from '../../../../rundown-execution/domain/value-objects/metadata'

export interface Tv2VideoMixerTimelineObjectFactory {
  createProgramTimelineObject(sourceInput: number, enable: TimelineEnable, metadata?: TimelineObjectMetadata): Tv2BlueprintTimelineObject
  createCleanFeedTimelineObject(sourceInput: number, enable: TimelineEnable, metadata?: TimelineObjectMetadata): Tv2BlueprintTimelineObject
  createProgramTimelineObjectWithWipeTransition(sourceInput: number, enable: TimelineEnable, transitionSettings: VideoMixerWipeTransitionSettings): Tv2BlueprintTimelineObject
  createCleanFeedTimelineObjectWithWipeTransition(sourceInput: number, enable: TimelineEnable, transitionSettings: VideoMixerWipeTransitionSettings): Tv2BlueprintTimelineObject
  createLookaheadTimelineObject(sourceInput: number, enable: TimelineEnable): Tv2BlueprintTimelineObject
  createAuxTimelineObject(sourceInput: number, layer: Tv2VideoMixerLayer): Tv2BlueprintTimelineObject
  createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): Tv2BlueprintTimelineObject
  createUpstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, enable: TimelineEnable): Tv2BlueprintTimelineObject
  createSplitScreenBoxesTimelineObject(boxes: SplitScreenBoxProperties[], priority?: number): Tv2BlueprintTimelineObject
  createSplitScreenPropertiesTimelineObject(configuration: Tv2BlueprintConfiguration, layoutProperties: SplitScreenLayoutProperties): Tv2BlueprintTimelineObject
  createCutTransitionEffectTimelineObjects(sourceInput: number, metadata?: TimelineObjectMetadata): Tv2BlueprintTimelineObject[]
  createMixTransitionEffectTimelineObjects(sourceInput: number, durationInFrames: number, metadata?: TimelineObjectMetadata): Tv2BlueprintTimelineObject[]
  createDipTransitionEffectTimelineObjects(sourceInput: number, durationInFrames: number, dipInput: number, metadata?: TimelineObjectMetadata): Tv2BlueprintTimelineObject[]
  getProgramLayer(): string
  getSplitScreenBoxesLayer(): string
  getSplitScreenSourceInput(): number
  findProgramSourceInputFromPiece(piece: Piece): number | undefined
}

export interface VideoMixerWipeTransitionSettings {
  durationInFrames: number
  borderSoftness: number
}
