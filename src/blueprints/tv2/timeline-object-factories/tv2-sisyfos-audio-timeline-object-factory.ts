import { Tv2AudioTimelineObjectFactory } from './interfaces/tv2-audio-timeline-object-factory'
import {
  SisyfosChannelsTimelineObject,
  SisyfosChannelTimelineObject,
  SisyfosFaderState,
  SisyfosTimelineObject,
  SisyfosType
} from '../../timeline-state-resolver-types/sisyfos-types'
import { Tv2SisyfosLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { EmptyTimelineObject } from '../../timeline-state-resolver-types/abstract-types'
import { Tv2VideoClipManifestData } from '../value-objects/tv2-action-manifest-data'
import { Tv2SourceMappingWithSound } from '../value-objects/tv2-studio-blueprint-configuration'
import { Tv2AudioMode } from '../enums/tv2-audio-mode'

export class Tv2SisyfosAudioTimelineObjectFactory implements Tv2AudioTimelineObjectFactory {
  public createTimelineObjectsForSource(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound, audioMode?: Tv2AudioMode): SisyfosTimelineObject[] {
    const sisyfosChannelTimelineObjects: SisyfosChannelTimelineObject[] = source.SisyfosLayers.map(sisyfosLayer => {
      return {
        id: `${source._id}_${this.generateRandomWholeNumber()}`,
        enable: {
          start: 0
        },
        layer: sisyfosLayer,
        content: {
          deviceType: DeviceType.SISYFOS,
          type: SisyfosType.CHANNEL,
          isPgm: audioMode === Tv2AudioMode.VOICE_OVER ? SisyfosFaderState.VOICE_OVER: SisyfosFaderState.ON
        }
      }
    })

    if (!source.StudioMics) {
      return sisyfosChannelTimelineObjects
    }

    return [
      ...sisyfosChannelTimelineObjects,
      this.createStudioMicrophonesTimelineObject(configuration)
    ]
  }

  private generateRandomWholeNumber(): number {
    return Math.floor(Math.random() * 10000)
  }

  private createStudioMicrophonesTimelineObject(configuration: Tv2BlueprintConfiguration): SisyfosChannelsTimelineObject {
    const priority: number = configuration.studio.StudioMics ? 2 : 0
    const overridePriority: number = 2
    return this.buildStudioMicrophonesTimelineObject(configuration, SisyfosFaderState.ON, priority, overridePriority)
  }

  public createStudioMicrophonesDownTimelineObject(configuration: Tv2BlueprintConfiguration): SisyfosChannelsTimelineObject {
    const priority: number = 10
    return this.buildStudioMicrophonesTimelineObject(configuration, SisyfosFaderState.OFF, priority, priority)
  }

  public createStudioMicrophonesUpTimelineObject(configuration: Tv2BlueprintConfiguration): SisyfosChannelsTimelineObject {
    const priority: number = 10
    return this.buildStudioMicrophonesTimelineObject(configuration, SisyfosFaderState.ON, priority, priority)
  }

  private buildStudioMicrophonesTimelineObject(configuration: Tv2BlueprintConfiguration, sisyfosFaderState:  SisyfosFaderState, priority: number, overridePriority: number): SisyfosChannelsTimelineObject {
    return {
      id: `studio_microphones_${this.generateRandomWholeNumber()}`,
      enable: {
        start: 0
      },
      priority,
      layer: Tv2SisyfosLayer.STUDIO_MICS,
      content: {
        deviceType: DeviceType.SISYFOS,
        type: SisyfosType.CHANNELS,
        channels: configuration.studio.StudioMics.map(studioMicrophoneLayer => ({
          mappedLayer: studioMicrophoneLayer,
          isPgm: sisyfosFaderState
        })),
        overridePriority
      }
    }
  }

  public createResynchronizeTimelineObject(): SisyfosChannelTimelineObject {
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

  public createVideoClipAudioTimelineObjects(configuration: Tv2BlueprintConfiguration, videoClipData: Tv2VideoClipManifestData): SisyfosTimelineObject[] {
    const serverPendingTimelineObject: SisyfosChannelTimelineObject = {
      id: `sisyfos_server_pending_${videoClipData.fileName}`,
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2SisyfosLayer.SOURCE_CLIP_PENDING,
      content: {
        deviceType: DeviceType.SISYFOS,
        type: SisyfosType.CHANNEL,
        isPgm: videoClipData.audioMode ? SisyfosFaderState.VOICE_OVER : SisyfosFaderState.ON
      }
    }

    const sisyfosServerTimelineObjects: SisyfosTimelineObject[] = [
      serverPendingTimelineObject
    ]

    if (videoClipData.audioMode) {
      sisyfosServerTimelineObjects.push(this.createStudioMicrophonesTimelineObject(configuration))
    }

    return sisyfosServerTimelineObjects
  }

  public createBreakerAudioTimelineObject(): SisyfosChannelTimelineObject {
    return {
      id: 'breaker_sisyfos',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2SisyfosLayer.BREAKER,
      content: {
        deviceType: DeviceType.SISYFOS,
        type: SisyfosType.CHANNEL,
        isPgm: 1
      }
    }
  }

  public getAudioDeviceType(): DeviceType {
    return DeviceType.SISYFOS
  }
}
