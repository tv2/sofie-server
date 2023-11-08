import { Tv2VideoMixerTimelineObjectFactory } from './interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2DownstreamKeyer } from '../value-objects/tv2-studio-blueprint-configuration'
import {
  AtemAuxTimelineObject,
  AtemDownstreamKeyerTimelineObject,
  AtemMeTimelineObject,
  AtemSuperSourcePropertiesTimelineObject,
  AtemSuperSourceTimelineObject,
  AtemTransition,
  AtemTransitionSettings,
  AtemType,
  SuperSourceBorder,
  SuperSourceProperties
} from '../../timeline-state-resolver-types/atem-types'
import { Tv2AtemLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import { DveBoxProperties, DveLayoutProperties } from '../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'

const ID_PREFIX: string = 'atem_'

export class Tv2AtemVideoMixerTimelineObjectFactory implements Tv2VideoMixerTimelineObjectFactory {
  public createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean, priority: number): AtemDownstreamKeyerTimelineObject {
    const downstreamKeyerNumber: number = downstreamKeyer.Number + 1
    return {
      id: `${ID_PREFIX}downstreamKeyer${downstreamKeyerNumber}`,
      enable: {
        while: 1
      },
      priority,
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
      },
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

  public createUpstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, enable: TimelineEnable): AtemMeTimelineObject {
    const downstreamKeyerNumber: number = downstreamKeyer.Number + 1
    return {
      id: `upstreamKeyer${downstreamKeyerNumber}`,
      enable,
      priority: 1,
      layer: Tv2AtemLayer.CLEAN_UPSTREAM_KEYER,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.ME,
        me: {
          upstreamKeyers: [
            {
              upstreamKeyerId: downstreamKeyer.Number,
              onAir: true,
              mixEffectKeyType: 0,
              flyEnabled: false,
              fillSource: downstreamKeyer.Fill,
              cutSource: downstreamKeyer.Key,
              maskEnabled: false,
              lumaSettings: {
                clip: this.convertPercentageToAtemPercentageValue(downstreamKeyer.Clip),
                gain: this.convertPercentageToAtemPercentageValue(downstreamKeyer.Gain),
              }
            }
          ]
        }
      }
    }
  }

  public createProgramTimelineObject(id: string, sourceInput: number, enable: TimelineEnable, transition: number = AtemTransition.CUT, transitionSettings?: AtemTransitionSettings): AtemMeTimelineObject {
    return this.createAtemMeTimelineObjectForLayer(
      `${ID_PREFIX}${id}`,
      Tv2AtemLayer.PROGRAM,
      enable,
      {
        input: sourceInput,
        transition,
        transitionSettings
      })
  }

  public createCleanFeedTimelineObject(id: string, sourceInput: number, enable: TimelineEnable, transition: number = AtemTransition.CUT, transitionSettings?: AtemTransitionSettings): AtemMeTimelineObject {
    return this.createAtemMeTimelineObjectForLayer(
      `${ID_PREFIX}${id}`,
      Tv2AtemLayer.CLEAN_FEED,
      enable, 
      {
        input: sourceInput,
        transition,
        transitionSettings
      })
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

  public createLookaheadTimelineObject(id: string, sourceInput: number, enable: TimelineEnable): AtemAuxTimelineObject {
    return {
      id: `${ID_PREFIX}${id}`,
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
      id: `${ID_PREFIX}dve_boxes`,
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
      id: `${ID_PREFIX}dve_properties`,
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
}
