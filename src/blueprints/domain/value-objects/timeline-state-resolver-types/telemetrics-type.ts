import { TimelineObject } from '../../../../rundown-execution/domain/entities/timeline-object'
import { DeviceType } from '../../../../rundown-execution/domain/enums/device-type'

export interface TelemetricsCallPresetTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.TELEMETRICS
    type: TelemetricsType.CALL_PRESET
    presetShotIdentifiers: number[]
  }
}

export enum TelemetricsType {
  CALL_PRESET = 'CALL_PRESET'
}
