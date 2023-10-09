import { Tv2AudioTimelineObjectFactory } from '../value-objects/factories/tv2-audio-timeline-object-factory'
import {
  SisyfosChannelsTimelineObject,
  SisyfosResynchronizeTimelineObject,
  SisyfosType
} from '../../timeline-state-resolver-types/sisyfos-types'
import { Tv2SisyfosLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { EmptyTimelineObject } from '../../timeline-state-resolver-types/abstract-types'

const enum SisyfosFaderState {
  OFF = 0,
  ON = 1,
  VOICE_OVER = 2
}

export class Tv2SisyfosAudioTimelineObjectFactory implements Tv2AudioTimelineObjectFactory {
  public createMicrophoneDownTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): SisyfosChannelsTimelineObject {
    return this.buildMicrophoneTimelineObject(blueprintConfiguration, SisyfosFaderState.OFF)
  }

  public createMicrophoneUpTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): SisyfosChannelsTimelineObject {
    return this.buildMicrophoneTimelineObject(blueprintConfiguration, SisyfosFaderState.ON)
  }

  private buildMicrophoneTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, isPgm:  SisyfosFaderState): SisyfosChannelsTimelineObject {
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
          isPgm
        })),
        overridePriority: 10
      }
    }
  }

  public createResynchronizeTimelineObject(): SisyfosResynchronizeTimelineObject {
    return {
      id: '',
      enable: {
        start: 0
      },
      priority: 2,
      layer: Tv2SisyfosLayer.RESYNCHRONIZE,
      content: {
        deviceType: DeviceType.SISYFOS,
        type: SisyfosType.CHANNEL,
        resync: true
      }
    }
  }

  public createStopAudioBedTimelineObject(duration: number): EmptyTimelineObject {
    return {
      id: '',
      enable: {
        start: 0,
        duration
      },
      priority: 1,
      layer: Tv2SisyfosLayer.AUDIO_BED,
      content: {
        deviceType: DeviceType.ABSTRACT,
        type: 'empty'
      }
    }
  }

}