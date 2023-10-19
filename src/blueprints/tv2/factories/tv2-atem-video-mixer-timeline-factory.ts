import { Tv2VideoMixerTimelineObjectFactory } from '../value-objects/factories/tv2-video-mixer-timeline-object-factory'
import { Tv2DownstreamKeyer } from '../value-objects/tv2-studio-blueprint-configuration'
import {
  AtemAuxTimelineObject,
  AtemDownstreamKeyerTimelineObject,
  AtemFullPilotTimelineObjectProperties,
  AtemMeTimelineObject,
  AtemType
} from '../../timeline-state-resolver-types/atem-types'
import { Tv2AtemLayer, Tv2SwitcherAuxLayer, Tv2SwitcherMixEffectLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { TimelineObject } from '../../../model/entities/timeline-object'

export class Tv2AtemVideoMixerTimelineFactory implements Tv2VideoMixerTimelineObjectFactory {
  public createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): AtemDownstreamKeyerTimelineObject {
    const downstreamKeyerNumber: number = downstreamKeyer.Number + 1
    return {
      id: '',
      enable: {
        while: 1
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createDownstreamKeyerFullPilotTimelineObjects(_blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject[] {
    return []
  }

  public createFullPilotTimelineObjects(_blueprintConfiguration: Tv2BlueprintConfiguration, properties: AtemFullPilotTimelineObjectProperties): TimelineObject[] {
    return [
      this.createPrimaryMixEffectTimelineObject(Tv2SwitcherMixEffectLayer.PROGRAM, properties),
      this.createPrimaryMixEffectTimelineObject(Tv2SwitcherMixEffectLayer.CLEAN, properties),
      this.createNextAuxTimelineObject(properties)
    ]
  }

  private createNextAuxTimelineObject(properties: AtemFullPilotTimelineObjectProperties): AtemAuxTimelineObject {
    return {
      id: '',
      enable: { start: 0 },
      priority: 0,
      layer: `atem_${Tv2SwitcherAuxLayer.LOOKAHEAD}`,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.AUX,
        aux: {
          input: properties.content.input
        }
      }
    }
  }

  private createPrimaryMixEffectTimelineObject(layer: Tv2SwitcherMixEffectLayer, properties: AtemFullPilotTimelineObjectProperties): AtemMeTimelineObject {
    const id: string = '' // Todo: get hashId value of 'Tv2SwitcherMixEffectLayer.PROGRAM'

    return {
      id,
      enable: properties.enable,
      priority: 1,
      layer,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.ME,
        me: {
          input: properties.content.input,
          transition: properties.content.transition
        }
      }
    }
  }
}