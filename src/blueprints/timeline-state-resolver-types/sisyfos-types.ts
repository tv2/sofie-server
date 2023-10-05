import { DeviceType } from '../../model/enums/device-type'
import { TimelineObject } from '../../model/entities/timeline-object'

// These values are taken from TSR
export interface SisyfosChannelTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.SISYFOS;
    type: SisyfosType.CHANNEL;
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

// Todo: Figure out if 'resync' can be changed to `resynchronize`, or if it is the value that Sisyfos expects.
export interface SisyfosResynchronizeTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.SISYFOS;
    type: SisyfosType.CHANNEL;
    resync: boolean
  }
}

export enum SisyfosType {
  CHANNEL = 'channel',
  CHANNELS = 'channels',
  TRIGGER_VALUE = 'triggerValue'
}

export interface SisyfosChannelOptions {
  isPgm?: 0 | 1 | 2;
  faderLevel?: number;
  label?: string;
  visible?: boolean;
  fadeTime?: number;
}
