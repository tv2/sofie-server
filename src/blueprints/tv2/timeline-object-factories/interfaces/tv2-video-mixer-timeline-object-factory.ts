import { Tv2DownstreamKeyer } from '../../value-objects/tv2-studio-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'
import { TimelineEnable } from '../../../../model/entities/timeline-enable'
import { DveBoxProperties, DveLayoutProperties } from '../../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-metadata'
import { Piece } from '../../../../model/entities/piece'

export interface Tv2VideoMixerTimelineObjectFactory {
  createProgramTimelineObject(id: string, sourceInput: number, enable: TimelineEnable, transition?: number, transitionSettings?: unknown): TimelineObject
  createCleanFeedTimelineObject(id: string, sourceInput: number, enable: TimelineEnable, transition?: number, transitionSettings?: unknown): TimelineObject
  createLookaheadTimelineObject(id: string, sourceInput: number, enable: TimelineEnable): TimelineObject

  createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): TimelineObject
  createUpstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, enable: TimelineEnable): TimelineObject
  createDveBoxesTimelineObject(boxes: DveBoxProperties[], priority?: number): Tv2BlueprintTimelineObject
  createDvePropertiesTimelineObject(configuration: Tv2BlueprintConfiguration, layoutProperties: DveLayoutProperties): TimelineObject
  createCutTransitionEffectTimelineObject(sourceInput: number): TimelineObject
  createMixTransitionEffectTimelineObject(sourceInput: number, durationInFrames: number): TimelineObject
  createDipTransitionEffectTimelineObject(sourceInput: number, durationInFrames: number, dipInput: number): TimelineObject
  getDveBoxesLayer(): string
  getDveSourceInput(): number
  findProgramSourceInputFromPiece(piece: Piece): number | undefined
}
