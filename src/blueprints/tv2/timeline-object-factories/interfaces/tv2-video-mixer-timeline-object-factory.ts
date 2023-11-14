import { Tv2DownstreamKeyer } from '../../value-objects/tv2-studio-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'
import { TimelineEnable } from '../../../../model/entities/timeline-enable'
import { SplitScreenBoxProperties, SplitScreenLayoutProperties } from '../../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-metadata'
import { Piece } from '../../../../model/entities/piece'
import { Tv2VideoMixerLayer } from '../../value-objects/tv2-layers'

export interface Tv2VideoMixerTimelineObjectFactory {
  createProgramTimelineObject(sourceInput: number, enable: TimelineEnable): TimelineObject
  createCleanFeedTimelineObject(sourceInput: number, enable: TimelineEnable): TimelineObject
  createLookaheadTimelineObject(sourceInput: number, enable: TimelineEnable): TimelineObject
  createAuxTimelineObject(sourceInput: number, layer: Tv2VideoMixerLayer): TimelineObject
  createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): TimelineObject
  createSplitScreenBoxesTimelineObject(boxes: SplitScreenBoxProperties[], priority?: number): Tv2BlueprintTimelineObject
  createSplitScreenPropertiesTimelineObject(configuration: Tv2BlueprintConfiguration, layoutProperties: SplitScreenLayoutProperties): TimelineObject
  createCutTransitionEffectTimelineObject(sourceInput: number): TimelineObject
  createMixTransitionEffectTimelineObject(sourceInput: number, durationInFrames: number): TimelineObject
  createDipTransitionEffectTimelineObject(sourceInput: number, durationInFrames: number, dipInput: number): TimelineObject
  getSplitScreenBoxesLayer(): string
  getSplitScreenSourceInput(): number
  findProgramSourceInputFromPiece(piece: Piece): number | undefined
}
