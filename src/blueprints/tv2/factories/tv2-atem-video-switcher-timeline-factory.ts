import {
  Tv2VideoSwitcherTimelineObjectFactory
} from '../value-objects/factories/tv2-video-switcher-timeline-object-factory'
import { Tv2DownstreamKeyer } from '../value-objects/tv2-studio-blueprint-configuration'
import { AtemDownstreamKeyerTimelineObject, AtemType } from '../../timeline-state-resolver-types/atem-types'
import { Tv2AtemLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'

export class Tv2AtemVideoSwitcherTimelineFactory implements Tv2VideoSwitcherTimelineObjectFactory {
  public createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, layer: string, onAir: boolean): AtemDownstreamKeyerTimelineObject {
    return {
      id: '',
      enable: {
        while: 1
      },
      priority: 10,
      layer,
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
            clip: downstreamKeyer.Clip * 10, // input is percents (0-100), atem uses 1-000
            gain: downstreamKeyer.Gain * 10, // input is percents (0-100), atem uses 1-000
            mask: {
              enable: false
            }
          }
        }
      }
    }
  }

  public getDownstreamKeyerLayerPrefix(): string {
    return Tv2AtemLayer.DOWNSTREAM_KEYER
  }
}