import { BlueprintGenerateActions } from '../../model/value-objects/blueprint'
import { Configuration } from '../../model/entities/configuration'
import { Action, MutateActionMethods } from '../../model/entities/action'
import { Tv2StudioBlueprintConfiguration } from './value-objects/tv2-studio-blueprint-configuration'
import { Tv2BlueprintConfiguration } from './value-objects/tv2-blueprint-configuration'
import { Tv2ShowStyleBlueprintConfiguration } from './value-objects/tv2-show-style-blueprint-configuration'
import { Tv2CameraFactory } from './factories/tv2-camera-factory'
import { Tv2TransitionFactory } from './factories/tv2-transition-factory'
import { Tv2AudioFactory } from './factories/tv2-audio-factory'

export class Tv2ActionsService implements BlueprintGenerateActions {

  constructor(
    private readonly cameraFactory: Tv2CameraFactory,
    private readonly transitionFactory: Tv2TransitionFactory,
    private readonly audioFactory: Tv2AudioFactory
  ) {
  }

  public getMutateActionMethods(action: Action): MutateActionMethods | undefined {
    if (this.transitionFactory.isTransitionAction(action)) {
      return this.transitionFactory.getMutateActionMethods(action)
    }
  }

  public generateActions(configuration: Configuration): Action[] {
    const blueprintConfiguration: Tv2BlueprintConfiguration = {
      studio: configuration.studio.blueprintConfiguration as Tv2StudioBlueprintConfiguration,
      showStyle: configuration.showStyle.blueprintConfiguration as Tv2ShowStyleBlueprintConfiguration
    }

    const cameraActions: Action[] = blueprintConfiguration.studio.SourcesCam
      .slice(0, 5)
      .flatMap(source => [
        this.cameraFactory.createInsertCameraAsNextAction(blueprintConfiguration, source),
        this.cameraFactory.createInsertCameraAsOnAirAction(blueprintConfiguration, source)
      ])

    const audioActions: Action[] = [
      this.audioFactory.createStopAudioBedAction()
    ]

    const transitionActions: Action[] = [
      this.transitionFactory.createMixTransitionAction()
    ]

    return [
      ...cameraActions,
      ...audioActions,
      ...transitionActions
    ]
  }
}
