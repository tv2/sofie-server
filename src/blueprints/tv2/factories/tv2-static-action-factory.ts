import { Action } from '../../../model/entities/action'

export class Tv2StaticActionFactory {
  public createStaticActions(/*blueprintConfiguration: Tv2BlueprintConfiguration*/): Action[] {
    return [
      // this.createDskOneOnAction(),
      // this.createFadePersistedAudioAction(),
    ]
  }



  //
  // private createFadePersistedAudioAction(): Action {
  //
  // }
  //

  //
  // // Todo: Find out what 'Dsk' stands for and write it out.
  // private createDskOneOnAction(): Action {
  //
  // }
}