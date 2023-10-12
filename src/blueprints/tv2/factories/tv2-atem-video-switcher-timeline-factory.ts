import {
  Tv2VideoSwitcherTimelineObjectFactory
} from '../value-objects/factories/tv2-video-switcher-timeline-object-factory'
import { Tv2DownstreamKeyer } from '../value-objects/tv2-studio-blueprint-configuration'
import { AtemDownstreamKeyerTimelineObject, AtemType } from '../../timeline-state-resolver-types/atem-types'
import { Tv2AtemLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'

export class Tv2AtemVideoSwitcherTimelineFactory implements Tv2VideoSwitcherTimelineObjectFactory {
  public createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): AtemDownstreamKeyerTimelineObject {
    const downstreamKeyerNumber: string = String(downstreamKeyer.Number + 1)
    return {
      id: '',
      enable: {
        while: 1
      },
      priority: 10,
      layer: `${this.getDownstreamKeyerLayerPrefix()}_${downstreamKeyerNumber}`, // Taken from Blueprints.
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
            clip: this.convertPercentageToAtemPercentageValue(downstreamKeyer.Clip), // input is percents (0-100), atem uses 1-000
            gain: this.convertPercentageToAtemPercentageValue(downstreamKeyer.Gain), // input is percents (0-100), atem uses 1-000
            mask: {
              enable: false
            }
          }
        }
      }
    }
  }

  private convertPercentageToAtemPercentageValue(percentage: number): number {
    return percentage * 10
  }

  private getDownstreamKeyerLayerPrefix(): string {
    return Tv2AtemLayer.DOWNSTREAM_KEYER
  }
}