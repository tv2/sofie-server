import { Tv2RobotTimelineObjectFactory } from './interfaces/tv2-robot-timeline-object-factory'
import {
  TelemetricsCallPresetTimelineObject,
  TelemetricsType
} from '../../timeline-state-resolver-types/telemetrics-type'
import { Tv2TelemetricsLayer } from '../value-objects/tv2-layers'
import { DeviceType } from '../../../model/enums/device-type'

export class Tv2TelemetricsTimelineObjectFactory implements Tv2RobotTimelineObjectFactory {

  public createCallPresetTimelineObject(preset: number): TelemetricsCallPresetTimelineObject {
    return {
      id: `telemetrics_call_preset_${preset}_${Math.floor(Math.random() * 1000)}`,
      enable: {
        start: 0
      },
      layer: Tv2TelemetricsLayer.CALL_PRESET,
      content: {
        deviceType: DeviceType.TELEMETRICS,
        type: TelemetricsType.CALL_PRESET,
        presetShotIdentifier: [preset]
      }
    }
  }
}
