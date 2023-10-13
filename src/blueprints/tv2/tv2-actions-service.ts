import { BlueprintGenerateActions } from '../../model/value-objects/blueprint'
import { Configuration } from '../../model/entities/configuration'
import { Action, MutateActionMethods } from '../../model/entities/action'
import { Tv2StudioBlueprintConfiguration } from './value-objects/tv2-studio-blueprint-configuration'
import { Tv2BlueprintConfiguration } from './value-objects/tv2-blueprint-configuration'
import { Tv2ShowStyleBlueprintConfiguration } from './value-objects/tv2-show-style-blueprint-configuration'
import { Tv2CameraActionFactory } from './factories/tv2-camera-action-factory'
import { Tv2TransitionActionFactory } from './factories/tv2-transition-action-factory'
import { Tv2AudioActionFactory } from './factories/tv2-audio-action-factory'

export class Tv2ActionsService implements BlueprintGenerateActions {
  constructor(
    private readonly cameraActionFactory: Tv2CameraActionFactory,
    private readonly transitionActionFactory: Tv2TransitionActionFactory,
    private readonly audioActionFactory: Tv2AudioActionFactory
  ) {}

  public getMutateActionMethods(action: Action): MutateActionMethods | undefined {
    if (this.transitionActionFactory.isTransitionAction(action)) {
      return this.transitionActionFactory.getMutateActionMethods(action)
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
        this.cameraActionFactory.createInsertCameraAsNextAction(blueprintConfiguration, source),
        this.cameraActionFactory.createInsertCameraAsOnAirAction(blueprintConfiguration, source)
      ])

    const audioActions: Action[] = [
      this.audioActionFactory.createStopAudioBedAction()
    ]

    const transitionActions: Action[] = [
      this.transitionActionFactory.createMixTransitionAction()
    ]

    return [
      ...cameraActions,
      ...audioActions,
      ...transitionActions
    ]
  }
}
