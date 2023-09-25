import { BlueprintGenerateActions } from '../../model/value-objects/blueprint'
import { Configuration } from '../../model/entities/configuration'
import { Action } from '../../model/entities/action'
import { Tv2StudioBlueprintConfiguration } from './value-objects/tv2-studio-blueprint-configuration'
import { Tv2BlueprintConfiguration } from './value-objects/tv2-blueprint-configuration'
import { Tv2ShowStyleBlueprintConfiguration } from './value-objects/tv2-show-style-blueprint-configuration'
import { Tv2CameraFactory } from './factories/tv2-camera-factory'

export class Tv2ActionsService implements BlueprintGenerateActions {

  constructor(private readonly cameraFactory: Tv2CameraFactory) {}

  public generateActions(configuration: Configuration): Action[] {
    const blueprintConfiguration: Tv2BlueprintConfiguration = {
      studio: configuration.studio.blueprintConfiguration as Tv2StudioBlueprintConfiguration,
      showStyle: configuration.showStyle.blueprintConfiguration as Tv2ShowStyleBlueprintConfiguration
    }

    const cameraActions: Action[] = blueprintConfiguration.studio.SourcesCam
      .slice(0, 5)
      .flatMap(source => [
        this.cameraFactory.createInsertCameraAction(blueprintConfiguration, source),
        this.cameraFactory.createInsertAndTakeCameraAction(blueprintConfiguration, source)
      ])

    return [
      ...cameraActions
    ]
  }
}
