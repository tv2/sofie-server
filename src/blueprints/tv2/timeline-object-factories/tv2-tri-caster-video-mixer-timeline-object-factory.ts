import {
  Tv2VideoMixerTimelineObjectFactory,
  VideoMixerWipeTransitionSettings
} from './interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2TriCasterLayer, Tv2VideoMixerLayer } from '../value-objects/tv2-layers'
import { Tv2BlueprintTimelineObject } from '../value-objects/tv2-metadata'
import { Tv2DownstreamKeyer } from '../value-objects/tv2-studio-blueprint-configuration'
import {
  SplitScreenBoxProperties,
  SplitScreenLayoutProperties
} from '../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Piece } from '../../../model/entities/piece'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import {
  TriCasterLayer,
  TriCasterLayerName,
  TriCasterMixEffectContentType,
  TriCasterMixEffectName,
  TriCasterMixEffectProgramContent,
  TriCasterMixEffectTimelineObject,
  TriCasterMixOutputTimelineObject,
  TriCasterSourceIndex,
  TriCasterSourceName,
  TriCasterTransition,
  TriCasterType
} from '../../timeline-state-resolver-types/tri-caster-type'
import { DeviceType } from '../../../model/enums/device-type'
import { AtemSourceIndex } from '../../timeline-state-resolver-types/atem-types'
import { AtemToTriCasterSplitScreenConverter } from '../helpers/atem-to-tricaster-split-screen-converter'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Tv2Logger } from '../tv2-logger'

const TRI_CASTER_PREFIX: string = 'triCaster_'

export class Tv2TriCasterVideoMixerTimelineObjectFactory implements Tv2VideoMixerTimelineObjectFactory {

  private readonly logger: Tv2Logger

  constructor(private readonly atemToTriCasterSplitScreenConverter: AtemToTriCasterSplitScreenConverter, logger: Tv2Logger) {
    this.logger = logger.tag(Tv2TriCasterVideoMixerTimelineObjectFactory.name)
  }

  public createProgramTimelineObject(sourceInput: number, enable: TimelineEnable): TriCasterMixEffectTimelineObject {
    return this.createTriCasterMeTimelineObjectForLayer(
      `${TRI_CASTER_PREFIX}program`,
      Tv2TriCasterLayer.PROGRAM,
      enable,
      {
        type: TriCasterMixEffectContentType.PROGRAM,
        programInput: this.mapInputToTriCasterInput(sourceInput),
        transitionEffect: TriCasterTransition.CUT
      })
  }

  private createTriCasterMeTimelineObjectForLayer(id: string, layer: Tv2TriCasterLayer, enable: TimelineEnable, me: TriCasterMixEffectProgramContent): TriCasterMixEffectTimelineObject {
    return {
      id,
      enable,
      priority: 1,
      layer,
      content: {
        deviceType: DeviceType.TRICASTER,
        type: TriCasterType.ME,
        me
      }
    }
  }

  /**
   * We are using Atems input source values, which are numbers, throughout our blueprints.
   * These values do not match what TriCaster is using, so we need to map it to the TriCaster value
   */
  private mapInputToTriCasterInput(input: number): TriCasterSourceName | TriCasterMixEffectName {
    const maxRegularInput: number = 1000 // Everything >= is assumed to be a "special" input. See switch below
    if (input < maxRegularInput) {
      return `input${input}`
    }
    switch (input) {
      case AtemSourceIndex.BLACK: {
        return TriCasterSourceIndex.BLACK
      }
      case AtemSourceIndex.ME1_PROGRAM: {
        return TriCasterSourceIndex.V1
      }
      case AtemSourceIndex.ME2_PROGRAM: {
        return TriCasterSourceIndex.V2
      }
      case AtemSourceIndex.ME3_PROGRAM: {
        return TriCasterSourceIndex.V2
      }
      case AtemSourceIndex.ME4_PROGRAM: {
        return TriCasterSourceIndex.V4
      }
      case AtemSourceIndex.SUPER_SOURCE: {
        return TriCasterSourceIndex.V2
      }
      case AtemSourceIndex.COLOR_GENERATOR1: {
        return TriCasterSourceIndex.BFR1
      }
      case AtemSourceIndex.COLOR_GENERATOR2: {
        return TriCasterSourceIndex.BFR2
      }
      default: {
        return TriCasterSourceIndex.BLACK
      }
    }
  }

