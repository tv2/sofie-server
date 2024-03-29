import {
  Tv2VideoMixerTimelineObjectFactory,
  VideoMixerWipeTransitionSettings
} from './interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2DownstreamKeyer } from '../value-objects/tv2-studio-blueprint-configuration'
import {
  AtemAuxTimelineObject,
  AtemDownstreamKeyerTimelineObject,
  AtemMeTimelineObject,
  AtemMeUpstreamKeyersTimelineObject,
  AtemMeWipePattern,
  AtemSuperSourcePropertiesTimelineObject,
  AtemSuperSourceTimelineObject,
  AtemTransition,
  AtemType,
  SuperSourceBorder,
  SuperSourceProperties
} from '../../timeline-state-resolver-types/atem-types'
import { Tv2AtemLayer, Tv2VideoMixerLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import {
  SplitScreenBoxProperties,
  SplitScreenLayoutProperties
} from '../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Piece } from '../../../model/entities/piece'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Tv2BlueprintTimelineObject } from '../value-objects/tv2-metadata'
import { Tv2Logger } from '../tv2-logger'

const ATEM_SUPER_SOURCE_INDEX: number = 6000
const ATEM_PREFIX: string = 'atem_'

export class Tv2AtemVideoMixerTimelineObjectFactory implements Tv2VideoMixerTimelineObjectFactory {
  private readonly logger: Tv2Logger

  constructor(logger: Tv2Logger) {
    this.logger = logger.tag(Tv2AtemVideoMixerTimelineObjectFactory.name)
  }

  public createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): AtemDownstreamKeyerTimelineObject {
    const downstreamKeyerNumber: number = downstreamKeyer.index + 1
    return {
      id: `${ATEM_PREFIX}downstreamKeyer${downstreamKeyerNumber}`,
      enable: {
        start: 0
      },
      priority: 10,
      layer: `${this.getDownstreamKeyerLayerPrefix()}_${downstreamKeyerNumber}`,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.DSK,
        dsk: {
          onAir,
          sources: {
            fillSource: downstreamKeyer.videoMixerFillSource,
            cutSource: downstreamKeyer.videoMixerKeySource
          },
          properties: {
            clip: this.convertPercentageToAtemPercentageValue(downstreamKeyer.videoMixerClip),
            gain: this.convertPercentageToAtemPercentageValue(downstreamKeyer.videoMixerGain),
            mask: {
              enable: false
            }
          }
        }
      }
    }
  }

  /**
   * @return The percentage given converted to percentage used by Atem (1-1000)
   */
  private convertPercentageToAtemPercentageValue(percentage: number): number {
    return percentage * 10
  }

  private getDownstreamKeyerLayerPrefix(): string {
    return Tv2AtemLayer.DOWNSTREAM_KEYER
  }

  public createUpstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, enable: TimelineEnable): AtemMeUpstreamKeyersTimelineObject {
    const downstreamKeyerNumber: number = downstreamKeyer.index + 1
    return {
      id: `${ATEM_PREFIX}upstreamKeyer${downstreamKeyerNumber}`,
      enable,
      priority: 1,
      layer: Tv2AtemLayer.CLEAN_UPSTREAM_KEYER,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.ME,
        me: {
          upstreamKeyers: [
            {
              upstreamKeyerId: downstreamKeyer.index,
              onAir: true,
              mixEffectKeyType: 0,
              flyEnabled: false,
              fillSource: downstreamKeyer.videoMixerFillSource,
              cutSource: downstreamKeyer.videoMixerKeySource,
              maskEnabled: false,
              lumaSettings: {
                clip: this.convertPercentageToAtemPercentageValue(downstreamKeyer.videoMixerClip),
                gain: this.convertPercentageToAtemPercentageValue(downstreamKeyer.videoMixerGain),
              }
            }
          ]
        }
      }
    }
  }

  public createProgramTimelineObject(sourceInput: number, enable: TimelineEnable): AtemMeTimelineObject {
    return this.createAtemMeTimelineObjectForLayer(
      `${ATEM_PREFIX}program`,
      Tv2AtemLayer.PROGRAM,
      enable,
      {
        input: sourceInput,
        transition: AtemTransition.CUT
      })
  }


  public createProgramTimelineObjectWithWipeTransition(sourceInput: number, enable: TimelineEnable, transitionSettings: VideoMixerWipeTransitionSettings): Tv2BlueprintTimelineObject {
    return this.createAtemMeTimelineObjectForLayer(
      `${ATEM_PREFIX}program`,
      Tv2AtemLayer.PROGRAM,
      enable,
      {
        input: sourceInput,
        transition: AtemTransition.WIPE,
        transitionSettings: this.createAtemMeWipeTransitionSettings(transitionSettings)
      })
  }

  private createAtemMeWipeTransitionSettings(transitionSettings: VideoMixerWipeTransitionSettings): AtemMeTimelineObject['content']['me']['transitionSettings'] {
    return {
      wipe: {
        rate: transitionSettings.frameRate,
        pattern: AtemMeWipePattern.TOP_TO_BOTTOM_BAR,
        reverseDirection: true,
        borderSoftness: transitionSettings.borderSoftness
      }
    }
  }

  private createAtemMeTimelineObjectForLayer(id: string, layer: Tv2AtemLayer, enable: TimelineEnable, me: AtemMeTimelineObject['content']['me']): AtemMeTimelineObject {
    return {
      id,
      enable,
      priority: 1,
      layer,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.ME,
        me
      }
    }
  }

  public createCleanFeedTimelineObject(sourceInput: number, enable: TimelineEnable): AtemMeTimelineObject {
    return this.createAtemMeTimelineObjectForLayer(
      `${ATEM_PREFIX}clean_feed`,
      Tv2AtemLayer.CLEAN_FEED,
      enable,
      {
        input: sourceInput,
        transition: AtemTransition.CUT,
      })
  }

  public createCleanFeedTimelineObjectWithWipeTransition(sourceInput: number, enable: TimelineEnable, transitionSettings: VideoMixerWipeTransitionSettings): Tv2BlueprintTimelineObject {
    return this.createAtemMeTimelineObjectForLayer(
      `${ATEM_PREFIX}clean_feed`,
      Tv2AtemLayer.CLEAN_FEED,
      enable,
      {
        input: sourceInput,
        transition: AtemTransition.WIPE,
        transitionSettings: this.createAtemMeWipeTransitionSettings(transitionSettings)
      })
  }

  public createLookaheadTimelineObject(sourceInput: number, enable: TimelineEnable): AtemAuxTimelineObject {
    return {
      id: `${ATEM_PREFIX}lookahead`,
      enable,
      priority: 0,
      layer: Tv2AtemLayer.LOOKAHEAD,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.AUX,
        aux: {
          input: sourceInput
        }
      }
    }
  }

  public createSplitScreenBoxesTimelineObject(boxes: SplitScreenBoxProperties[], priority: number = 1): AtemSuperSourceTimelineObject {
    return {
      id: `${ATEM_PREFIX}split_screen_boxes`,
      enable: {
        start: 0
      },
      priority,
      layer: Tv2AtemLayer.SPLIT_SCREEN_BOXES,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.SUPER_SOURCE,
        ssrc: {
          boxes
        }
      }
    }
  }

  public createSplitScreenPropertiesTimelineObject(configuration: Tv2BlueprintConfiguration, layoutProperties: SplitScreenLayoutProperties): AtemSuperSourcePropertiesTimelineObject {
    const superSourceProperties: SuperSourceProperties = this.getSuperSourceProperties(layoutProperties)
    const superSourceBorder: SuperSourceBorder = this.getSuperSourceBorder(layoutProperties)

    return {
      id: `${ATEM_PREFIX}split_screen_properties`,
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2AtemLayer.SPLIT_SCREEN,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.SUPER_SOURCE_PROPERTIES,
        ssrcProps: {
          artFillSource: configuration.studio.videoMixerBasicConfiguration.splitScreenArtFillSource,
          artCutSource: configuration.studio.videoMixerBasicConfiguration.splitScreenArtKeySource,
          artOption: 1,
          ...superSourceProperties,
          ...superSourceBorder
        }
      }
    }
  }

  private getSuperSourceProperties(layoutProperties: SplitScreenLayoutProperties): SuperSourceProperties {
    return layoutProperties.properties && !layoutProperties.properties.artPreMultiplied
      ? {
        artPreMultiplied: false,
        artInvertKey: layoutProperties.properties.artInvertKey,
        artClip: layoutProperties.properties.artClip * 10,
        artGain: layoutProperties.properties.artGain * 10
      }
      : {
        artPreMultiplied: true
      }
  }

  private getSuperSourceBorder(layoutProperties: SplitScreenLayoutProperties): SuperSourceBorder {
    return layoutProperties.border?.borderEnabled
      ? {
        ...layoutProperties.border
      }
      : {
        borderEnabled: false
      }
  }

  public getSplitScreenBoxesLayer(): string {
    return Tv2AtemLayer.SPLIT_SCREEN_BOXES
  }

  public getSplitScreenSourceInput(): number {
    return ATEM_SUPER_SOURCE_INDEX
  }

  public findProgramSourceInputFromPiece(piece: Piece): number | undefined {
    const timelineObject: TimelineObject | undefined = piece.timelineObjects.find(timelineObject => timelineObject.layer === Tv2AtemLayer.PROGRAM)
    if (!timelineObject) {
      this.logger.data({ piece }).warn(`Unable to update the ATEM ME input, since no timeline object was found on the layer '${Tv2AtemLayer.PROGRAM}' on the piece with id '${piece.id}'.`)
      return
    }
    const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
    if (blueprintTimelineObject.content.deviceType !== DeviceType.ATEM || blueprintTimelineObject.content.type !== AtemType.ME) {
      this.logger.data({ piece, timelineObject }).warn('Unable to update ATEM ME input, since the timeline object is not targeting an ATEM ME.')
      return
    }

    const atemMeTimelineObject: AtemMeTimelineObject = blueprintTimelineObject as AtemMeTimelineObject
    return  atemMeTimelineObject.content.me.input
  }

  public createCutTransitionEffectTimelineObject(sourceInput: number): AtemMeTimelineObject {
    const meContent: AtemMeTimelineObject['content']['me'] = {
      input: sourceInput,
      transition: AtemTransition.CUT
    }
    return this.createTransitionEffectTimelineObject(meContent)
  }

  private createTransitionEffectTimelineObject(meContent: AtemMeTimelineObject['content']['me']): AtemMeTimelineObject {
    return {
      id: '',
      enable: {
        start: 0
      },
      layer: Tv2AtemLayer.PROGRAM,
      priority: 10,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.ME,
        me: meContent
      }
    }
  }

  public createMixTransitionEffectTimelineObject(sourceInput: number, durationInFrames: number): AtemMeTimelineObject {
    const meContent: AtemMeTimelineObject['content']['me'] = {
      input: sourceInput,
      transition: AtemTransition.MIX,
      transitionSettings: {
        mix: {
          rate: durationInFrames
        }
      }
    }
    return this.createTransitionEffectTimelineObject(meContent)
  }

  public createDipTransitionEffectTimelineObject(sourceInput: number, durationInFrames: number, dipInput: number): AtemMeTimelineObject {
    const meContent: AtemMeTimelineObject['content']['me'] = {
      input: sourceInput,
      transition: AtemTransition.DIP,
      transitionSettings: {
        dip: {
          rate: durationInFrames,
          input: dipInput
        }
      }
    }
    return this.createTransitionEffectTimelineObject(meContent)
  }

  public createAuxTimelineObject(sourceInput: number, layer: Tv2VideoMixerLayer): AtemAuxTimelineObject {
    return {
      id: `${ATEM_PREFIX}${layer}_input_${sourceInput}_timelineObject`,
      enable: {
        start: 0
      },
      layer: `${ATEM_PREFIX}${layer}`,
      priority: 1,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.AUX,
        aux: {
          input: sourceInput
        }
      }
    }
  }
}
