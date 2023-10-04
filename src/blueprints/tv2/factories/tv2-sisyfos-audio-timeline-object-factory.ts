import { Tv2AudioTimelineObjectFactory } from '../value-objects/factories/tv2-audio-timeline-object-factory'
import { SisyfosChannelsTimelineObject, SisyfosType } from '../../timeline-state-resolver-types/sisyfos-types'
import { Tv2SisyfosLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'

export class Tv2SisyfosAudioTimelineObjectFactory implements Tv2AudioTimelineObjectFactory {
  public createMicrophoneDownTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): SisyfosChannelsTimelineObject {
    return this.createMicrophoneTimelineObject(blueprintConfiguration, 0)
  }

  public createMicrophoneUpTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): SisyfosChannelsTimelineObject {
    return this.createMicrophoneTimelineObject(blueprintConfiguration, 1)
  }

  // Todo: Figure out what 'isPmg' stands for and write full name instead of abbreviation
  private createMicrophoneTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, isPmg:  0 | 1 | 2): SisyfosChannelsTimelineObject {
    return {
      id: '',
      enable: {
        start: 0
      },
      priority: 10,
      layer: Tv2SisyfosLayer.STUDIO_MICS,
      content: {
        deviceType: DeviceType.SISYFOS,
        type: SisyfosType.CHANNELS,
        channels: blueprintConfiguration.studio.StudioMics.map(studioMic => ({
          mappedLayer: studioMic,
          isPgm: isPmg
        })),
        overridePriority: 10
      }
    }
  }

}