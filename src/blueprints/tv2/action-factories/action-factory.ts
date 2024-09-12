import { Action } from '../../../model/entities/action'

export abstract class ActionFactory {
  protected sanitizeStringForId(value: string): string {
    return value.replaceAll(/\s/g, '_').replaceAll('/', '_')
  }

  protected removeDuplicateActions<ActionType extends Action>(actions: ActionType[]): ActionType[] {
    return actions
      .toSorted((actionA, actionB) => actionA.rank - actionB.rank)
      .reduce<ActionType[]>((actions, actionToAdd) => actions.some(action => action.id === actionToAdd.id) ? actions : [...actions, actionToAdd], [])
  }
}
