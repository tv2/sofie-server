import { Tv2GraphicsCommandTimelineObjectFactory } from './interfaces/tv2-graphics-command-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { EmptyTimelineObject } from '../../timeline-state-resolver-types/abstract-types'
import { DeviceType } from '../../../model/enums/device-type'

export class Tv2EmptyGraphicsCommandTimelineObjectFactory implements Tv2GraphicsCommandTimelineObjectFactory {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createAllOutGraphicsTimelineObject(_blueprintConfiguration: Tv2BlueprintConfiguration): EmptyTimelineObject {
    return this.createNeverTimelineObject()
  }

  private createNeverTimelineObject(): EmptyTimelineObject {
    return {
      id: '',
      enable: { while: 0 },
      layer: '',
      content: {
        deviceType: DeviceType.ABSTRACT,
        type: 'empty'
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createClearGraphicsTimelineObject(_blueprintConfiguration: Tv2BlueprintConfiguration): EmptyTimelineObject {
    return this.createNeverTimelineObject()
  }

  public createContinueGraphicsTimelineObject(): EmptyTimelineObject {
    return this.createNeverTimelineObject()
  }

  public createOverlayInitializeTimelineObject(): EmptyTimelineObject {
    return this.createNeverTimelineObject()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createThemeOutTimelineObject(_blueprintConfiguration: Tv2BlueprintConfiguration): EmptyTimelineObject {
    return this.createNeverTimelineObject()
  }
}