  public createCleanFeedTimelineObject(sourceInput: number, enable: TimelineEnable): TriCasterMixEffectTimelineObject {
    return this.createTriCasterMeTimelineObjectForLayer(
      `${TRI_CASTER_PREFIX}clean_feed`,
      Tv2TriCasterLayer.CLEAN_FEED,
      enable,
      {
        type: TriCasterMixEffectContentType.PROGRAM,
        programInput: this.mapInputToTriCasterInput(sourceInput),
        transitionEffect: TriCasterTransition.CUT
      }
    )
  }

  public createProgramTimelineObjectWithWipeTransition(sourceInput: number, enable: TimelineEnable, transitionSettings: VideoMixerWipeTransitionSettings): Tv2BlueprintTimelineObject {
    return this.createTriCasterMeTimelineObjectForLayer(
      `${TRI_CASTER_PREFIX}program`,
      Tv2TriCasterLayer.PROGRAM,
      enable,
      {
        type: TriCasterMixEffectContentType.PROGRAM,
        programInput: this.mapInputToTriCasterInput(sourceInput),
        transitionEffect: TriCasterTransition.WIPE_FOR_GFX,
        transitionDuration: this.convertFramesToSeconds(transitionSettings.durationInFrames)
      })
  }

  private convertFramesToSeconds(frames: number): number {
    const frameRate: number = 25
    const durationInMilliseconds: number = (1000 / frameRate) * frames
    return durationInMilliseconds / 1000
  }

  public createCleanFeedTimelineObjectWithWipeTransition(sourceInput: number, enable: TimelineEnable, transitionSettings: VideoMixerWipeTransitionSettings): Tv2BlueprintTimelineObject {
    return this.createTriCasterMeTimelineObjectForLayer(
      `${TRI_CASTER_PREFIX}clean_feed`,
      Tv2TriCasterLayer.CLEAN_FEED,
      enable,
      {
        type: TriCasterMixEffectContentType.PROGRAM,
        programInput: this.mapInputToTriCasterInput(sourceInput),
        transitionEffect: TriCasterTransition.WIPE_FOR_GFX,
        transitionDuration: this.convertFramesToSeconds(transitionSettings.durationInFrames)
      }
    )
  }

  public createLookaheadTimelineObject(sourceInput: number, enable: TimelineEnable): TriCasterMixOutputTimelineObject {
    return {
      id: `${TRI_CASTER_PREFIX}lookahead`,
      enable,
      priority: 0,
      layer: Tv2TriCasterLayer.LOOKAHEAD,
      content: {
        deviceType: DeviceType.TRICASTER,
        type: TriCasterType.MIX_OUTPUT,
        source: this.mapInputToTriCasterInput(sourceInput)
      }
    }
  }

  public createAuxTimelineObject(sourceInput: number, layer: Tv2VideoMixerLayer): TriCasterMixOutputTimelineObject {
    return {
      id: `${TRI_CASTER_PREFIX}${layer}_input_${sourceInput}_timelineObject`,
      enable: {
        start: 0
      },
      layer: `${TRI_CASTER_PREFIX}${layer}`,
      priority: 1,
      content: {
        deviceType: DeviceType.TRICASTER,
        type: TriCasterType.MIX_OUTPUT,
        source: this.mapInputToTriCasterInput(sourceInput)
      }
    }
  }

