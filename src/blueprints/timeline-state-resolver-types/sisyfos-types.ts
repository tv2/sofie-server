import { DeviceType } from '../../model/enums/device-type'
import { TimelineObject } from '../../model/entities/timeline-object'

// These values are taken from TSR
export type SisyfosTimelineObject = SisyfosChannelTimelineObject | SisyfosChannelsTimelineObject

export interface SisyfosChannelTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.SISYFOS;
    type: SisyfosType.CHANNEL;
    resync?: boolean
  } & SisyfosChannelOptions;
}

export interface SisyfosChannelsTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.SISYFOS;
    type: SisyfosType.CHANNELS;
    channels: ({
      /** The mapping layer to look up the channel from */
      mappedLayer: string;
    } & SisyfosChannelOptions)[];
    overridePriority?: number;
  }
}

export enum SisyfosType {
  CHANNEL = 'channel',
  CHANNELS = 'channels',
  TRIGGER_VALUE = 'triggerValue'
}

export interface SisyfosChannelOptions {
  isPgm?: SisyfosFaderState;
  faderLevel?: number;
  label?: string;
  visible?: boolean;
  fadeTime?: number;
}

export enum SisyfosFaderState {
  OFF = 0,
  ON = 1,
  VOICE_OVER = 2
}
