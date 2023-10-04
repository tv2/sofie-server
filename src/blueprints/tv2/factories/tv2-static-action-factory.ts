import { Action } from '../../../model/entities/action'

export class Tv2StaticActionFactory {
  public createStaticActions(/*blueprintConfiguration: Tv2BlueprintConfiguration*/): Action[] {
    return [
      // this.createDskOneOnAction(),
      // this.createResyncSisyfosAction(),
      // this.createFadePersistedAudioAction(),
      // this.createGraphicsClearAction(),
      // this.createGraphicsAlternativeOutAction()
    ]
  }


  //
  // private createGraphicsClearAction(): Action {
  //
  // }
  //
  // private createFadePersistedAudioAction(): Action {
  //
  // }
  //
  // private createGraphicsAlternativeOutAction(): Action {
  //
  // }
  //
  // // Todo: Find out what 'Dsk' stands for and write it out.
  // private createDskOneOnAction(): Action {
  //
  // }
  //
  // private createResyncSisyfosAction(): Action {
  //
  // }
}