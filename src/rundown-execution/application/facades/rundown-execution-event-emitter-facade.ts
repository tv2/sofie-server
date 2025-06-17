import {RundownEventEmitter} from '../interfaces/rundown-event-emitter'
import {RundownEventService} from '../services/rundown-event-service'
import {RundownExecutionEventBuilderFacade} from './rundown-execution-event-builder-facade'
import {RundownEventObserver} from '../interfaces/rundown-event-observer'
import {ConfigurationEventEmitter} from '../interfaces/configuration-event-emitter'
import {ConfigurationEventService} from '../services/configuration-event-service'
import {ConfigurationEventObserver} from '../interfaces/configuration-event-observer'
import {DeviceEventEmitter} from '../interfaces/device-event-emitter'
import {DeviceEventService} from '../services/device-event-service'
import {DeviceEventObserver} from '../interfaces/device-event-observer'
import {PlayoutContentEventEmitter} from '../interfaces/playout-content-event-emitter'
import {PlayoutContentEventService} from '../services/playout-content-event-service'
import {PlayoutContentEventObserver} from '../interfaces/playout-content-event-observer'

export class RundownExecutionEventEmitterFacade {

  public static getRundownEventEmitter(): RundownEventEmitter {
    return RundownEventService.getInstance(RundownExecutionEventBuilderFacade.getRundownEventBuilder())
  }

  public static getRundownEventObserver(): RundownEventObserver {
    return RundownEventService.getInstance(RundownExecutionEventBuilderFacade.getRundownEventBuilder())
  }

  public static getConfigurationEventEmitter(): ConfigurationEventEmitter {
    return ConfigurationEventService.getInstance(RundownExecutionEventBuilderFacade.getConfigurationEventBuilder())
  }

  public static getConfigurationEventObserver(): ConfigurationEventObserver {
    return ConfigurationEventService.getInstance(RundownExecutionEventBuilderFacade.getConfigurationEventBuilder())
  }

  public static getDeviceEventEmitter(): DeviceEventEmitter {
    return DeviceEventService.getInstance(RundownExecutionEventBuilderFacade.getDeviceEventBuilder())
  }

  public static getDeviceEventObserver(): DeviceEventObserver {
    return DeviceEventService.getInstance(RundownExecutionEventBuilderFacade.getDeviceEventBuilder())
  }

  public static getPlayoutContentEventEmitter(): PlayoutContentEventEmitter {
    return PlayoutContentEventService.getInstance(RundownExecutionEventBuilderFacade.getPlayoutContentEventBuilder())
  }

  public static getPlayoutContentEventObserver(): PlayoutContentEventObserver {
    return PlayoutContentEventService.getInstance(RundownExecutionEventBuilderFacade.getPlayoutContentEventBuilder())
  }
}