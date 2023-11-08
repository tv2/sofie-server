import { Tv2VideoMixerTimelineObjectFactory } from './interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2DownstreamKeyer } from '../value-objects/tv2-studio-blueprint-configuration'
import {
  AtemAuxTimelineObject,
  AtemDownstreamKeyerTimelineObject,
  AtemMeTimelineObject,
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
import { DveBoxProperties, DveLayoutProperties } from '../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Piece } from '../../../model/entities/piece'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Tv2BlueprintTimelineObject } from '../value-objects/tv2-metadata'

const ATEM_SUPER_SOURCE_INDEX: number = 6000
const ATEM_LAYER_PREFIX: string = 'atem_'

export class Tv2AtemVideoMixerTimelineObjectFactory implements Tv2VideoMixerTimelineObjectFactory {

  public createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): AtemDownstreamKeyerTimelineObject {
    const downstreamKeyerNumber: number = downstreamKeyer.Number + 1
    return {
      id: '',
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
            fillSource: downstreamKeyer.Fill,
            cutSource: downstreamKeyer.Key
          },
          properties: {
            clip: this.convertPercentageToAtemPercentageValue(downstreamKeyer.Clip),
            gain: this.convertPercentageToAtemPercentageValue(downstreamKeyer.Gain),
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

  public createProgramTimelineObject(sourceInput: number, enable: TimelineEnable): AtemMeTimelineObject {
    return {
      id: 'atem_program',
      enable,
      priority: 1,
      layer: Tv2AtemLayer.PROGRAM,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.ME,
        me: {
          input: sourceInput,
          transition: AtemTransition.CUT
        }
      }
    }
  }

  public createCleanFeedTimelineObject(sourceInput: number, enable: TimelineEnable): AtemMeTimelineObject {
    return {
      id: 'atem_cleanFeed',
      enable,
      priority: 1,
      layer: Tv2AtemLayer.CLEAN_FEED,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.ME,
        me: {
          input: sourceInput,
          transition: AtemTransition.CUT
        }
      }
    }
  }

  public createLookaheadTimelineObject(sourceInput: number, enable: TimelineEnable): AtemAuxTimelineObject {
    return {
      id: 'atem_lookahead',
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

  public createDveBoxesTimelineObject(boxes: DveBoxProperties[], priority: number = 1): AtemSuperSourceTimelineObject {
    return {
      id: 'atem_dve_boxes',
      enable: {
        start: 0
      },
      priority,
      layer: Tv2AtemLayer.DVE_BOXES,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.SUPER_SOURCE,
        ssrc: {
          boxes
        }
      }
    }
  }

  public createDvePropertiesTimelineObject(configuration: Tv2BlueprintConfiguration, layoutProperties: DveLayoutProperties): AtemSuperSourcePropertiesTimelineObject {
    const superSourceProperties: SuperSourceProperties = this.getSuperSourceProperties(layoutProperties)
    const superSourceBorder: SuperSourceBorder = this.getSuperSourceBorder(layoutProperties)

    return {
      id: 'atem_dve_properties',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2AtemLayer.DVE,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.SUPER_SOURCE_PROPERTIES,
        ssrcProps: {
          artFillSource: configuration.studio.SwitcherSource.SplitArtFill,
          artCutSource: configuration.studio.SwitcherSource.SplitArtKey,
          artOption: 1,
          ...superSourceProperties,
          ...superSourceBorder
        }
      }
    }
  }

  private getSuperSourceProperties(layoutProperties: DveLayoutProperties): SuperSourceProperties {
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

  private getSuperSourceBorder(layoutProperties: DveLayoutProperties): SuperSourceBorder {
    return layoutProperties.border?.borderEnabled
      ? {
        ...layoutProperties.border
      }
      : {
        borderEnabled: false
      }
  }

  public getDveBoxesLayer(): string {
    return Tv2AtemLayer.DVE_BOXES
  }

  public getDveSourceInput(): number {
    return ATEM_SUPER_SOURCE_INDEX
  }

  public findProgramSourceInputFromPiece(piece: Piece): number | undefined {
    const timelineObject: TimelineObject | undefined = piece.timelineObjects.find(timelineObject => timelineObject.layer === Tv2AtemLayer.PROGRAM)
    if (!timelineObject) {
      console.log(`Can't update Atem Me Input. No TimelineObject for '${Tv2AtemLayer.PROGRAM}' found on Piece '${piece.id}'.`)
      return
    }
    const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
    if (blueprintTimelineObject.content.deviceType !== DeviceType.ATEM || blueprintTimelineObject.content.type !== AtemType.ME) {
      console.log('Can\'t update Atem Me Input. TimelineObject is not an Atem Me TimelineObject.')
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
      id: `${ATEM_LAYER_PREFIX}${layer}_input_${sourceInput}_timelineObject`,
      enable: {
        start: 0
      },
      layer: `${ATEM_LAYER_PREFIX}${layer}`,
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
