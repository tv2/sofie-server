import { TimelineObject } from '../../model/entities/timeline-object'
import { DeviceType } from '../../model/enums/device-type'

export interface TelemetricsCallPresetTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.TELEMETRICS
    type: TelemetricsType.CALL_PRESET
    presetShotIdentifier: number[]
  }
}

export enum TelemetricsType {
  CALL_PRESET = 'CALL_PRESET'
}
