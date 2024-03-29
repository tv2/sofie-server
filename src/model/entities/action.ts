import { ActionType, PartActionType, PieceActionType } from '../enums/action-type'
import { Part, PartInterface } from './part'
import { Piece, PieceInterface } from './piece'
import { Media } from './media'
import { InTransition } from '../value-objects/in-transition'

export interface Action {
  id: string
  name: string
  description?: string
  type: ActionType
  data: unknown
  metadata?: unknown
  /**
   * Undefined means the action is a general one. Having a value means the action is for that specific rundown.
   * */
  rundownId?: string
  argument?: ActionArgument
}

export interface ActionArgument {
  name: string
  description: string
  type: ActionArgumentType
}

export enum ActionArgumentType {
  STRING = 'STRING',
  STRING_ARRAY = 'STRING_ARRAY',
  NUMBER = 'NUMBER',
  NUMBER_ARRAY = 'NUMBER_ARRAY'
}

export interface PartAction extends Action {
  type: PartActionType
  data: {
    partInterface: PartInterface,
    pieceInterfaces: PieceInterface[]
  }
}

export interface PieceAction extends Action {
  type: PieceActionType
  data: {
    pieceInterface: PieceInterface
    partInTransition?: InTransition
    layersToStopPiecesOn?: string[]
  }
}

export type MutateActionMethods = MutateActionWithPieceMethods | MutateActionWithMedia | MutateActionWithHistoricPartMethods | MutateActionWithArgumentsMethods

export enum MutateActionType {
  PIECE = 'PIECE',
  MEDIA = 'MEDIA',
  HISTORIC_PART= 'HISTORIC_PART',
  APPLY_ARGUMENTS = 'APPLY_ARGUMENTS'
}

export interface MutateActionWithPieceMethods {
  type: MutateActionType.PIECE
  updateActionWithPiece: (action: Action, piece: Piece) => Action
  piecePredicate: (piece: Piece) => boolean
}

export interface MutateActionWithMedia {
  type: MutateActionType.MEDIA
  updateActionWithMedia: (action: Action, media?: Media) => Action
  getMediaSourceName: () => string
}

export interface MutateActionWithHistoricPartMethods {
  type: MutateActionType.HISTORIC_PART,
  updateActionWithPartData: (action: Action, historicPart: Part, presentPart: Part | undefined) => Action
  partPredicate: (part: Part) => boolean
}

export interface MutateActionWithArgumentsMethods {
  type: MutateActionType.APPLY_ARGUMENTS,
  updateActionWithArguments: (action: Action, actionArguments: unknown) => Action
}

/**
 * Since we don't control Ingest we can't create Actions that requires data from the Ingest Gateway.
 * So we are forced to find the 'Actions' that Core has created and use the data from that to create our own Actions.
 * This interface is so we can retrieve those 'Actions' from the database and send them to Blueprints.
 * The 'actionId' is used to determine the piece type, so Blueprints can distinguish what kind of Actions to make e.g.
 * if the pieceType is PieceType.VIDEO_CLIP then Blueprints knows to create VideoClipActions.
 * The 'data' is the data that Core has saved and is needed by Blueprints to create the specific Action.
 * The 'data' is of type 'unknown' since the data used to create Actions are Blueprints specific. Blueprints will have
 * to map 'data' into whatever structure Blueprints needs.
 */
export interface ActionManifest<Data = unknown> {
  actionId: string
  rundownId: string
  data: Data
}
