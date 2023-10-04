import { BlueprintGenerateActions } from '../../model/value-objects/blueprint'
import { Configuration } from '../../model/entities/configuration'
import { Action, MutateActionMethods } from '../../model/entities/action'
import { Tv2StudioBlueprintConfiguration } from './value-objects/tv2-studio-blueprint-configuration'
import { Tv2BlueprintConfiguration } from './value-objects/tv2-blueprint-configuration'
import {
  GraphicDefault,
  GraphicSetup,
  Tv2ShowStyleBlueprintConfiguration
} from './value-objects/tv2-show-style-blueprint-configuration'
import { Tv2CameraActionFactory } from './factories/tv2-camera-action-factory'
import { Tv2TransitionActionFactory } from './factories/tv2-transition-action-factory'
import { Tv2AudioActionFactory } from './factories/tv2-audio-action-factory'
import { Tv2StaticActionFactory } from './factories/tv2-static-action-factory'
import { Tv2GraphicActionFactory } from './factories/tv2-graphic-action-factory'
import { ShowStyle } from '../../model/entities/show-style'

export class Tv2ActionsService implements BlueprintGenerateActions {

  constructor(
    private readonly cameraActionFactory: Tv2CameraActionFactory,
    private readonly transitionActionFactory: Tv2TransitionActionFactory,
    private readonly audioActionFactory: Tv2AudioActionFactory,
    private readonly staticActionFactory: Tv2StaticActionFactory,
    private readonly graphicActionFactory: Tv2GraphicActionFactory
  ) {
  }

  public getMutateActionMethods(action: Action): MutateActionMethods | undefined {
    if (this.transitionActionFactory.isTransitionAction(action)) {
      return this.transitionActionFactory.getMutateActionMethods(action)
    }
  }

  public generateActions(configuration: Configuration): Action[] {
    const blueprintConfiguration: Tv2BlueprintConfiguration = {
      studio: configuration.studio.blueprintConfiguration as Tv2StudioBlueprintConfiguration,
      showStyle: this.mapToShowStyleBlueprintConfiguration(configuration.showStyle)
    }

    return [
      ...this.cameraActionFactory.createCameraActions(blueprintConfiguration),
      ...this.audioActionFactory.createAudioActions(blueprintConfiguration),
      ...this.transitionActionFactory.createTransitionActions(),
      ...this.staticActionFactory.createStaticActions(), // Todo(ASMA): Split into appropriate factories, and remove.
      ...this.graphicActionFactory.createGraphicsActions(blueprintConfiguration)
    ]
  }

  private mapToShowStyleBlueprintConfiguration(showStyle: ShowStyle): Tv2ShowStyleBlueprintConfiguration {
    const blueprintConfiguration: Tv2ShowStyleBlueprintConfiguration = showStyle.blueprintConfiguration as Tv2ShowStyleBlueprintConfiguration
    blueprintConfiguration.GfxDefaults = (blueprintConfiguration.GfxDefaults as unknown as GraphicDefault[])[0] // Hack to not have saved as array of length 1.

    const graphicSetup: GraphicSetup | undefined = blueprintConfiguration.GfxSetups.find(
      graphicSetup => graphicSetup._id === blueprintConfiguration.GfxDefaults.DefaultSetupName.value
    )
    if (!graphicSetup) {
      console.warn('Failed to find Selected Graphic Setup')
      return blueprintConfiguration
    }
    blueprintConfiguration.selectedGraphicsSetup = graphicSetup
    return blueprintConfiguration
  }
}
