import { Tv2VideoMixerTimelineObjectFactory } from './interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2DownstreamKeyer } from '../value-objects/tv2-studio-blueprint-configuration'
import {
  AtemAuxTimelineObject,
  AtemDownstreamKeyerTimelineObject,
  AtemMeTimelineObject,
  AtemTransitionSettings,
  AtemType
} from '../../timeline-state-resolver-types/atem-types'
import { Tv2AtemLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { TimelineObject } from '../../../model/entities/timeline-object'

export class Tv2AtemVideoMixerTimelineObjectFactory implements Tv2VideoMixerTimelineObjectFactory {
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

  public createNextAuxTimelineObject(input: number): AtemAuxTimelineObject {
    return {
      id: '',
      enable: { start: 0 },
      priority: 0,
      layer: Tv2AtemLayer.LOOKAHEAD,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.AUX,
        aux: {
          input
        }
      }
    }
  }

  public createProgramTimelineObject(start: number, input: number, transition: number, transitionSettings?: AtemTransitionSettings): AtemMeTimelineObject {
    return this.createTimelineObjectForLayer(Tv2AtemLayer.PROGRAM, start, input, transition, transitionSettings)
  }

  public createCleanTimelineObject(start: number, input: number, transition: number, transitionSettings?: AtemTransitionSettings): AtemMeTimelineObject {
    return this.createTimelineObjectForLayer(Tv2AtemLayer.CLEAN, start, input, transition, transitionSettings)
  }

  private createTimelineObjectForLayer(layer: Tv2AtemLayer, start: number, input: number, transition: number, transitionSettings?: AtemTransitionSettings): AtemMeTimelineObject {
    const id: string = '' // Todo: get hashId value of 'layer'

    return {
      id,
      enable: {
        start
      },
      priority: 1,
      layer,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.ME,
        me: {
          input,
          transition,
          transitionSettings
        }
      }
    }
  }
}
