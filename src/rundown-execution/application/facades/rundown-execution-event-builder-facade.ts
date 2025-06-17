import {RundownEventBuilder} from '../interfaces/rundown-event-builder'
import {RundownExecutionEventBuilder} from '../services/rundown-execution-event-builder'
import {DeviceEventBuilder} from '../interfaces/device-event-builder'
import {ConfigurationEventBuilder} from '../interfaces/configuration-event-builder'
import {PlayoutContentEventBuilder} from '../interfaces/playout-content-event-builder'

export class RundownExecutionEventBuilderFacade {
  public static getRundownEventBuilder(): RundownEventBuilder {
    return new RundownExecutionEventBuilder()
  }

  public static getDeviceEventBuilder(): DeviceEventBuilder {
    return new RundownExecutionEventBuilder()
  }

  public static getConfigurationEventBuilder(): ConfigurationEventBuilder {
    return new RundownExecutionEventBuilder()
  }

  public static getPlayoutContentEventBuilder(): PlayoutContentEventBuilder {
    return new RundownExecutionEventBuilder()
  }
}