  public createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): TriCasterMixEffectTimelineObject {
    const downstreamKeyerNumber: number = downstreamKeyer.index + 1
    return {
      id: `${TRI_CASTER_PREFIX}downstreamKeyer${downstreamKeyerNumber}`,
      enable: {
        start: 0
      },
      priority: 0,
      layer: `${Tv2TriCasterLayer.DOWNSTREAM_KEYER}_${downstreamKeyerNumber}`,
      content: {
        deviceType: DeviceType.TRICASTER,
        type: TriCasterType.ME,
        me: {
          type: TriCasterMixEffectContentType.DOWNSTREAM_KEYER,
          keyers: {
            [`dsk${downstreamKeyerNumber}`]: {
              input: this.mapInputToTriCasterInput(downstreamKeyer.videoMixerFillSource),
              onAir
            }
          }
        }
      }
    }
  }

  public createUpstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, enable: TimelineEnable): TriCasterMixEffectTimelineObject {
    const downstreamKeyerNumber: number = downstreamKeyer.index + 1
    return {
      id: `${TRI_CASTER_PREFIX}upstreamKeyer${downstreamKeyer}`,
      enable,
      priority: 1,
      layer: Tv2TriCasterLayer.CLEAN_UPSTREAM_KEYER,
      content: {
        deviceType: DeviceType.TRICASTER,
        type: TriCasterType.ME,
        me: {
          type: TriCasterMixEffectContentType.DOWNSTREAM_KEYER,
          keyers: {
            [`dsk${downstreamKeyerNumber}`]: {
              input: this.mapInputToTriCasterInput(downstreamKeyer.videoMixerFillSource),
              onAir: true
            }
          }
        }
      }
    }
  }

  public createSplitScreenBoxesTimelineObject(boxes: SplitScreenBoxProperties[], priority?: number): TriCasterMixEffectTimelineObject {
    return {
      id: `${TRI_CASTER_PREFIX}split_screen_boxes`,
      enable: {
        start: 0
      },
      priority,
      layer: Tv2TriCasterLayer.SPLIT_SCREEN_BOXES,
      content: {
        deviceType: DeviceType.TRICASTER,
        type: TriCasterType.ME,
        me: {
          type: TriCasterMixEffectContentType.EFFECT_MODE,
          layers: this.createSplitScreenLayers(boxes),
          transitionEffect: TriCasterTransition.SPLIT_SCREEN,
        },
        temporalPriority: 1
      }
    }
  }

  private createSplitScreenLayers(boxes: SplitScreenBoxProperties[]): Partial<Record<TriCasterLayerName, TriCasterLayer>> {
    return {
      a: boxes[0].enabled ? this.createSplitScreenBoxLayout(boxes[0]) : this.createInvisibleBoxLayer(),
      b: boxes[1].enabled ? this.createSplitScreenBoxLayout(boxes[1]) : this.createInvisibleBoxLayer(),
      c: boxes[2].enabled ? this.createSplitScreenBoxLayout(boxes[2]) : this.createInvisibleBoxLayer(),
      d: boxes[3].enabled ? this.createSplitScreenBoxLayout(boxes[3]) : this.createInvisibleBoxLayer()
    }
  }

  private createSplitScreenBoxLayout(box: SplitScreenBoxProperties): TriCasterLayer {
    return {
      input: this.mapInputToTriCasterInput(box.source),
      positioningAndCropEnabled: true,
      position: this.atemToTriCasterSplitScreenConverter.convertPosition(box.x, box.y),
      scale: this.atemToTriCasterSplitScreenConverter.convertScale(box.size),
      crop: this.atemToTriCasterSplitScreenConverter.convertCrop(box)
    }
  }

  private createInvisibleBoxLayer(): TriCasterLayer {
    return {
      input: this.mapInputToTriCasterInput(AtemSourceIndex.BLACK),
      positioningAndCropEnabled: true,
      position: {
        x: -3.555,
        y: -2
      },
      crop: {
        down: 0,
        up: 0,
        left: 0,
        right: 0
      }
    }
  }

  public createSplitScreenPropertiesTimelineObject(configuration: Tv2BlueprintConfiguration, _layoutProperties: SplitScreenLayoutProperties): TriCasterMixEffectTimelineObject {
    return {
      id: `${TRI_CASTER_PREFIX}split_screen_properties`,
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2TriCasterLayer.SPLIT_SCREEN,
      content: {
        deviceType: DeviceType.TRICASTER,
        type: TriCasterType.ME,
        me: {
          type: TriCasterMixEffectContentType.DOWNSTREAM_KEYER,
          keyers: {
            dsk1: {
              input: this.mapInputToTriCasterInput(configuration.studio.videoMixerBasicConfiguration.splitScreenArtFillSource),
              onAir: true,
            }
          }
        }
      }
    }
  }

  public createCutTransitionEffectTimelineObjects(sourceInput: number): TriCasterMixEffectTimelineObject[] {
    return [
      this.createTransitionEffectTimelineObject(Tv2TriCasterLayer.PROGRAM, sourceInput, TriCasterTransition.CUT),
      this.createTransitionEffectTimelineObject(Tv2TriCasterLayer.CLEAN_FEED, sourceInput, TriCasterTransition.CUT)
    ]
  }

  private createTransitionEffectTimelineObject(layer: Tv2TriCasterLayer, sourceInput: number, transitionEffect: TriCasterTransition, durationInFrames?: number): TriCasterMixEffectTimelineObject {
    return {
      id: `${layer}_${transitionEffect}`,
      enable: {
        start: 0
      },
      layer,
      priority: 10,
      content: {
        deviceType: DeviceType.TRICASTER,
        type: TriCasterType.ME,
        me: {
          type: TriCasterMixEffectContentType.PROGRAM,
          programInput: this.mapInputToTriCasterInput(sourceInput),
          transitionEffect,
          transitionDuration: this.convertFramesToSeconds(durationInFrames ?? 0)
        }
      }
    }
  }

  public createMixTransitionEffectTimelineObjects(sourceInput: number, durationInFrames: number): TriCasterMixEffectTimelineObject[] {
    return [
      this.createTransitionEffectTimelineObject(Tv2TriCasterLayer.PROGRAM, sourceInput, TriCasterTransition.FADE, durationInFrames),
      this.createTransitionEffectTimelineObject(Tv2TriCasterLayer.CLEAN_FEED, sourceInput, TriCasterTransition.FADE, durationInFrames)
    ]
  }

  public createDipTransitionEffectTimelineObjects(sourceInput: number, durationInFrames: number, _dipInput: number): TriCasterMixEffectTimelineObject[] {
    return [
      this.createTransitionEffectTimelineObject(Tv2TriCasterLayer.PROGRAM, sourceInput, TriCasterTransition.DIP, durationInFrames),
      this.createTransitionEffectTimelineObject(Tv2TriCasterLayer.CLEAN_FEED, sourceInput, TriCasterTransition.DIP, durationInFrames)
    ]
  }

  public getProgramLayer(): string {
    return Tv2TriCasterLayer.PROGRAM
  }

  public getSplitScreenBoxesLayer(): string {
    return Tv2TriCasterLayer.SPLIT_SCREEN_BOXES
  }

  public getSplitScreenSourceInput(): number {
    // We are returning the Atem index because it will be given to 'createProgramTimelineObject()' etc which expects the Atem values...
    return AtemSourceIndex.SUPER_SOURCE
  }

  public findProgramSourceInputFromPiece(piece: Piece): number | undefined {
    const timelineObject: TimelineObject | undefined = piece.timelineObjects.find(timelineObject => timelineObject.layer === Tv2TriCasterLayer.PROGRAM)
    if (!timelineObject) {
      this.logger.data(piece).warn(`Unable to update the TriCaster input, since no timeline object was found on the layer '${Tv2TriCasterLayer.PROGRAM}' on the piece with id '${piece.id}'`)
      return
    }

    const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
    if (blueprintTimelineObject.content.deviceType !== DeviceType.TRICASTER || blueprintTimelineObject.content.type !== TriCasterType.ME) {
      this.logger.data({ piece, timelineObject }).warn('Unable to update TriCaster ME input, since the timeline object is not targeting a TriCaster ME')
      return
    }

    const triCasterMixEffectObject: TriCasterMixEffectTimelineObject = blueprintTimelineObject as TriCasterMixEffectTimelineObject
    if (triCasterMixEffectObject.content.me.type !== TriCasterMixEffectContentType.PROGRAM) {
      this.logger.data({ piece, triCasterMixEffectObject }).warn('Unable to update TriCaster ME input, since the timeline object is not targeting PROGRAM')
      return
    }
    const programContent: TriCasterMixEffectProgramContent = triCasterMixEffectObject.content.me as TriCasterMixEffectProgramContent
    return this.mapTriCasterInputToNumber(programContent.programInput)
  }

  /**
   * Sofie is unfortunately (at the time of writing) designed with an Atem in mind.
   * This means that we need to convert the TriCaster input into an "Atem accepted value" so the rest of the system can work with it.
   */
  private mapTriCasterInputToNumber(input: string): number {
    if (input.match(/^input/g)) {
      const strippedInput: string = input.replace(/^\D+/g, '')
      return Number(strippedInput)
    }
    switch (input) {
      case TriCasterSourceIndex.BLACK: {
        return AtemSourceIndex.BLACK
      }
      case TriCasterSourceIndex.V1: {
        return AtemSourceIndex.ME1_PROGRAM
      }
      case TriCasterSourceIndex.V2: {
        return AtemSourceIndex.ME2_PROGRAM
      }
      case TriCasterSourceIndex.V3: {
        return AtemSourceIndex.ME3_PROGRAM
      }
      case TriCasterSourceIndex.V4: {
        return AtemSourceIndex.ME4_PROGRAM
      }
      case TriCasterSourceIndex.BFR1: {
        return AtemSourceIndex.COLOR_GENERATOR1
      }
      case TriCasterSourceIndex.BFR2: {
        return AtemSourceIndex.COLOR_GENERATOR2
      }
      default: {
        return AtemSourceIndex.BLACK
      }
    }
  }
}
