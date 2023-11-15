import { Tv2DownstreamKeyer } from '../../value-objects/tv2-studio-blueprint-configuration'
import { TimelineEnable } from '../../../../model/entities/timeline-enable'
import {
  SplitScreenBoxProperties,
  SplitScreenLayoutProperties
} from '../../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-metadata'
import { Piece } from '../../../../model/entities/piece'
import { Tv2VideoMixerLayer } from '../../value-objects/tv2-layers'
import { VideoMixerTransition, VideoMixerTransitionSettings } from '../../value-objects/tv2-video-mixer-transition'

export interface Tv2VideoMixerTimelineObjectFactory {
  createProgramTimelineObject(sourceInput: number, enable: TimelineEnable, transition?: {type: VideoMixerTransition, settings: VideoMixerTransitionSettings}): Tv2BlueprintTimelineObject
  createCleanFeedTimelineObject(sourceInput: number, enable: TimelineEnable, transition?: {type: VideoMixerTransition, settings: VideoMixerTransitionSettings}): Tv2BlueprintTimelineObject
  createLookaheadTimelineObject( sourceInput: number, enable: TimelineEnable): Tv2BlueprintTimelineObject
  createAuxTimelineObject(sourceInput: number, layer: Tv2VideoMixerLayer): Tv2BlueprintTimelineObject
  createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): Tv2BlueprintTimelineObject
  createUpstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, enable: TimelineEnable): Tv2BlueprintTimelineObject
  createSplitScreenBoxesTimelineObject(boxes: SplitScreenBoxProperties[], priority?: number): Tv2BlueprintTimelineObject
  createSplitScreenPropertiesTimelineObject(configuration: Tv2BlueprintConfiguration, layoutProperties: SplitScreenLayoutProperties): Tv2BlueprintTimelineObject
  createCutTransitionEffectTimelineObject(sourceInput: number): Tv2BlueprintTimelineObject
  createMixTransitionEffectTimelineObject(sourceInput: number, durationInFrames: number): Tv2BlueprintTimelineObject
  createDipTransitionEffectTimelineObject(sourceInput: number, durationInFrames: number, dipInput: number): Tv2BlueprintTimelineObject
  getSplitScreenBoxesLayer(): string
  getSplitScreenSourceInput(): number
  findProgramSourceInputFromPiece(piece: Piece): number | undefined
}
